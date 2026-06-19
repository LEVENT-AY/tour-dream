
import { useEffect, useState } from 'react';
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import type { TableData } from '../../../../core/common/data/interface';
import Table from "../../../../core/common/dataTable/index";
import { Link } from 'react-router-dom';
import Sidebar from '../../sidebar/sidebar';
import PredefinedDateRanges from '../../../../core/common/range-picker/datePicker';
import AgentCarBookingModal from './agentCarBookingModal';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { fetchAgentBookings, updateBookingStatus, bookingStatusDisplay } from '../../../../core/services/agentServices';
import type { Booking } from '../../../../core/services/firebaseServices';

const AgentCarBooking = () => {

    const routes = all_routes;
    const { userProfile } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const loadBookings = async () => {
        if (!userProfile?.uid) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAgentBookings(userProfile.uid);
            setBookings(data.filter((b) => b.itemType === 'car'));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile?.uid]);

    const handleStatusUpdate = async (booking: Booking, status: 'confirmed' | 'completed' | 'cancelled' | 'rejected', reason?: string) => {
        if (!booking.id) return;
        setUpdatingId(booking.id);
        try {
            await updateBookingStatus(booking.id, status, reason);
            await loadBookings();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update booking');
        } finally {
            setUpdatingId(null);
        }
    };

    const data = bookings.map((booking) => {
        const status = bookingStatusDisplay(booking.status);
        return {
            id: booking.id,
            action: status.action,
            carName: booking.itemTitle,
            carType: booking.itemType,
            bookedBy: booking.userName || booking.userEmail || 'Customer',
            bookedLocation: booking.userEmail || '',
            travellers: '—',
            days: '—',
            pricing: new Intl.NumberFormat(undefined, { style: 'currency', currency: booking.currency || 'USD' }).format(
                typeof booking.totalAmount === 'number' ? booking.totalAmount : booking.price || 0
            ),
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
                <Link
                    to="#"
                    className="link-primary fw-medium"
                    data-bs-toggle="modal"
                    data-bs-target={`#${render.action}`}
                    onClick={() => setSelectedBooking(render.raw)}
                >
                    #{render.id?.slice(-6).toUpperCase()}
                </Link>
            ),
            sorter: (a: TableData, b: TableData) => String(a.id).length - String(b.id).length,
        },
        {
            title: "Car & Type",
            dataIndex: "car",
            key: "car",
            render: (_text: any, render: any) => (
                <div>
                    <p className="text-dark mb-0 fw-medium fs-14">
                        <Link to={routes.carDetails}>{render.carName}</Link>
                    </p>
                    <span className="fs-14 fw-normal text-gray-6">{render.carType}</span>
                </div>
            ),
            sorter: (a: TableData, b: TableData) =>
                String(a.car).length - String(b.car).length,
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
            sorter: (a: TableData, b: TableData) => String(a.bookedBy).length - String(b.bookedBy).length,
        },
        {
            title: "Travellers",
            dataIndex: "travellers",
            key: "travellers",
            sorter: (a: TableData, b: TableData) => String(a.travellers).length - String(b.travellers).length,
        },
        {
            title: "Days",
            dataIndex: "days",
            key: "days",
            sorter: (a: TableData, b: TableData) => String(a.days).length - String(b.days).length,
        },
        {
            title: "Pricing",
            dataIndex: "pricing",
            key: "pricing",
            sorter: (a: TableData, b: TableData) => String(a.pricing).length - String(b.pricing).length,
        },
        {
            title: "Booked on",
            dataIndex: "bookedOn",
            key: "bookedOn",
            sorter: (a: TableData, b: TableData) => String(a.date).length - String(b.date).length,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (_text: any, render: any) => (
                <span className={`badge rounded-pill d-inline-flex align-items-center fs-10 ${render.badge}`}>
                    <i className="fa-solid fa-circle fs-5 me-1" />
                    {render.status}
                </span>
            ),
            sorter: (a: TableData, b: TableData) => String(a.status).length - String(b.status).length,
        },
        {
            title: "",
            dataIndex: "action",
            render: (_text: any, render: any) => (
                <div className="d-flex align-items-center">
                    <Link
                        to="#"
                        data-bs-toggle="modal"
                        data-bs-target={`#${render.action}`}
                        onClick={() => setSelectedBooking(render.raw)}
                    >
                        <i className="isax isax-eye" />
                    </Link>
                    {render.raw.status === 'pending' && (
                        <>
                            <button
                                type="button"
                                className="btn btn-link text-success p-0 ms-2"
                                title="Confirm"
                                disabled={updatingId === render.raw.id}
                                onClick={() => handleStatusUpdate(render.raw, 'confirmed')}
                            >
                                <i className="isax isax-tick-circle" />
                            </button>
                            <button
                                type="button"
                                className="btn btn-link text-danger p-0 ms-2"
                                title="Reject"
                                disabled={updatingId === render.raw.id}
                                onClick={() => {
                                    const reason = window.prompt('Rejection reason (optional)');
                                    handleStatusUpdate(render.raw, 'rejected', reason || undefined);
                                }}
                            >
                                <i className="isax isax-close-circle" />
                            </button>
                        </>
                    )}
                    {render.raw.status === 'confirmed' && (
                        <button
                            type="button"
                            className="btn btn-link text-primary p-0 ms-2"
                            title="Mark completed"
                            disabled={updatingId === render.raw.id}
                            onClick={() => handleStatusUpdate(render.raw, 'completed')}
                        >
                            <i className="isax isax-tick-circle" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    //Breadcrumb Data
    const breadcrumbs = [
        {
            label: 'Car Bookings',
            active: false,
            link: routes.home1
        },
        {
            label: 'Car Bookings',
            active: true,
        },
    ];

    return (
        <div>
            <Breadcrumb title="Car Bookings" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />

            {/* Page Wrapper */}
            <div className="content">
                <div className="container">
                    <div className="row">
                        {/* Sidebar */}
                        <div className="col-xl-3 col-lg-4">
                            <Sidebar />
                        </div>
                        {/* /Sidebar */}
                        {/* Car Booking */}
                        <div className="col-xl-9 col-lg-8 theiaStickySidebar">
                            {/* Booking Header */}
                            <div className="card booking-header border-0">
                                <div className="card-body header-content d-flex align-items-center justify-content-between flex-wrap ">
                                    <div>
                                        <h6 className="mb-1">Car Bookings</h6>
                                        <p className="fs-14 text-gray-6 fw-normal ">
                                            No of Booking : {bookings.length}
                                        </p>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap">
                                        <div className="input-icon-start position-relative">
                                            <span className="icon-addon">
                                                <i className="isax isax-calendar-edit fs-14" />
                                            </span>
                                            <PredefinedDateRanges />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* /Booking Header */}

                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
                                </div>
                            )}

                            {/* Car-Booking List */}
                            <div className="card hotel-list">
                                <div className="card-body p-0">
                                    <div className="list-header d-flex align-items-center justify-content-between flex-wrap">
                                        <h6 className="">Booking List</h6>
                                        <div className="d-flex align-items-center flex-wrap">
                                            <div className="input-icon-start  me-2 position-relative">
                                                <span className="icon-addon">
                                                    <i className="isax isax-search-normal-1 fs-14" />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Search"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <span className="spinner-border spinner-border-sm text-primary me-2" />
                                            Loading bookings...
                                        </div>
                                    ) : bookings.length === 0 ? (
                                        <div className="text-center py-5">
                                            <h6>No car bookings found</h6>
                                            <p className="text-muted mb-0">Car bookings assigned to you will appear here.</p>
                                        </div>
                                    ) : (
                                        <Table dataSource={data} columns={columns} Selection={false} />
                                    )}
                                </div>
                            </div>
                            {/* /Car-Booking List */}

                        </div>
                        {/* /Car Booking */}
                    </div>
                </div>
            </div>
            {/* /Page Wrapper */}

            <AgentCarBookingModal booking={selectedBooking} />

        </div>
    )
}

export default AgentCarBooking
