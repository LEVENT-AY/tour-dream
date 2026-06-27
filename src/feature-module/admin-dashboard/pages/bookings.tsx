import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchServiceRequests,
  updateServiceRequestStatus,
  deleteServiceRequest,
  type ServiceRequest,
  type ServiceRequestStatus,
} from '../../../core/services/firebaseServices';

const STATUS_OPTIONS: ServiceRequestStatus[] = ['pending', 'contacted', 'confirmed', 'cancelled'];

interface AdminBookingsProps {
  title?: string;
  defaultStatus?: ServiceRequestStatus | 'all';
}

const AdminBookings: React.FC<AdminBookingsProps> = ({ title = 'All Bookings', defaultStatus = 'all' }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | 'all'>(defaultStatus);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchServiceRequests(statusFilter === 'all' ? undefined : statusFilter);
      setRequests(data);
    } catch (err) {
      console.error('Error loading service requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const text = `${r.serviceTitle || ''} ${r.customerName || ''} ${r.customerEmail || ''} ${r.customerPhone || ''} ${r.serviceType || ''} ${r.message || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [requests, search]);

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

  const formatDate = (value?: string) => {
    if (!value) return '\u2014';
    try {
      return new Date(value).toLocaleString('en-GB');
    } catch {
      return value;
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">{title}</h3>
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
          <select
            className="form-select"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
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
                    <td colSpan={7} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="fw-medium">{r.serviceTitle || '\u2014'}</div>
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
                        <div className="fs-12 text-muted">
                          {r.customerPhone ? (
                            <a href={`tel:${r.customerPhone}`} className="text-muted text-decoration-none">
                              {r.customerPhone}
                            </a>
                          ) : '\u2014'}
                        </div>
                      </td>
                      <td>
                        <div className="fs-14">{r.requestedDate || '\u2014'}</div>
                        <div className="fs-12 text-muted">
                          {r.guestsCount ? `${r.guestsCount} guest${r.guestsCount > 1 ? 's' : ''}` : '\u2014'}
                        </div>
                      </td>
                      <td>
                        <div className="fs-14 text-truncate" style={{ maxWidth: '220px' }} title={r.message || ''}>
                          {r.message || '\u2014'}
                        </div>
                      </td>
                      <td>{formatDate(r.createdAt)}</td>
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
                      <td className="text-end">
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
    </div>
  );
};

export default AdminBookings;
