import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchUsersByRole,
  updateUserSafe,
  fetchUserBookings,
  type AdminUserView,
} from '../../../core/services/firebaseServices';

const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchUsersByRole('customer');
      setCustomers(data);
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (c) => {
          try {
            const bookings = await fetchUserBookings(c.uid);
            counts[c.uid] = bookings.length;
          } catch {
            counts[c.uid] = 0;
          }
        })
      );
      setBookingCounts(counts);
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
    return customers.filter((c) => {
      const text = `${c.displayName || ''} ${c.email || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const status = c.accountStatus || 'active';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const toggleStatus = async (customer: AdminUserView) => {
    const next = customer.accountStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await updateUserSafe(customer.uid, { accountStatus: next });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">Customers</h3>
      </div>

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-3">
          <div className="flex-grow-1" style={{ minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search customers..."
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
            <option value="active">Active</option>
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
                  <th>Customer</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Joined</th>
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
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const status = c.accountStatus || 'active';
                    return (
                      <tr key={c.uid}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: '40px', height: '40px', fontSize: '14px' }}
                            >
                              {(c.displayName || c.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-medium">{c.displayName || 'Unnamed'}</div>
                              <div className="small text-muted">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{bookingCounts[c.uid] ?? 0}</td>
                        <td>
                          <span className={`badge ${status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                            {status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="text-end">
                          <button
                            className={`btn btn-sm ${status === 'active' ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => toggleStatus(c)}
                          >
                            {status === 'active' ? 'Suspend' : 'Reactivate'}
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
    </div>
  );
};

export default AdminCustomers;
