
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import type { Booking } from '../../../../core/services/firebaseServices';
import { bookingStatusDisplay } from '../../../../core/services/agentServices';

interface AgentCarBookingModalProps {
    booking?: Booking | null;
}

const AgentCarBookingModal = ({ booking }: AgentCarBookingModalProps) => {

    const routes = all_routes;
    const status = bookingStatusDisplay(booking?.status);
    const amount = typeof booking?.totalAmount === 'number' ? booking.totalAmount : booking?.price || 0;
    const currency = booking?.currency || 'USD';

    const formatDate = (value?: string) => {
        if (!value) return '—';
        try {
            return new Date(value).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
        } catch {
            return value;
        }
    };

    const ModalContent = () => (
        <div className="modal-content">
            <div className="modal-header">
                <h5>
                    Booking Info{" "}
                    <span className="fs-14 fw-medium text-primary">#{booking?.id?.slice(-6).toUpperCase() || '—'}</span>
                </h5>
                <Link
                    to="#"
                    data-bs-dismiss="modal"
                    className="btn-close text-dark"
                />
            </div>
            <div className="modal-body">
                <div className="upcoming-content">
                    <div className="upcoming-title mb-4 d-flex align-items-center justify-content-between p-3 rounded">
                        <div className="d-flex align-items-center flex-wrap">
                            <div className="me-2">
                                <ImageWithBasePath
                                    src={booking?.itemImage || "assets/img/cars/car-16.jpg"}
                                    alt="image"
                                    className="avatar avartar-md avatar-rounded"
                                    fallbackSrc="assets/img/cars/car-16.jpg"
                                />
                            </div>
                            <div>
                                <h6 className="mb-1">{booking?.itemTitle || 'Car'}</h6>
                            </div>
                        </div>
                        <div>
                            <span className={`badge ${status.badge} rounded-pill d-inline-flex align-items-center fs-10`}>
                                <i className="fa-solid fa-circle fs-5 me-1" />
                                {status.label}
                            </span>
                        </div>
                    </div>
                    <div className="upcoming-details ">
                        <h6 className="mb-2">Booking Info</h6>
                        <div className="row gy-3">
                            <div className="col-lg-3">
                                <h6 className="fs-14">Customer</h6>
                                <p className="text-gray-6 fs-16 ">{booking?.userName || booking?.userEmail || '—'}</p>
                            </div>
                            <div className="col-lg-3">
                                <h6 className="fs-14">Booked On</h6>
                                <p className="text-gray-6 fs-16 ">{formatDate(booking?.createdAt)}</p>
                            </div>
                            <div className="col-lg-3">
                                <h6 className="fs-14">Pickup</h6>
                                <p className="text-gray-6 fs-16 ">{formatDate(booking?.startDate || booking?.bookingDate)}</p>
                            </div>
                            <div className="col-lg-3">
                                <h6 className="fs-14">Amount</h6>
                                <p className="text-gray-6 fs-16 ">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)}</p>
                            </div>
                        </div>
                    </div>
                    {booking?.cancellationReason && (
                        <div className="upcoming-details mb-0">
                            <h6 className="mb-2">Cancel Reason</h6>
                            <p className="text-gray-6 fs-16 ">{booking.cancellationReason}</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="modal-footer">
                <Link to={routes.carDetails} className="btn btn-md btn-primary">
                    View Listing
                </Link>
            </div>
        </div>
    );

    return (
        <>
            <div className="modal fade" id="upcoming">
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <ModalContent />
                </div>
            </div>
            <div className="modal fade" id="completed">
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <ModalContent />
                </div>
            </div>
            <div className="modal fade" id="cancelled">
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <ModalContent />
                </div>
            </div>
        </>
    );
}

export default AgentCarBookingModal
