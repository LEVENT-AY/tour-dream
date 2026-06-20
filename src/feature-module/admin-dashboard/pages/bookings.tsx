import React, { useEffect, useMemo, useState } from 'react';
import { fetchAdminBookings, updateBookingStatus, type Booking } from '../../../core/services/firebaseServices';
import BookingStatusBadge from '../../../core/common/badge/BookingStatusBadge';

const NEXT_STATUS_OPTIONS: Record<'pending' | 'confirmed' | 'cancelled', ('confirmed' | 'cancelled')[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: [],
};

interface AdminBookingsProps {
  title?: string;
  defaultStatus?: "pending" | "confirmed" | "cancelled" | "all";
}

const AdminBookings: React.FC<AdminBookingsProps> = ({ title = "All Bookings", defaultStatus = "all" }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">(defaultStatus);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminBookings(statusFilter === 'all' ? undefined : statusFilter);
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const text = `${b.userName || ''} ${b.userEmail || ''} ${b.itemTitle || ''} ${b.itemType || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [bookings, search]);

  const changeStatus = async (booking: Booking, status: "pending" | "confirmed" | "cancelled") => {
    try {
      await updateBookingStatus(
        booking.id!,
        status,
        undefined,
        booking.userId
      );
      await load();
    } catch (err) {
      console.error(err);
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
              placeholder="Search bookings..."
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
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Customer</th>
                  <th>Booking Request</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="fw-medium">{b.customerName || b.userName || '—'}</div>
                        <div className="small text-muted">{b.customerEmail || b.userEmail || '—'}</div>
                        <div className="small text-muted">{b.customerPhone || b.userPhone || '—'}</div>
                      </td>
                      <td>
                        <div className="fw-medium">{b.title || b.itemTitle || '—'}</div>
                        <div className="small text-muted text-capitalize">{b.listingType || b.itemType || '—'}</div>
                      </td>
                      <td>{b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'}</td>
                      <td>
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="text-end">
                        {(b.status === 'pending' || b.status === 'confirmed' || b.status === 'cancelled'
                          ? NEXT_STATUS_OPTIONS[b.status]
                          : []
                        ).map((s) => (
                          <button
                            key={s}
                            className={`btn btn-sm me-1 ${
                              s === 'confirmed' ? 'btn-success' : 'btn-danger'
                            }`}
                            onClick={() => changeStatus(b, s)}
                          >
                            {s === 'confirmed' ? 'Confirm' : 'Cancel'}
                          </button>
                        ))}
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
