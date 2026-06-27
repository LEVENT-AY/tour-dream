import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchServiceRequests,
  updateServiceRequestStatus,
  deleteServiceRequest,
  type ServiceRequest,
  type ServiceRequestStatus,
  type ServiceRequestPriority,
} from '../../../core/services/firebaseServices';

const STATUS_OPTIONS: ServiceRequestStatus[] = ['pending', 'contacted', 'confirmed', 'cancelled'];
const PRIORITY_OPTIONS: ServiceRequestPriority[] = ['low', 'normal', 'high', 'urgent'];

const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge bg-light text-secondary',
  normal: 'badge bg-info text-dark',
  high: 'badge bg-warning text-dark',
  urgent: 'badge bg-danger',
};

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  contacted: 'Contacted',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

interface TabItem {
  key: ServiceRequestStatus | 'all';
  label: string;
}

const TABS: TabItem[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const normalizePhone = (phone: string): string => {
  return phone.replace(/[^\d]/g, '');
};

const formatShortDate = (value?: string) => {
  if (!value) return '\u2014';
  try {
    return new Date(value).toLocaleDateString('en-GB');
  } catch {
    return value;
  }
};

interface AdminBookingsProps {
  title?: string;
  defaultStatus?: ServiceRequestStatus | 'all';
}

const AdminBookings: React.FC<AdminBookingsProps> = ({ title = 'All Bookings', defaultStatus = 'all' }) => {
  const [allRequests, setAllRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ServiceRequestStatus | 'all'>(defaultStatus);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [modalStatus, setModalStatus] = useState<ServiceRequestStatus>('pending');
  const [modalPriority, setModalPriority] = useState<ServiceRequestPriority>('normal');
  const [modalAssignedTo, setModalAssignedTo] = useState('');
  const [modalFollowUpDate, setModalFollowUpDate] = useState('');
  const [modalInternalNotes, setModalInternalNotes] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchServiceRequests();
      setAllRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRequests.length };
    STATUS_OPTIONS.forEach((s) => {
      counts[s] = allRequests.filter((r) => r.status === s).length;
    });
    return counts;
  }, [allRequests]);

  const filtered = useMemo(() => {
    let result = allRequests;
    if (activeTab !== 'all') {
      result = result.filter((r) => r.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => {
        const text = `${r.serviceTitle || ''} ${r.customerName || ''} ${r.customerEmail || ''} ${r.customerPhone || ''} ${r.serviceType || ''} ${r.message || ''} ${r.assignedTo || ''}`.toLowerCase();
        return text.includes(q);
      });
    }
    return result;
  }, [allRequests, activeTab, search]);

  const changeStatus = async (id: string, status: ServiceRequestStatus) => {
    setUpdatingId(id);
    try {
      await updateServiceRequestStatus(id, status);
      await load();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    setDeletingId(id);
    try {
      await deleteServiceRequest(id);
      await load();
    } catch (err) {
      console.error('Error deleting request:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const openModal = (r: ServiceRequest) => {
    setSelectedRequest(r);
    setModalStatus(r.status);
    setModalPriority(r.priority || 'normal');
    setModalAssignedTo(r.assignedTo || '');
    setModalFollowUpDate(r.followUpDate || '');
    setModalInternalNotes(r.internalNotes || '');
  };

  const handleModalSave = async () => {
    if (!selectedRequest?.id) return;
    setModalSaving(true);
    try {
      await updateServiceRequestStatus(selectedRequest.id, modalStatus, {
        priority: modalPriority,
        assignedTo: modalAssignedTo || undefined,
        internalNotes: modalInternalNotes || undefined,
        followUpDate: modalFollowUpDate || undefined,
      });
      await load();
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error saving request:', err);
    } finally {
      setModalSaving(false);
    }
  };

  const emptyMessage = () => {
    if (search.trim()) return 'No requests match your search.';
    if (activeTab !== 'all') return `No ${STATUS_LABELS[activeTab]?.toLowerCase() || ''} requests found.`;
    return 'No service requests yet. Requests from the public will appear here.';
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">{title}</h3>
      </div>

      {/* Tabs with counters */}
      <div className="mb-3">
        <ul className="nav nav-pills gap-2 flex-nowrap overflow-auto pb-1">
          {TABS.map((tab) => (
            <li key={tab.key} className="nav-item">
              <button
                className={`nav-link d-flex align-items-center gap-1 ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.key); setSearch(''); }}
              >
                {tab.label}
                {tab.key === 'all' ? (
                  <span className={`badge rounded-pill ${activeTab === 'all' ? 'bg-white text-primary' : 'bg-light text-dark'}`}>
                    {statusCounts[tab.key] ?? 0}
                  </span>
                ) : (
                  <span className={`badge rounded-pill ${
                    activeTab === tab.key
                      ? 'bg-white text-primary'
                      : tab.key === 'pending' ? 'bg-warning text-dark'
                      : tab.key === 'contacted' ? 'bg-info text-dark'
                      : tab.key === 'confirmed' ? 'bg-success'
                      : 'bg-danger'
                  }`}>
                    {statusCounts[tab.key] ?? 0}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-3">
          <div className="flex-grow-1" style={{ minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Date / Guests</th>
                  <th>Message</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      {emptyMessage()}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="fw-medium text-wrap" style={{ maxWidth: '180px' }}>
                          {r.serviceTitle || '\u2014'}
                        </div>
                        <span className="badge bg-light text-dark text-capitalize">
                          {r.serviceType || 'other'}
                        </span>
                      </td>
                      <td>
                        <div>{r.customerName || '\u2014'}</div>
                        <div className="fs-12 text-muted">
                          {r.customerEmail ? (
                            <a href={`mailto:${r.customerEmail}`} className="text-muted text-decoration-none">
                              {r.customerEmail}
                            </a>
                          ) : '\u2014'}
                        </div>
                        <div className="fs-12 text-muted d-flex align-items-center gap-1">
                          {r.customerPhone ? (
                            <>
                              <a href={`tel:${r.customerPhone}`} className="text-muted text-decoration-none">
                                {r.customerPhone}
                              </a>
                              <a
                                href={`https://wa.me/${normalizePhone(r.customerPhone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-success text-decoration-none"
                                title="WhatsApp"
                              >
                                <i className="isax isax-whatsapp fs-14" />
                              </a>
                            </>
                          ) : '\u2014'}
                        </div>
                      </td>
                      <td>
                        <span className={PRIORITY_BADGE[r.priority || 'normal']}>
                          {r.priority || 'normal'}
                        </span>
                      </td>
                      <td>
                        <div className="fs-14">{r.requestedDate || '\u2014'}</div>
                        <div className="fs-12 text-muted">
                          {r.guestsCount ? `${r.guestsCount} guest${r.guestsCount > 1 ? 's' : ''}` : '\u2014'}
                        </div>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }} title={r.message || ''}>
                          {r.message || '\u2014'}
                        </div>
                      </td>
                      <td className="text-nowrap">{formatShortDate(r.createdAt)}</td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${r.status === 'pending' ? 'bg-warning text-dark' : r.status === 'contacted' ? 'bg-info text-dark' : r.status === 'confirmed' ? 'bg-success text-white' : 'bg-danger text-white'}`}
                          value={r.status}
                          disabled={updatingId === r.id}
                          onChange={(e) => changeStatus(r.id!, e.target.value as ServiceRequestStatus)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          className="btn btn-sm btn-light me-1"
                          onClick={() => openModal(r)}
                          title="Details"
                        >
                          <i className="isax isax-eye" />
                        </button>
                        <button
                          className="btn btn-sm btn-light text-danger"
                          disabled={deletingId === r.id}
                          onClick={() => handleDelete(r.id!)}
                          title="Delete"
                        >
                          {deletingId === r.id ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            <i className="isax isax-trash" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div
          ref={modalRef}
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === modalRef.current) setSelectedRequest(null); }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Details</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedRequest(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-1">Service</h6>
                    <p className="mb-0">{selectedRequest.serviceTitle || '\u2014'}</p>
                    <span className="badge bg-light text-dark text-capitalize">
                      {selectedRequest.serviceType || 'other'}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-1">Customer</h6>
                    <p className="mb-0">{selectedRequest.customerName || '\u2014'}</p>
                    {selectedRequest.customerEmail && (
                      <a href={`mailto:${selectedRequest.customerEmail}`} className="fs-14 text-decoration-none">
                        {selectedRequest.customerEmail}
                      </a>
                    )}
                    <div className="d-flex align-items-center gap-2">
                      {selectedRequest.customerPhone && (
                        <>
                          <a href={`tel:${selectedRequest.customerPhone}`} className="fs-14 text-decoration-none">
                            {selectedRequest.customerPhone}
                          </a>
                          <a
                            href={`https://wa.me/${normalizePhone(selectedRequest.customerPhone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-success"
                            title="WhatsApp"
                          >
                            <i className="isax isax-whatsapp fs-16" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-1">Requested Date</h6>
                    <p className="mb-0">{selectedRequest.requestedDate || '\u2014'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-1">Guests</h6>
                    <p className="mb-0">
                      {selectedRequest.guestsCount ? `${selectedRequest.guestsCount} guest${selectedRequest.guestsCount > 1 ? 's' : ''}` : '\u2014'}
                    </p>
                  </div>
                  <div className="col-12">
                    <h6 className="text-muted mb-1">Message</h6>
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.message || '\u2014'}</p>
                  </div>
                  <div className="col-12">
                    <hr className="my-2" />
                    <h6 className="text-muted mb-2">Admin Fields</h6>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-14">Status</label>
                    <select
                      className="form-select"
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as ServiceRequestStatus)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-14">Priority</label>
                    <select
                      className="form-select"
                      value={modalPriority}
                      onChange={(e) => setModalPriority(e.target.value as ServiceRequestPriority)}
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-14">Assigned To</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Staff name"
                      value={modalAssignedTo}
                      onChange={(e) => setModalAssignedTo(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fs-14">Follow-up Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={modalFollowUpDate}
                      onChange={(e) => setModalFollowUpDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fs-14">Created</label>
                    <p className="form-control-plaintext mb-0 pt-1">
                      {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString('en-GB') : '\u2014'}
                    </p>
                  </div>
                  <div className="col-12">
                    <label className="form-label fs-14">Internal Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Admin notes..."
                      value={modalInternalNotes}
                      onChange={(e) => setModalInternalNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setSelectedRequest(null)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  disabled={modalSaving}
                  onClick={handleModalSave}
                >
                  {modalSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
