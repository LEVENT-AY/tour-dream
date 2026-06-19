import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchAgentCandidates,
  fetchAgentApplications,
  updateUserSafe,
  updateAgentApplication,
  countAgentListings,
  type AdminUserView,
  type AgentApplication,
} from '../../../core/services/firebaseServices';
import { useAuth } from '../../../core/contexts/AuthContext';

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value.toDate && typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

const AdminAgents: React.FC = () => {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<AdminUserView[]>([]);
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  const [selectedAgent, setSelectedAgent] = useState<AdminUserView | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<AgentApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [agentData, appData] = await Promise.all([
        fetchAgentCandidates(),
        fetchAgentApplications('pending'),
      ]);
      setAgents(agentData);
      setApplications(appData);

      const countMap: Record<string, Record<string, number>> = {};
      await Promise.all(
        agentData.map(async (agent) => {
          countMap[agent.uid] = await countAgentListings(agent.uid);
        })
      );
      setCounts(countMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const text = `${a.displayName || ''} ${a.email || ''} ${a.businessName || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const current = a.agentStatus || (a.approved ? 'approved' : a.role === 'agent' ? 'approved' : 'pending');
      const matchesStatus = statusFilter === 'all' || current === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, search, statusFilter]);

  const nowIso = () => new Date().toISOString();

  const updateAgentUser = async (
    uid: string,
    status: 'approved' | 'rejected' | 'suspended' | 'approved_reactivate',
    reason?: string
  ) => {
    const adminUid = currentUser?.uid;
    if (!adminUid) return;

    const base: Record<string, any> = {
      agentStatus: status === 'approved_reactivate' ? 'approved' : status,
      approved: status === 'approved' || status === 'approved_reactivate',
      suspended: status === 'suspended',
    };

    if (status === 'approved' || status === 'approved_reactivate') {
      base.approvedAt = nowIso();
      base.approvedBy = adminUid;
      base.suspended = false;
    } else if (status === 'rejected') {
      base.rejectedAt = nowIso();
      base.rejectedBy = adminUid;
      base.rejectedReason = reason || '';
      base.suspended = false;
    } else if (status === 'suspended') {
      base.suspendedAt = nowIso();
      base.suspendedBy = adminUid;
    }

    await updateUserSafe(uid, base);
  };

  const handleApproveAgent = async (agent: AdminUserView) => {
    setProcessingId(agent.uid);
    try {
      await updateAgentUser(agent.uid, 'approved');
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectAgent = async (agent: AdminUserView) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    setProcessingId(agent.uid);
    try {
      await updateAgentUser(agent.uid, 'rejected', reason);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspendAgent = async (agent: AdminUserView) => {
    if (!window.confirm(`Suspend ${agent.displayName || agent.email}?`)) return;
    setProcessingId(agent.uid);
    try {
      await updateAgentUser(agent.uid, 'suspended');
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReactivateAgent = async (agent: AdminUserView) => {
    setProcessingId(agent.uid);
    try {
      await updateAgentUser(agent.uid, 'approved_reactivate');
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveApplication = async (app: AgentApplication) => {
    setProcessingId(app.id || app.userId);
    try {
      await updateAgentUser(app.userId, 'approved');
      await updateAgentApplication(app.id!, {
        status: 'approved',
        reviewedAt: nowIso(),
        reviewedBy: currentUser?.uid,
      });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
      setSelectedApplication(null);
    }
  };

  const handleRejectApplication = async (app: AgentApplication) => {
    if (!rejectReason.trim() && !window.confirm('Reject without a reason?')) return;
    setProcessingId(app.id || app.userId);
    try {
      await updateAgentUser(app.userId, 'rejected', rejectReason);
      await updateAgentApplication(app.id!, {
        status: 'rejected',
        reviewedAt: nowIso(),
        reviewedBy: currentUser?.uid,
        rejectedReason: rejectReason,
      });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
      setRejectReason('');
      setSelectedApplication(null);
    }
  };

  const BusinessProfileModal: React.FC<{ agent: AdminUserView; onClose: () => void }> = ({ agent, onClose }) => (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Business Profile</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <dl className="row mb-0">
              <dt className="col-sm-4">Business Name</dt>
              <dd className="col-sm-8">{agent.businessName || '—'}</dd>
              <dt className="col-sm-4">Business Type</dt>
              <dd className="col-sm-8">{agent.businessType || '—'}</dd>
              <dt className="col-sm-4">Address</dt>
              <dd className="col-sm-8">{agent.businessAddress || '—'}</dd>
              <dt className="col-sm-4">Tax Number</dt>
              <dd className="col-sm-8">{agent.taxNumber || '—'}</dd>
              <dt className="col-sm-4">Phone</dt>
              <dd className="col-sm-8">{agent.phone || '—'}</dd>
              <dt className="col-sm-4">Email</dt>
              <dd className="col-sm-8">{agent.email || '—'}</dd>
              <dt className="col-sm-4">Joined</dt>
              <dd className="col-sm-8">{toDate(agent.joinedAt)?.toLocaleDateString() || '—'}</dd>
            </dl>
            <div className="mt-3">
              <strong>Description</strong>
              <p className="mb-0 text-muted">{agent.description || '—'}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );

  const ApplicationModal: React.FC<{ app: AgentApplication; onClose: () => void }> = ({ app, onClose }) => (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Agent Application</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <dl className="row mb-0">
              <dt className="col-sm-3">Applicant</dt>
              <dd className="col-sm-9">{app.displayName} ({app.email})</dd>
              <dt className="col-sm-3">Business Name</dt>
              <dd className="col-sm-9">{app.businessName}</dd>
              <dt className="col-sm-3">Business Type</dt>
              <dd className="col-sm-9">{app.businessType}</dd>
              <dt className="col-sm-3">Address</dt>
              <dd className="col-sm-9">{app.businessAddress}</dd>
              <dt className="col-sm-3">Tax Number</dt>
              <dd className="col-sm-9">{app.taxNumber || '—'}</dd>
              <dt className="col-sm-3">Phone</dt>
              <dd className="col-sm-9">{app.phone || '—'}</dd>
              <dt className="col-sm-3">Submitted</dt>
              <dd className="col-sm-9">{toDate(app.createdAt)?.toLocaleString() || '—'}</dd>
            </dl>
            <div className="mt-3">
              <strong>Description</strong>
              <p className="mb-0 text-muted">{app.description || '—'}</p>
            </div>
            <div className="mt-3">
              <label className="form-label">Rejection reason (optional)</label>
              <textarea
                className="form-control"
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button
              className="btn btn-danger"
              disabled={!!processingId}
              onClick={() => handleRejectApplication(app)}
            >
              {processingId === (app.id || app.userId) ? 'Processing...' : 'Reject'}
            </button>
            <button
              className="btn btn-success"
              disabled={!!processingId}
              onClick={() => handleApproveApplication(app)}
            >
              {processingId === (app.id || app.userId) ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">Agents / Vendors</h3>
      </div>

      {applications.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-white">
            <h5 className="mb-0">Pending Applications ({applications.length})</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Applicant</th>
                    <th>Business Name</th>
                    <th>Business Type</th>
                    <th>Submitted</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="fw-medium">{app.displayName}</div>
                        <div className="small text-muted">{app.email}</div>
                      </td>
                      <td>{app.businessName}</td>
                      <td>{app.businessType}</td>
                      <td>{toDate(app.createdAt)?.toLocaleDateString() || '—'}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-success me-2"
                          disabled={!!processingId}
                          onClick={() => handleApproveApplication(app)}
                        >
                          {processingId === (app.id || app.userId) ? '...' : 'Approve'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger me-2"
                          disabled={!!processingId}
                          onClick={() => {
                            setRejectReason('');
                            setSelectedApplication(app);
                          }}
                        >
                          Reject
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedApplication(app)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-3">
          <div className="flex-grow-1" style={{ minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Agent</th>
                  <th>Business</th>
                  <th>Listings</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No agents found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((agent) => {
                    const current = agent.agentStatus || (agent.approved ? 'approved' : agent.role === 'agent' ? 'approved' : 'pending');
                    const agentCounts = counts[agent.uid] || {};
                    const totalListings = Object.values(agentCounts).reduce((a, b) => a + b, 0);
                    const isProcessing = processingId === agent.uid;
                    return (
                      <tr key={agent.uid}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: '40px', height: '40px', fontSize: '14px' }}
                            >
                              {(agent.displayName || agent.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-medium">{agent.displayName || 'Unnamed'}</div>
                              <div className="small text-muted">{agent.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{agent.businessName || '—'}</td>
                        <td>
                          <span className="badge bg-light text-dark border">{totalListings} listings</span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              current === 'approved'
                                ? 'bg-success'
                                : current === 'suspended' || current === 'rejected'
                                ? 'bg-danger'
                                : 'bg-warning text-dark'
                            }`}
                          >
                            {STATUS_LABEL[current] || current}
                          </span>
                        </td>
                        <td>{toDate(agent.joinedAt)?.toLocaleDateString() || toDate(agent.createdAt)?.toLocaleDateString() || '—'}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-info me-2"
                            onClick={() => setSelectedAgent(agent)}
                          >
                            Details
                          </button>
                          {current !== 'approved' && (
                            <button
                              className="btn btn-sm btn-success me-2"
                              disabled={isProcessing}
                              onClick={() => handleApproveAgent(agent)}
                            >
                              {isProcessing ? '...' : 'Approve'}
                            </button>
                          )}
                          {current !== 'rejected' && current !== 'approved' && (
                            <button
                              className="btn btn-sm btn-outline-danger me-2"
                              disabled={isProcessing}
                              onClick={() => handleRejectAgent(agent)}
                            >
                              {isProcessing ? '...' : 'Reject'}
                            </button>
                          )}
                          {current === 'approved' ? (
                            <button
                              className="btn btn-sm btn-warning"
                              disabled={isProcessing}
                              onClick={() => handleSuspendAgent(agent)}
                            >
                              {isProcessing ? '...' : 'Suspend'}
                            </button>
                          ) : current === 'suspended' ? (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={isProcessing}
                              onClick={() => handleReactivateAgent(agent)}
                            >
                              {isProcessing ? '...' : 'Reactivate'}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedAgent && <BusinessProfileModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />}
      {selectedApplication && <ApplicationModal app={selectedApplication} onClose={() => setSelectedApplication(null)} />}
    </div>
  );
};

export default AdminAgents;
