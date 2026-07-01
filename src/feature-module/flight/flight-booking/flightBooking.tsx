import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { createServiceRequest } from '../../../core/services/firebaseServices';

const FlightBooking = () => {
    const navigate = useNavigate();
    const routes = all_routes;

    const breadcrumbs = [
        { label: 'Flight Booking', link: routes.allService1, active: false },
        { label: 'Flight Booking', active: true },
    ];

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [departureCity, setDepartureCity] = useState('');
    const [arrivalCity, setArrivalCity] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [passengers, setPassengers] = useState(1);
    const [preferredClass, setPreferredClass] = useState('Economy');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim() || !email.trim()) {
            setError('Name and email are required');
            return;
        }
        setSubmitting(true);
        try {
            await createServiceRequest({
                serviceType: 'flight',
                serviceId: 'flight-request',
                serviceTitle: 'Flight Request',
                customerName: name.trim(),
                customerEmail: email.trim(),
                customerPhone: phone.trim() || undefined,
                message: message.trim() || undefined,
                departureCity: departureCity.trim() || undefined,
                arrivalCity: arrivalCity.trim() || undefined,
                departureDate: departureDate || undefined,
                returnDate: returnDate || undefined,
                passengers,
                preferredClass: preferredClass || undefined,
            });
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div>
                <Breadcrumb title="Flight Booking" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-05" />
                <div className="content content-two">
                    <div className="container">
                        <div className="card text-center p-5">
                            <div className="mb-3">
                                <i className="isax isax-tick-circle text-success fs-40" />
                            </div>
                            <h4 className="mb-2">Request Sent Successfully</h4>
                            <p className="text-gray-6 mb-4">Our team will contact you to confirm the flight details.</p>
                            <div className="d-flex justify-content-center gap-2">
                                <button className="btn btn-primary" onClick={() => navigate(routes.flightDetails)}>
                                    Browse Flights
                                </button>
                                <button className="btn btn-light" onClick={() => navigate(routes.allService1)}>
                                    Back to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Breadcrumb title="Flight Booking" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-05" />
            <div className="content content-two">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="card checkout-card">
                                <div className="card-header">
                                    <h5>Send a Flight Request</h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleSubmit}>
                                        <div className="checkout-title mb-3">
                                            <h6 className="mb-2">Contact Info</h6>
                                        </div>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Name <span className="text-danger">*</span></label>
                                                <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Email <span className="text-danger">*</span></label>
                                                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Phone</label>
                                                <input type="tel" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your phone" />
                                            </div>
                                        </div>

                                        <div className="checkout-title mb-3">
                                            <h6 className="mb-2">Flight Details</h6>
                                        </div>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Departure City</label>
                                                <input className="form-control" value={departureCity} onChange={e => setDepartureCity(e.target.value)} placeholder="e.g. Tunis" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Arrival City</label>
                                                <input className="form-control" value={arrivalCity} onChange={e => setArrivalCity(e.target.value)} placeholder="e.g. Djerba" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Departure Date</label>
                                                <input type="date" className="form-control" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Return Date</label>
                                                <input type="date" className="form-control" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Passengers</label>
                                                <input type="number" min="1" className="form-control" value={passengers} onChange={e => setPassengers(Number(e.target.value))} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Preferred Class</label>
                                                <select className="form-select" value={preferredClass} onChange={e => setPreferredClass(e.target.value)}>
                                                    <option value="Economy">Economy</option>
                                                    <option value="Business">Business</option>
                                                    <option value="First Class">First Class</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="checkout-title mb-3">
                                            <h6 className="mb-2">Additional Info</h6>
                                        </div>
                                        <div className="mb-4">
                                            <textarea className="form-control" rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Any special requirements or notes..." />
                                        </div>

                                        {error && <div className="alert alert-danger py-2">{error}</div>}

                                        <div className="d-flex align-items-center justify-content-end gap-2">
                                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                                {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</> : 'Send Request'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="card order-details theiaStickySidebar">
                                <div className="card-header">
                                    <div className="d-flex align-items-center justify-content-between header-content">
                                        <h5>Review Order Details</h5>
                                        <Link to={routes.flightDetails} className="rounded-circle p-2 btn btn-light d-flex align-items-center justify-content-center">
                                            <span className="fs-16 d-flex align-items-center justify-content-center">
                                                <i className="isax isax-edit-2" />
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="pb-3 border-bottom">
                                        <div className="mb-3 review-img">
                                            <ImageWithBasePath src="assets/img/flight/flight-large-01.jpg" alt="Img" className="img-fluid" />
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <h6 className="mb-2">Flight Request</h6>
                                                <p className="fs-14">
                                                    <span className="badge badge-warning text-gray-9 fs-13 fw-medium me-2">Request</span>
                                                    Send a request
                                                </p>
                                            </div>
                                            <h6 className="fs-14 fw-normal text-gray-9">Contact for pricing</h6>
                                        </div>
                                    </div>
                                    <div className="mt-3 pb-3 border-bottom">
                                        <h6 className="text-primary mb-3">Your Details</h6>
                                        <div className="d-flex align-items-center details-info">
                                            <h6 className="fs-16">From</h6>
                                            <p className="fs-16">{departureCity || 'To be specified'}</p>
                                        </div>
                                        <div className="d-flex align-items-center details-info">
                                            <h6 className="fs-16">To</h6>
                                            <p className="fs-16">{arrivalCity || 'To be specified'}</p>
                                        </div>
                                        <div className="d-flex align-items-center details-info">
                                            <h6 className="fs-16">Passengers</h6>
                                            <p className="fs-16">{passengers}</p>
                                        </div>
                                        <div className="d-flex align-items-center details-info">
                                            <h6 className="fs-16">Class</h6>
                                            <p className="fs-16">{preferredClass}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 border-bottom">
                                        <h6 className="text-primary mb-3">Pricing</h6>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h6 className="fs-16">Price</h6>
                                            <p className="fs-16">Contact for pricing</p>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h6 className="fs-16">Manual payment only</h6>
                                            <p className="fs-16">No online card payment</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <h6>Status</h6>
                                            <h6 className="text-primary">Send a request</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlightBooking;