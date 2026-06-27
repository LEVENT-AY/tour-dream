import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { all_routes } from '../../router/all_routes';
import type {
  AdminStats,
  RecentBooking,
  RecentListing,
  RecentUser,
} from '../../../core/services/adminDashboardServices';
import {
  getAdminStats,
  getRecentBookings,
  getRecentListings,
  getRecentUsers,
} from '../../../core/services/adminDashboardServices';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<RecentUser[]>([]);
  const [recentAgents, setRecentAgents] = useState<RecentUser[]>([]);
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, bookings, customers, agents, listings] = await Promise.all([
          getAdminStats(),
          getRecentBookings(5),
          getRecentUsers('customer', 5),
          getRecentUsers('agent', 5),
          getRecentListings(5),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setRecentBookings(bookings);
          setRecentCustomers(customers);
          setRecentAgents(agents);
          setRecentListings(listings);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return '—';
    try {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const statusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'cancelled':
        return 'badge bg-danger';
      default:
        return 'badge bg-light text-dark';
    }
  };

  const summaryCards = [
    { label: 'Total Bookings', value: stats?.totalBookings ?? 0, icon: 'isax-calendar-tick', color: 'bg-primary', route: all_routes.adminBookings },
    { label: 'Pending Bookings', value: stats?.pendingBookings ?? 0, icon: 'isax-clock', color: 'bg-warning', route: all_routes.adminBookingsPending },
    { label: 'Confirmed Bookings', value: stats?.confirmedBookings ?? 0, icon: 'isax-tick-circle', color: 'bg-success', route: all_routes.adminBookingsConfirmed },
    { label: 'Cancelled Bookings', value: stats?.cancelledBookings ?? 0, icon: 'isax-close-circle', color: 'bg-danger', route: all_routes.adminBookingsCancelled },
    { label: 'Customers', value: stats?.totalCustomers ?? 0, icon: 'isax-people', color: 'bg-info', route: all_routes.adminCustomers },
    { label: 'Agents / Vendors', value: stats?.totalAgents ?? 0, icon: 'isax-user-octagon', color: 'bg-secondary', route: all_routes.adminAgents },
    { label: 'Tours', value: stats?.totalTours ?? 0, icon: 'isax-map', color: 'bg-primary', route: all_routes.adminTours },
    { label: 'Hotels', value: stats?.totalHotels ?? 0, icon: 'isax-building', color: 'bg-dark', route: all_routes.adminHotels },
    { label: 'Flights', value: stats?.totalFlights ?? 0, icon: 'isax-airplane', color: 'bg-primary', route: all_routes.adminFlights },
    { label: 'Cars', value: stats?.totalCars ?? 0, icon: 'isax-car', color: 'bg-info', route: all_routes.adminCars },
    { label: 'Activities', value: stats?.totalActivities ?? 0, icon: 'isax-activity', color: 'bg-success', route: all_routes.adminActivities },
    { label: 'Total Listings', value: stats?.totalListings ?? 0, icon: 'isax-menu', color: 'bg-secondary', route: all_routes.adminDashboard },
  ];

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <span className="spinner-border text-primary mb-3" role="status" aria-hidden="true" />
          <p className="text-muted mb-0">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger">
        <div className="card-body text-center p-4">
          <i className="isax isax-warning-2 fs-32 text-danger mb-3" />
          <h5 className="text-danger">Error loading dashboard</h5>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-content">
      {/* Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <div>
          <h3 className="mb-1">Dashboard</h3>
          <p className="text-muted mb-0">Welcome back, here is what is happening today.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to={all_routes.adminBookings} className="btn btn-light d-flex align-items-center">
            <i className="isax isax-calendar-tick me-2" />
            Bookings
          </Link>
          <Link to={all_routes.adminTours} className="btn btn-primary d-flex align-items-center">
            <i className="isax isax-map me-2" />
            Manage Tours
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="col-12 col-sm-6 col-xl-3">
            <Link to={card.route} className="card text-decoration-none h-100">
              <div className="card-body d-flex align-items-center">
                <span className={`avatar avatar-md rounded-circle d-flex align-items-center justify-content-center text-white ${card.color} me-3`}>
                  <i className={`isax ${card.icon} fs-24`} />
                </span>
                <div>
                  <h6 className="text-muted mb-1">{card.label}</h6>
                  <h3 className="mb-0">{card.value}</h3>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Service Request Stats */}
      {stats && stats.totalServiceRequests > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">Service Requests</h5>
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-xl-2">
              <Link to={all_routes.adminBookings} className="card text-decoration-none h-100 border-primary">
                <div className="card-body text-center py-3">
                  <h3 className="text-primary mb-1">{stats.totalServiceRequests}</h3>
                  <h6 className="text-muted mb-0">Total</h6>
                </div>
              </Link>
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <Link to={all_routes.adminBookingsPending} className="card text-decoration-none h-100 border-warning">
                <div className="card-body text-center py-3">
                  <h3 className="text-warning mb-1">{stats.pendingServiceRequests}</h3>
                  <h6 className="text-muted mb-0">Pending</h6>
                </div>
              </Link>
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <Link to={all_routes.adminBookings} className="card text-decoration-none h-100 border-info">
                <div className="card-body text-center py-3">
                  <h3 className="text-info mb-1">{stats.contactedServiceRequests}</h3>
                  <h6 className="text-muted mb-0">Contacted</h6>
                </div>
              </Link>
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <Link to={all_routes.adminBookingsConfirmed} className="card text-decoration-none h-100 border-success">
                <div className="card-body text-center py-3">
                  <h3 className="text-success mb-1">{stats.confirmedServiceRequests}</h3>
                  <h6 className="text-muted mb-0">Confirmed</h6>
                </div>
              </Link>
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <Link to={all_routes.adminBookingsCancelled} className="card text-decoration-none h-100 border-danger">
                <div className="card-body text-center py-3">
                  <h3 className="text-danger mb-1">{stats.cancelledServiceRequests}</h3>
                  <h6 className="text-muted mb-0">Cancelled</h6>
                </div>
              </Link>
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <div className="card text-decoration-none h-100">
                <div className="card-body text-center py-3">
                  <h3 className="text-dark mb-1">{stats.todayServiceRequests}</h3>
                  <h6 className="text-muted mb-0">Today</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Status Overview */}
      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Booking Status Overview</h5>
        </div>
        <div className="card-body">
          {stats && stats.totalBookings > 0 ? (
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-4">
                <div className="progress" style={{ height: '24px' }}>
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{ width: `${(stats.pendingBookings / stats.totalBookings) * 100}%` }}
                    aria-valuenow={stats.pendingBookings}
                    aria-valuemin={0}
                    aria-valuemax={stats.totalBookings}
                  />
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${(stats.confirmedBookings / stats.totalBookings) * 100}%` }}
                    aria-valuenow={stats.confirmedBookings}
                    aria-valuemin={0}
                    aria-valuemax={stats.totalBookings}
                  />
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={{ width: `${(stats.cancelledBookings / stats.totalBookings) * 100}%` }}
                    aria-valuenow={stats.cancelledBookings}
                    aria-valuemin={0}
                    aria-valuemax={stats.totalBookings}
                  />
                </div>
              </div>
              <div className="col-12 col-md-8">
                <div className="d-flex flex-wrap gap-4">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-warning text-dark me-2">{stats.pendingBookings}</span>
                    <span className="text-muted">Pending</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success me-2">{stats.confirmedBookings}</span>
                    <span className="text-muted">Confirmed</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-danger me-2">{stats.cancelledBookings}</span>
                    <span className="text-muted">Cancelled</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No bookings yet. New bookings will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card mb-4">
        <div className="card-header bg-white d-flex align-items-center justify-content-between">
          <h5 className="mb-0">Recent Bookings</h5>
          <Link to={all_routes.adminBookings} className="btn btn-sm btn-light">
            View All
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Booking ID</th>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length > 0 ? (
                  recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td className="fw-medium">#{b.bookingCode || b.id.slice(-6).toUpperCase()}</td>
                      <td>{b.serviceName || '—'}</td>
                      <td>{b.customerEmail || '—'}</td>
                      <td>
                        <span className={statusBadgeClass(b.status)}>{b.status || 'Unknown'}</span>
                      </td>
                      <td>{formatDate(b.createdAt)}</td>
                      <td className="text-end">
                        {b.totalPrice ? `${b.totalPrice} ${b.currency || 'USD'}` : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No recent bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Customers & Agents */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Recent Customers</h5>
              <Link to={all_routes.adminCustomers} className="btn btn-sm btn-light">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name / Email</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCustomers.length > 0 ? (
                      recentCustomers.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-sm bg-light rounded-circle d-flex align-items-center justify-content-center me-2">
                                <i className="isax isax-user fs-12 text-primary" />
                              </span>
                              <div>
                                <p className="mb-0 fw-medium">{c.displayName || c.email || '—'}</p>
                                {c.displayName && <small className="text-muted">{c.email}</small>}
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(c.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-center py-4 text-muted">
                          No customers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Recent Agents</h5>
              <Link to={all_routes.adminAgents} className="btn btn-sm btn-light">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name / Email</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAgents.length > 0 ? (
                      recentAgents.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-sm bg-light rounded-circle d-flex align-items-center justify-content-center me-2">
                                <i className="isax isax-user-octagon fs-12 text-primary" />
                              </span>
                              <div>
                                <p className="mb-0 fw-medium">{a.displayName || a.email || '—'}</p>
                                {a.displayName && <small className="text-muted">{a.email}</small>}
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(a.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-center py-4 text-muted">
                          No agents found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="card mb-4">
        <div className="card-header bg-white d-flex align-items-center justify-content-between">
          <h5 className="mb-0">Recent Listings</h5>
          <Link to={all_routes.adminTours} className="btn btn-sm btn-light">
            View All
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Price</th>
                </tr>
              </thead>
              <tbody>
                {recentListings.length > 0 ? (
                  recentListings.map((l) => (
                    <tr key={`${l.type}-${l.id}`}>
                      <td className="fw-medium">{l.title || '—'}</td>
                      <td>
                        <span className="badge bg-light text-dark">{l.type || '—'}</span>
                      </td>
                      <td>
                        <span className={statusBadgeClass(l.status)}>{l.status || 'Unknown'}</span>
                      </td>
                      <td>{formatDate(l.createdAt)}</td>
                      <td className="text-end">{l.price ? `${l.price} USD` : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No recent listings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0">Quick Actions</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <Link to={all_routes.adminTours} className="btn btn-outline-primary w-100 d-flex flex-column align-items-center py-3">
                <i className="isax isax-map fs-24 mb-2" />
                <span>Add Tour</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to={all_routes.adminHotels} className="btn btn-outline-primary w-100 d-flex flex-column align-items-center py-3">
                <i className="isax isax-building fs-24 mb-2" />
                <span>Add Hotel</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to={all_routes.adminCoupons} className="btn btn-outline-primary w-100 d-flex flex-column align-items-center py-3">
                <i className="isax isax-ticket-discount fs-24 mb-2" />
                <span>Add Coupon</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to={all_routes.adminSettings} className="btn btn-outline-primary w-100 d-flex flex-column align-items-center py-3">
                <i className="isax isax-setting-2 fs-24 mb-2" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
