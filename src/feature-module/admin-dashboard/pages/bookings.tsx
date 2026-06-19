import React, { useEffect, useMemo, useState } from 'react';
import { fetchBookings, updateBookingStatus, type Booking } from '../../../core/services/firebaseServices';

const STATUS_OPTIONS: ("pending" | "confirmed" | "cancelled")[] = ["pending", "confirmed", "cancelled"];

interface AdminBookingsProps {
  title?: string;
  defaultStatus?: "pending" | "confirmed" | "cancelled" | "all";
}

const AdminBookings: React.FC<AdminBookingsProps> = ({ title = "All Bookings", defaultStatus = "all" }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">(defaultStatus);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBookings(statusFilter === 'all' ? undefined : statusFilter);
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
      await updateBookingStatus(booking.id!, status, notes[booking.id!] || booking.status === status ? undefined : notes[booking.id!]);
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
                  <th>Service</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Admin Notes</th>
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
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="fw-medium">{b.userName || '—'}</div>
                        <div className="small text-muted">{b.userEmail}</div>
                      </td>
                      <td>
                        <div className="fw-medium">{b.itemTitle || '—'}</div>
                        <div className="small text-muted text-capitalize">{b.itemType}</div>
                      </td>
                      <td>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '—'}</td>
                      <td>${b.price ?? 0}</td>
                      <td>
                        <span
                          className={`badge ${
                            b.status === 'confirmed' ? 'bg-success' : b.status === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td style={{ minWidth: '180px' }}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Add note..."
                          value={notes[b.id!] || ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [b.id!]: e.target.value }))}
                        />
                      </td>
                      <td className="text-end">
                        {STATUS_OPTIONS.filter((s) => s !== b.status).map((s) => (
                          <button
                            key={s}
                            className={`btn btn-sm me-1 ${
                              s === 'confirmed' ? 'btn-success' : s === 'cancelled' ? 'btn-danger' : 'btn-warning'
                            }`}
                            onClick={() => changeStatus(b, s)}
                          >
                            {s === 'pending' ? 'Set Pending' : s === 'confirmed' ? 'Confirm' : 'Cancel'}
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
