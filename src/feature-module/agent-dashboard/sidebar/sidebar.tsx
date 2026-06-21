import  { useEffect, useState } from 'react'
import { all_routes } from '../../../feature-module/router/all_routes'
import { Link, useLocation } from 'react-router-dom'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { useAuth } from '../../../core/contexts/AuthContext'

const DEFAULT_AVATAR = 'assets/img/users/user-43.jpg';

const formatMemberSince = (date?: string): string => {
    if (!date) return 'Member Since —';
    try {
        const d = new Date(date);
        return `Member Since ${d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } catch {
        return 'Member Since —';
    }
};

const Sidebar = () => {

    const routes = all_routes
    const location = useLocation();
    const { userProfile } = useAuth();
        const [subdroptoggle, setsubdroptoggle] = useState<boolean[]>([false, false]);

    const handleToggle = (index: number) => {
        setsubdroptoggle((prev) =>
            prev.map((_, i) => (i === index ? !prev[i] : false))
        );
    };
    useEffect(() => {
        if (location.pathname.includes('booking') || location.pathname.includes('agent-cancellation-request')) {
            setsubdroptoggle([true, false]);
        }
        else if (location.pathname.includes('agent-pending-payouts')  || location.pathname.includes('agent-payment-history') || location.pathname.includes('agent-commission-summary')) {
            setsubdroptoggle([false, true]);
        }
    }, [location.pathname]);



    return (
        <div>
            {/* Sidebar */}
            <div className="card user-sidebar agent-sidebar mb-4 mb-lg-0 theiaStickySidebar">
                <div className="card-header user-sidebar-header text-center bg-gray-transparent">
                    <div className="agent-profile d-inline-flex">
                        <ImageWithBasePath
                            src={userProfile?.photoURL || DEFAULT_AVATAR}
                            alt="image"
                            className="img-fluid rounded-circle"
                            fallbackSrc={DEFAULT_AVATAR}
                        />
                        <Link
                            to={routes.agentSettings}
                            className="avatar avatar-sm rounded-circle btn btn-primary d-flex align-items-center justify-content-center p-0"
                        >
                            <i className="isax isax-edit-2 fs-14" />
                        </Link>
                    </div>
                    <h6 className="fs-16">{userProfile?.displayName || userProfile?.email || 'Agent'}</h6>
                    <p className="fs-14 mb-2">{formatMemberSince(userProfile?.joinedAt || userProfile?.createdAt)}</p>
                    <div className="d-flex align-items-center justify-content-center notify-item">
                        <Link
                            to={routes.agentNotification}
                            className="rounded-circle btn btn-white d-flex align-items-center justify-content-center p-0 me-2 position-relative"
                        >
                            <i className="isax isax-notification-bing5 fs-20" />
                            <span className="position-absolute p-1 bg-secondary rounded-circle" />
                        </Link>
                        <Link
                            to={routes.agentChat}
                            className="rounded-circle btn btn-white d-flex align-items-center justify-content-center p-0 position-relative"
                        >
                            <i className="isax isax-message-square5 fs-20" />
                            <span className="position-absolute p-1 bg-danger rounded-circle" />
                        </Link>
                    </div>
                    <div className="mt-3 w-100 px-2">
                        <Link
                            to="/"
                            className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                        >
                            <i className="isax isax-arrow-left-2 fs-14" />
                            Back to Website
                        </Link>
                    </div>
                </div>
                <div className="card-body user-sidebar-body">
                    <ul>
                        <li>
                            <Link
                                to={routes.agentDashboard}
                                className={`d-flex align-items-center  ${location.pathname === routes.agentDashboard && 'active'}`}
                            >
                                <i className="isax isax-grid-55 me-2" />
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link to={routes.agentListing} className={`d-flex align-items-center ${location.pathname === routes.agentListing && 'active'}`}>
                                <i className="isax isax-menu-14 me-2" />
                                Listings
                            </Link>
                        </li>
                        <li className="submenu" >
                            <Link to="#" onClick={() => handleToggle(0)}
                                className={`d-block ${subdroptoggle[0] ? 'subdrop' : ''} ${location.pathname.includes('booking') ? 'active' : ''}`}>
                                <i className="isax isax-calendar-tick5 me-2" />
                                <span>Bookings</span>
                                <span className="menu-arrow" />
                            </Link>
                            <ul className={` ${subdroptoggle[0] ? 'd-block' :'d-none'}`}>
                                <li>
                                    <Link
                                        to={routes.agentHotelBooking}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-hotel-booking') ? 'active' : ''}`}>
                                        Hotels
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentBookingRequests}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-booking-requests') ? 'active' : ''}`}>
                                        Requests
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentCarBooking}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-car-booking') ? 'active' : ''}`}
                                    >
                                        Cars
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentCruiseBooking}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-cruise-booking') ? 'active' : ''}`}
                                    >
                                        Cruise
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentTourBooking}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-tour-booking') ? 'active' : ''}`}
                                    >
                                        Tour
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentFlightBooking}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-flight-booking') ? 'active' : ''}`}
                                    >
                                        Flights
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentBusBooking}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-bus-booking') ? 'active' : ''}`}
                                    >
                                        Bus
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentGuideBooking}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-guide-booking') ? 'active' : ''}`}
                                    >
                                        Guide
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentVisaBooking}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-visa-booking') ? 'active' : ''}`}
                                    >
                                        Visa
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentActivitiesBooking}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-activities-booking') ? 'active' : ''}`}
                                    >
                                        Activities
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentCancellationRequest}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-cancellation-request') ? 'active' : ''}`}
                                    >
                                        Cancellation Requests
                                    </Link>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <Link to={routes.agentEnquirers} className={`d-flex align-items-center ${location.pathname === routes.agentEnquirers && 'active'}`}>
                                <i className="isax isax-magic-star5 me-2" />
                                Enquiries
                            </Link>
                        </li>
                        <li>
                            <Link to={routes.agentEarnings} className={`d-flex align-items-center ${location.pathname === routes.agentEarnings && 'active'}`}>
                                <i className="isax isax-wallet-add-15 me-2" />
                                Earnings
                            </Link>
                        </li>
                        <li className="submenu" >
                            <Link to="#" onClick={() => handleToggle(1)}
                                className={`d-block ${subdroptoggle[1] ? 'subdrop' : ''} ${location.pathname.includes('agent-pending-payouts')  || location.pathname.includes('agent-payment-history') || location.pathname.includes('agent-commission-summary') ? 'active' : ''}`}>
                                <i className="isax isax-wallet-add-15 me-2" />
                                <span>Payout</span>
                                <span className="menu-arrow" />
                            </Link>
                            <ul className={` ${subdroptoggle[1] ? 'd-block' :'d-none'}`}>
                                <li>
                                    <Link
                                        to={routes.agentPendingPayouts}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-pending-payouts') || location.pathname.includes('agent-payment-history') ? 'active' : ''}`}>
                                        Pending Payouts
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={routes.agentCommissionSummary}
                                        className={`fs-14 d-inline-flex align-items-center ${location.pathname.includes('agent-commission-summary') ? 'active' : ''}`}
                                    >
                                        Commission Summary
                                    </Link>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <Link to={routes.agentReview} className={`d-flex align-items-center ${location.pathname === routes.agentReview && 'active'}`}>
                                <i className="isax isax-magic-star5 me-2" />
                                Reviews
                            </Link>
                        </li>
                        <li>
                            <Link to={routes.agentSettings} className={`d-flex align-items-center ${location.pathname.includes('settings')  || location.pathname.includes('bussiness-details')? 'active' : ''}`}>
                                <i className="isax isax-setting-25" /> Settings
                            </Link>
                        </li>
                        <li className="logout-link">
                            <Link to={routes.allService1} className="d-flex align-items-center pb-0">
                                <i className="isax isax-logout-15" /> Logout
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>

            {/* /Sidebar */}

        </div>
    )
}

export default Sidebar
