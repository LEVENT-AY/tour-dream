import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../../core/common/sidebar/sidebar';
import { useAuth } from '../../../core/contexts/AuthContext';
import { fetchCustomerBookings, type Booking } from '../../../core/services/firebaseServices';

interface CustomerBookingsPageProps {
  title: string;
  sectionLabel: string;
  emptyMessage: string;
  itemTypes?: Booking['itemType'][];
  forceEmpty?: boolean;
}

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatAmount = (booking: Booking) => {
  const amount = booking.totalAmount ?? booking.price;
  if (typeof amount !== 'number') return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: booking.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const CustomerBookingsPage = ({ title, sectionLabel, emptyMessage, itemTypes, forceEmpty = false }: CustomerBookingsPageProps) => {
  const routes = all_routes;
  const { userProfile, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const breadcrumbs = [
    { label: 'My Bookings', link: routes.allService1, active: false },
    { label: 'My Bookings', active: true },
    { label: sectionLabel, active: true },
  ];

  useEffect(() => {
    if (!userProfile?.uid) return;
    let isMounted = true;
    setLoading(true);
    setError('');

    fetchCustomerBookings(userProfile.uid)
      .then((data) => {
        if (isMounted) setBookings(data);
      })
      .catch((err) => {
        console.error('Failed to load customer bookings:', err);
        if (isMounted) setError('Unable to load bookings right now.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userProfile?.uid]);

  const visibleBookings = useMemo(() => {
    if (forceEmpty) return [];
    if (!itemTypes || itemTypes.length === 0) return bookings;
    return bookings.filter((booking) => itemTypes.includes(booking.itemType));
  }, [bookings, forceEmpty, itemTypes]);

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <div className="alert alert-danger m-4">Unable to load customer profile.</div>;
  }

  return (
    <div>
      <Breadcrumb title={title} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4">
              <Sidebar />
            </div>
            <div className="col-xl-9 col-lg-8">
              <div className="card booking-header">
                <div className="card-body header-content d-flex align-items-center justify-content-between flex-wrap">
                  <div>
                    <h6>{sectionLabel}</h6>
                    <p className="fs-14 text-gray-6 fw-normal mb-0">No of Booking : {visibleBookings.length}</p>
                  </div>
                  <Link to={routes.userDashboard} className="btn btn-light btn-sm">Dashboard</Link>
                </div>
              </div>

              <div className="card hotel-list">
                <div className="card-body">
                  {loading ? (
                    <div className="text-gray-6">Loading your bookings...</div>
                  ) : error ? (
                    <div className="alert alert-light mb-0">{error}</div>
                  ) : visibleBookings.length === 0 ? (
                    <div className="alert alert-light mb-0">{emptyMessage}</div>
                  ) : (
                    <div className="row g-3">
                      {visibleBookings.map((booking) => (
                        <div className="col-12" key={booking.id || `${booking.itemId}-${booking.createdAt}`}>
                          <div className="border rounded p-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div>
                              <p className="mb-1 text-gray-6 text-uppercase small">{booking.itemType}</p>
                              <h6 className="mb-1">{booking.itemTitle}</h6>
                              <p className="mb-0 text-gray-6">Booked on {formatDate(booking.bookingDate || booking.startDate || booking.createdAt)}</p>
                            </div>
                            <div className="text-end">
                              <div className="fw-medium">{formatAmount(booking)}</div>
                              <span className="badge badge-soft-info rounded-pill text-capitalize">{booking.status}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerBookingsPage;
