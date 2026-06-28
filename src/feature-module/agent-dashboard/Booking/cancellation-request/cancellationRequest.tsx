import { useEffect, useState } from 'react';
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../sidebar/sidebar';
import { Link } from 'react-router-dom';
import Table from "../../../../core/common/dataTable/index";
import AgentCancellationRequestModal from './cancellationRequestModal';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { fetchAgentBookings, bookingStatusDisplay } from '../../../../core/services/agentServices';
import type { Booking } from '../../../../core/services/firebaseServices';

const AgentCancellationRequest = () => {

    const routes = all_routes;
    const { userProfile } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbs = [
        {
            label: 'Cancelled Bookings',
            active: false,
            link: routes.home1
        },
        {
            label: 'Cancelled Bookings',
            active: true,
        },
    ];

    const loadBookings = async () => {
        if (!userProfile?.uid) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAgentBookings(userProfile.uid);
            setBookings(data.filter((b) => {
                const s = String(b.status || '').toLowerCase();
                return s === 'cancelled' || s === 'canceled';
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [userProfile?.uid]);

    const data = bookings.map((booking) => {
        const status = bookingStatusDisplay(booking.status);
        return {
            id: booking.id,
            action: status.action,
            bookingId: booking.id?.slice(-6).toUpperCase() || '—',
            serviceType: booking.itemType || '—',
            bookedBy: booking.userName || booking.userEmail || 'Customer',
            bookedLocation: booking.userEmail || '',
            serviceName: booking.itemTitle || '—',
            bookedOn: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—',
            date: booking.createdAt || '',
            status: status.label,
            badge: status.badge,
            raw: booking,
        };
    });

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            render: (_text: any, render: any) => (
                <Link to="#" className="link-primary fw-medium" data-bs-toggle="modal" data-bs-target={`#${render.action}`}>
                    #{render.id?.slice(-6).toUpperCase()}
                </Link>
            ),
            sorter: (a: any, b: any) => String(a.id).length - String(b.id).length,
        },
        {
            title: "Booking ID",
            dataIndex: "bookingId",
            key: "bookingId",
            render: (_text: any, render: any) => (
                <span className="fw-medium">#{render.bookingId}</span>
            ),
            sorter: (a: any, b: any) => String(a.bookingId).length - String(b.bookingId).length,
        },
        {
            title: "Service",
            dataIndex: "serviceType",
            key: "serviceType",
            sorter: (a: any, b: any) => String(a.serviceType).length - String(b.serviceType).length,
        },
        {
            title: "Booked By",
            dataIndex: "bookedBy",
            key: "bookedBy",
            render: (_text: any, render: any) => (
                <>
                    <h6 className="fs-14 mb-1">{render.bookedBy}</h6>
                    <span className="fs-14 fw-normal text-gray-6">{render.bookedLocation}</span>
                </>
            ),
            sorter: (a: any, b: any) => String(a.bookedBy).length - String(b.bookedBy).length,
        },
        {
            title: "Service Name",
            dataIndex: "serviceName",
            key: "serviceName",
            render: (_text: any, render: any) => (
                <span>{render.serviceName}</span>
            ),
            sorter: (a: any, b: any) => String(a.serviceName).length - String(b.serviceName).length,
        },
        {
            title: "Booked on",
            dataIndex: "bookedOn",
            key: "bookedOn",
            sorter: (a: any, b: any) => String(a.date).length - String(b.date).length,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (text: any, render: any) => (
                <span className={`badge rounded-pill d-inline-flex align-items-center fs-10 ${text === 'Upcoming' ? 'badge-info' : text === 'Pending' ? 'badge-secondary' : text === 'Cancelled' ? 'badge-danger' : text === 'Completed' ? 'badge-success' : ''}`}>
                    <i className="fa-solid fa-circle fs-5 me-1" />
                    {render.status}
                </span>
            ),
            sorter: (a: any, b: any) => String(a.status).length - String(b.status).length,
        },
        {
            title: "",
            dataIndex: "action",
            render: (_text: any, render: any) => (
                <div className="d-flex align-items-center">
                    <Link to="#" data-bs-toggle="modal" data-bs-target={`#${render.action}`}>
                        <i className="isax isax-eye" />
                    </Link>
                </div>
            ),
            sorter: (a: any, b: any) => String(a.action).length - String(b.action).length,
        },
    ];

    return (
        <div>
            <Breadcrumb title="Cancelled Bookings" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
            <div className="content">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-3 col-lg-4">
                            <Sidebar />
                        </div>
                        <div className="col-xl-9 col-lg-8 theiaStickySidebar">
                            <div className="card booking-header border-0">
                                <div className="card-body header-content d-flex align-items-center justify-content-between flex-wrap">
                                    <div>
                                        <h6 className="mb-1">Cancelled Bookings</h6>
                                        <p className="fs-14 text-gray-6 fw-normal">
                                            {loading ? 'Loading...' : `${bookings.length} cancelled booking${bookings.length !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <div className="card hotel-list">
                                <div className="card-body p-0">
                                    <div className="list-header d-flex align-items-center justify-content-between flex-wrap">
                                        <h6>Booking List</h6>
                                        <div className="d-flex align-items-center flex-wrap">
                                            <div className="input-icon-start me-2 position-relative">
                                                <span className="icon-addon"><i className="isax isax-search-normal-1 fs-14" /></span>
                                                <input type="text" className="form-control" placeholder="Search" />
                                            </div>
                                        </div>
                                    </div>
                                    <Table dataSource={data} columns={columns} Selection={false} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <AgentCancellationRequestModal />
        </div>
    )
}

export default AgentCancellationRequest
