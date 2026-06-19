import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../../core/common/sidebar/sidebar';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { useAuth } from '../../../core/contexts/AuthContext';
import { fetchUserBookings, type Booking } from '../../../core/services/firebaseServices';

const formatDate = (value?: string) => {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Not available'
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (value?: number, currency = 'USD') => {
    if (typeof value !== 'number') return 'Not set';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
};

const Dashboard = () => {
    const routes = all_routes;
    const { userProfile } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [bookingsError, setBookingsError] = useState<string | null>(null);

    const breadcrumbs = [
        {
            label: 'Dashboard',
            link: routes.allService1,
            active: false,
        },
        {
            label: 'Dashboard',
            active: true,
        },
    ];

    useEffect(() => {
        if (!userProfile?.uid) return;

        let isMounted = true;
        setBookingsLoading(true);
        setBookingsError(null);

        fetchUserBookings(userProfile.uid)
            .then((data) => {
                if (isMounted) setBookings(data);
            })
            .catch((error) => {
                console.error('Failed to load customer bookings:', error);
                if (isMounted) setBookingsError('Bookings are not connected yet.');
            })
            .finally(() => {
                if (isMounted) setBookingsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [userProfile?.uid]);

    const displayName = userProfile?.displayName || userProfile?.email || 'Customer';
    const avatarSrc = userProfile?.photoURL || 'assets/img/users/user-01.jpg';
    const memberSince = formatDate(userProfile?.joinedAt || userProfile?.createdAt);
    const bookingCount = bookings.length;

    return (
        <div>
            <Breadcrumb title="Dashboard" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />

            <div className="content content-two">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-3 col-lg-4">
                            <Sidebar />
                        </div>
                        <div className="col-xl-9 col-lg-8">
                            <div className="alert alert-info border-0 mb-4">
                                Customer dashboard basics now come from Firebase auth and `users/{userProfile?.uid || 'uid'}`.
                            </div>

                            <div className="row g-4 mb-4">
                                <div className="col-xl-5 d-flex">
                                    <div className="card shadow-none flex-fill mb-0">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center mb-3">
                                                <span className="avatar avatar-xxl flex-shrink-0 me-3 rounded-circle overflow-hidden bg-light">
                                                    <ImageWithBasePath src={avatarSrc} alt={displayName} className="w-100 h-100 object-fit-cover" />
                                                </span>
                                                <div>
                                                    <h5 className="mb-1">{displayName}</h5>
                                                    <p className="mb-1 text-gray-6">{userProfile?.email || 'No email on file'}</p>
                                                    <span className="badge badge-soft-info rounded-pill">Customer</span>
                                                </div>
                                            </div>
                                            <div className="border-top pt-3">
                                                <p className="mb-2"><strong>Phone:</strong> {userProfile?.phone || 'Not set'}</p>
                                                <p className="mb-2"><strong>Member since:</strong> {memberSince}</p>
                                                <p className="mb-0"><strong>UID:</strong> {userProfile?.uid || 'Not available'}</p>
                                            </div>
                                            <div className="d-flex gap-2 flex-wrap mt-3">
                                                <Link to={routes.myProfile} className="btn btn-primary btn-sm">View Profile</Link>
                                                <Link to={routes.profileSettings} className="btn btn-light btn-sm">Edit Settings</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-7">
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <div className="card shadow-none h-100 mb-0">
                                                <div className="card-body">
                                                    <p className="text-gray-6 mb-1">Bookings</p>
                                                    <h3 className="mb-1">{bookingsLoading ? '—' : bookingCount}</h3>
                                                    <p className="mb-0 text-gray-6">Live Firestore bookings</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card shadow-none h-100 mb-0">
                                                <div className="card-body">
                                                    <p className="text-gray-6 mb-1">Orders</p>
                                                    <h3 className="mb-1">—</h3>
                                                    <p className="mb-0 text-gray-6">Not connected yet</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card shadow-none h-100 mb-0">
                                                <div className="card-body">
                                                    <p className="text-gray-6 mb-1">Favorites</p>
                                                    <h3 className="mb-1">—</h3>
                                                    <p className="mb-0 text-gray-6">Wishlist data not wired yet</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card shadow-none mb-0">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h6 className="mb-1">Recent Bookings</h6>
                                            <p className="fs-14 text-gray-6 mb-0">Pulled from Firestore `bookings` for the signed-in customer.</p>
                                        </div>
                                        <Link to={routes.userHotlesBooking} className="btn btn-light btn-sm">View bookings</Link>
                                    </div>

                                    {bookingsLoading ? (
                                        <div className="text-gray-6">Loading your bookings...</div>
                                    ) : bookingsError ? (
                                        <div className="alert alert-light mb-0">{bookingsError}</div>
                                    ) : bookings.length === 0 ? (
                                        <div className="alert alert-light mb-0">No bookings yet. New bookings will appear here when the customer bookings collection is live.</div>
                                    ) : (
                                        <div className="row g-3">
                                            {bookings.slice(0, 3).map((booking) => (
                                                <div className="col-12" key={booking.id || `${booking.itemId}-${booking.createdAt}`}>
                                                    <div className="border rounded p-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
                                                        <div>
                                                            <p className="mb-1 text-gray-6 text-uppercase small">{booking.itemType}</p>
                                                            <h6 className="mb-1">{booking.itemTitle}</h6>
                                                            <p className="mb-0 text-gray-6">Booked on {formatDate(booking.bookingDate || booking.startDate || booking.createdAt)}</p>
                                                        </div>
                                                        <div className="text-end">
                                                            <div className="fw-medium">{formatCurrency(booking.totalAmount || booking.price, booking.currency)}</div>
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

export default Dashboard;
