import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  fetchServiceRequests,
  updateServiceRequestStatus,
  deleteServiceRequest,
  fetchUsersByRole,
  type ServiceRequest,
  type ServiceRequestStatus,
  type ServiceRequestPriority,
  type AdminUserView,
} from '../../../core/services/firebaseServices';
import { auth } from '../../../firebase';

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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  wafa_cash: 'Wafa Cash',
  bank_transfer: 'Bank transfer',
  not_sure: 'Not sure yet',
};

const PAYMENT_METHOD_FILTER_OPTIONS = [
  { value: 'all', label: 'All payment methods' },
  { value: 'wafa_cash', label: 'Wafa Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'not_sure', label: 'Not sure yet' },
  { value: 'none', label: 'No preference' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'not_requested', label: 'Not requested' },
];

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

const CSV_HEADERS = [
  'createdAt','status','priority','serviceType','serviceTitle',
  'customerName','phone','email','requestedDate','guestsCount',
  'assignedTo','followUpDate','message','internalNotes',
  'paymentFlow','paymentStatus','preferredPaymentMethod',
];

const normalizePhone = (phone: string): string => phone.replace(/[^\d]/g, '');

const formatShortDate = (value?: string) => {
  if (!value) return '\u2014';
  try { return new Date(value).toLocaleDateString('en-GB'); } catch { return value; }
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const isOverdue = (r: ServiceRequest): boolean => {
  if (!r.followUpDate) return false;
  if (r.status === 'confirmed' || r.status === 'cancelled') return false;
  return r.followUpDate < todayStr();
};

const isDueToday = (r: ServiceRequest): boolean => {
  if (!r.followUpDate) return false;
  if (r.status === 'confirmed' || r.status === 'cancelled') return false;
  return r.followUpDate === todayStr();
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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [adminUsers, setAdminUsers] = useState<AdminUserView[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'unassigned' | 'assigned' | 'mine'>('all');
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
  const [showCustomAssigned, setShowCustomAssigned] = useState(false);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

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

  useEffect(() => { load(); }, []);

  useEffect(() => {
    fetchUsersByRole('admin').then(setAdminUsers).catch(() => {});
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentAdminEmail(user?.email ?? null);
    });
    return unsub;
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRequests.length };
    STATUS_OPTIONS.forEach((s) => { counts[s] = allRequests.filter((r) => r.status === s).length; });
    return counts;
  }, [allRequests]);

  const filtered = useMemo(() => {
    let result = allRequests;
    if (activeTab !== 'all') result = result.filter((r) => r.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        `${r.serviceTitle || ''} ${r.customerName || ''} ${r.customerEmail || ''} ${r.customerPhone || ''} ${r.serviceType || ''} ${r.message || ''} ${r.assignedTo || ''}`.toLowerCase().includes(q)
      );
    }
    if (assignmentFilter === 'unassigned') result = result.filter((r) => !r.assignedTo);
    if (assignmentFilter === 'assigned') result = result.filter((r) => !!r.assignedTo);
    if (assignmentFilter === 'mine') result = result.filter((r) => r.assignedTo === currentAdminEmail);
    if (paymentMethodFilter !== 'all') {
      result = result.filter((r) => {
        const pm = r.preferredPaymentMethod;
        if (paymentMethodFilter === 'none') return !pm;
        return pm === paymentMethodFilter;
      });
    }
    if (paymentStatusFilter !== 'all') {
      result = result.filter((r) => r.paymentStatus === paymentStatusFilter);
    }
    return result;
  }, [allRequests, activeTab, search, assignmentFilter, currentAdminEmail, paymentMethodFilter, paymentStatusFilter]);

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
    const adminMatch = r.assignedTo && adminUsers.some(u => u.email === r.assignedTo || u.displayName === r.assignedTo);
    setShowCustomAssigned(!!r.assignedTo && !adminMatch);
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

  const buildFollowUpMsg = useCallback((r: ServiceRequest): string => {
    let msg = `Hi ${r.customerName || 'there'}, this is DreamsTour following up on your request for "${r.serviceTitle || 'a service'}".`;
    if (r.requestedDate) msg += ` You requested ${r.requestedDate}.`;
    if (r.preferredPaymentMethod === 'wafa_cash') {
      msg += ' Our team will confirm availability and then send Wafa Cash instructions.';
    } else if (r.preferredPaymentMethod === 'bank_transfer') {
      msg += ' Our team will confirm availability and then send bank transfer instructions.';
    } else {
      msg += ' Our team will confirm availability and help you choose the best manual payment method.';
    }
    return msg;
  }, []);

  const copyFollowUp = useCallback(async (r: ServiceRequest) => {
    const msg = buildFollowUpMsg(r);
    try {
      await navigator.clipboard.writeText(msg);
      setCopyFeedback(r.id!);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch { /* clipboard not available */ }
  }, [buildFollowUpMsg]);

  const readablePaymentValue = (r: ServiceRequest, field: string): string => {
    if (field === 'preferredPaymentMethod') {
      const val = (r as any)[field];
      return PAYMENT_METHOD_LABELS[val] || val ? val.replace(/_/g, ' ') : '';
    }
    if (field === 'paymentStatus') {
      const val = (r as any)[field];
      if (!val) return '';
      return val === 'not_requested' ? 'Not requested' : val.replace(/_/g, ' ');
    }
    if (field === 'paymentFlow') {
      return (r as any)[field] === 'manual' ? 'Manual' : (r as any)[field] || '';
    }
    return (r as any)[field];
  };

  const exportCSV = useCallback(() => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map((r) =>
      CSV_HEADERS.map((h) => {
        if (h === 'guestsCount') return esc(r.guestsCount ?? '');
        if (h === 'phone') return esc(r.customerPhone);
        if (h === 'email') return esc(r.customerEmail);
        if (h.startsWith('payment')) return esc(readablePaymentValue(r, h));
        return esc((r as any)[h]);
      }).join(',')
    );
    const csv = [CSV_HEADERS.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const emptyMessage = () => {
    if (search.trim()) return 'No requests match your search.';
    if (activeTab !== 'all') return `No ${STATUS_LABELS[activeTab]?.toLowerCase() || ''} requests found.`;
    return 'No service requests yet. Requests from the public will appear here.';
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">{title}</h3>
        <button className="btn btn-sm btn-light" onClick={exportCSV} title="Export visible rows as CSV">
          <i className="isax isax-export me-1" />
          Export CSV
        </button>
      </div>

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

      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <span className="fs-14 text-muted me-1">Assignment:</span>
        {['all', 'unassigned', 'assigned', 'mine'].map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${assignmentFilter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setAssignmentFilter(f as typeof assignmentFilter)}
          >
            {f === 'all' ? 'All' : f === 'unassigned' ? 'Unassigned' : f === 'assigned' ? 'Assigned' : 'My Requests'}
          </button>
        ))}
        {!currentAdminEmail && (
          <small className="text-muted ms-1">(log in to use "My Requests")</small>
        )}
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <span className="fs-14 text-muted me-1">Payment:</span>
        {PAYMENT_METHOD_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`btn btn-sm ${paymentMethodFilter === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setPaymentMethodFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-muted mx-1">|</span>
        {PAYMENT_STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`btn btn-sm ${paymentStatusFilter === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setPaymentStatusFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-3 align-items-center">
          <div className="flex-grow-1" style={{ minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <small className="text-muted text-nowrap">
            {filtered.length} of {allRequests.length} request{allRequests.length !== 1 ? 's' : ''}
          </small>
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
                  <th>Assigned</th>
                  <th>Payment</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-muted">
                      {emptyMessage()}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const overdue = isOverdue(r);
                    const dueToday = isDueToday(r);
                    return (
                      <tr key={r.id} className={overdue ? 'table-warning' : dueToday ? 'table-info' : ''}>
                        <td>
                          <div className="fw-medium text-wrap d-flex align-items-center gap-1" style={{ maxWidth: '180px' }}>
                            {r.serviceTitle || '\u2014'}
                            {r.priority === 'urgent' && (
                              <span className="badge bg-danger" title="Urgent">!</span>
                            )}
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
                                  href={`https://wa.me/${normalizePhone(r.customerPhone)}?text=${encodeURIComponent(buildFollowUpMsg(r))}`}
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
                          <div className="text-truncate" style={{ maxWidth: '180px' }} title={r.message || ''}>
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
                        <td>
                          {r.assignedTo ? (
                            <span className="text-nowrap">{r.assignedTo}</span>
                          ) : (
                            <span className="badge bg-light text-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          {r.paymentFlow === 'manual' && (
                            <div className="d-flex flex-column gap-1">
                              <span className="badge bg-light text-dark fs-10 fw-normal text-nowrap">Manual</span>
                              {r.preferredPaymentMethod && (
                                <span className="badge bg-info bg-opacity-10 text-dark fs-10 fw-normal text-nowrap border border-info border-opacity-25">
                                  {PAYMENT_METHOD_LABELS[r.preferredPaymentMethod] || r.preferredPaymentMethod.replace(/_/g, ' ')}
                                </span>
                              )}
                              {!r.preferredPaymentMethod && (
                                <span className="badge bg-light text-muted fs-10 fw-normal">Not selected</span>
                              )}
                            </div>
                          )}
                          {!r.paymentFlow && (
                            <span className="text-muted fs-12">{'\u2014'}</span>
                          )}
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
                            className="btn btn-sm btn-light me-1"
                            onClick={() => copyFollowUp(r)}
                            title="Copy follow-up message"
                          >
                            {copyFeedback === r.id ? (
                              <i className="isax isax-tick-circle text-success" />
                            ) : (
                              <i className="isax isax-copy" />
                            )}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
                            href={`https://wa.me/${normalizePhone(selectedRequest.customerPhone)}?text=${encodeURIComponent(buildFollowUpMsg(selectedRequest))}`}
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
                    <h6 className="text-muted mb-2">Payment Info</h6>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <span className="fs-13 text-muted">Flow</span>
                        <p className="mb-0">{selectedRequest.paymentFlow === 'manual' ? 'Manual' : selectedRequest.paymentFlow || '\u2014'}</p>
                      </div>
                      <div className="col-md-4">
                        <span className="fs-13 text-muted">Status</span>
                        <p className="mb-0">{selectedRequest.paymentStatus === 'not_requested' ? 'Not requested' : selectedRequest.paymentStatus ? selectedRequest.paymentStatus.replace(/_/g, ' ') : '\u2014'}</p>
                      </div>
                      <div className="col-md-4">
                        <span className="fs-13 text-muted">Preferred Method</span>
                        <p className="mb-0">{selectedRequest.preferredPaymentMethod ? (PAYMENT_METHOD_LABELS[selectedRequest.preferredPaymentMethod] || selectedRequest.preferredPaymentMethod.replace(/_/g, ' ')) : 'Not selected'}</p>
                      </div>
                    </div>
                    <p className="fs-12 text-muted mt-2 mb-0">
                      Manual payment is confirmed by the team after availability confirmation. No card payment is collected on the website.
                    </p>
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
                    <select
                      className="form-select mb-1"
                      value={adminUsers.some(u => u.email === modalAssignedTo || u.displayName === modalAssignedTo) ? modalAssignedTo : modalAssignedTo ? '__other__' : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '__other__') {
                          setShowCustomAssigned(true);
                        } else {
                          setShowCustomAssigned(false);
                          setModalAssignedTo(v);
                        }
                      }}
                    >
                      <option value="">-- Unassigned --</option>
                      {adminUsers.map((u) => (
                        <option key={u.uid} value={u.email || u.displayName}>
                          {u.displayName ? `${u.displayName} <${u.email}>` : u.email}
                        </option>
                      ))}
                      <option value="__other__">Custom...</option>
                    </select>
                    {showCustomAssigned && (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter name or email"
                        value={modalAssignedTo}
                        onChange={(e) => setModalAssignedTo(e.target.value)}
                      />
                    )}
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
                <button className="btn btn-primary" disabled={modalSaving} onClick={handleModalSave}>
                  {modalSaving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : 'Save'}
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
