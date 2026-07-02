import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { createServiceRequest } from '../../../core/services/firebaseServices';
import type { CreateServiceRequestInput } from '../../../core/services/firebaseServices';
import type { DuffelOffer } from '../../../core/services/duffelApi';

const IATA_TO_LABEL: Record<string, string> = {
  TUN: 'Tunis (TUN)', SFA: 'Sfax (SFA)', MIR: 'Monastir (MIR)',
  DJE: 'Djerba (DJE)', TOE: 'Tozeur (TOE)', IST: 'Istanbul (IST)',
  CDG: 'Paris (CDG)', DXB: 'Dubai (DXB)', LHR: 'London (LHR)',
  FRA: 'Frankfurt (FRA)', FCO: 'Rome (FCO)', MAD: 'Madrid (MAD)',
  CMN: 'Casablanca (CMN)', CAI: 'Cairo (CAI)', DOH: 'Doha (DOH)',
  JFK: 'New York (JFK)',
};

const formatLabel = (iata: string) => IATA_TO_LABEL[iata] || iata;
const formatDuration = (dur: string) => {
  if (!dur) return '--';
  return dur.replace('PT', '').replace('H', 'h ').replace('M', 'm').replace('D', 'd ');
};
const formatTime = (iso: string) => {
  if (!iso) return '--';
  try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};
const formatDate = (iso: string) => {
  if (!iso) return '--';
  try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

const FlightBooking = () => {
    const navigate = useNavigate();
    const routes = all_routes;

    const breadcrumbs = [
        { label: 'Flight Booking', link: routes.allService1, active: false },
        { label: 'Flight Booking', active: true },
    ];

    const [selectedOffer] = useState<DuffelOffer | null>(() => {
        try {
            const raw = sessionStorage.getItem('duffelOffer');
            return raw ? (JSON.parse(raw) as DuffelOffer) : null;
        } catch { return null; }
    });

    const hasOffer = Boolean(selectedOffer?.offerId);
    const offer = hasOffer ? (selectedOffer as DuffelOffer) : null;

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
            const payload: CreateServiceRequestInput = {
                serviceType: 'flight',
                serviceId: 'flight-request',
                serviceTitle: offer
                    ? `Flight Request - ${offer.airline} (${offer.airlineIata})`
                    : 'Flight Request',
                customerName: name.trim(),
                customerEmail: email.trim(),
                customerPhone: phone.trim() || undefined,
                message: message.trim() || undefined,
            };

            if (offer) {
                payload.departureCity = offer.slices[0]?.origin || '';
                payload.arrivalCity = offer.slices[0]?.destination || '';
                payload.departureDate = offer.slices[0]?.departureTime?.split('T')[0] || '';
                payload.passengers = 1;
                payload.preferredClass = offer.cabinClass
                    ? offer.cabinClass.charAt(0).toUpperCase() + offer.cabinClass.slice(1)
                    : 'Economy';
                payload.provider = 'duffel';
                payload.offerSnapshot = offer as unknown as Record<string, unknown>;
            } else {
                payload.departureCity = departureCity.trim() || undefined;
                payload.arrivalCity = arrivalCity.trim() || undefined;
                payload.departureDate = departureDate || undefined;
                payload.returnDate = returnDate || undefined;
                payload.passengers = passengers;
                payload.preferredClass = preferredClass || undefined;
            }

            await createServiceRequest(payload);
            sessionStorage.removeItem('duffelOffer');
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
                                    <h5>{offer ? 'Request this Flight' : 'Send a Flight Request'}</h5>
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
                                                <label className="form-label">Phone / WhatsApp</label>
                                                <input type="tel" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your phone number" />
                                            </div>
                                        </div>

                                        {!offer && (
                                            <>
                                                <div className="checkout-title mb-3">
                                                    <h6 className="mb-2">Flight Details</h6>
                                                </div>
                                                <div className="row g-3 mb-4">
                                                    <div className="col-md-6">
                                                        <label className="form-label">From</label>
                                                        <input className="form-control" value={departureCity} onChange={e => setDepartureCity(e.target.value)} placeholder="e.g. Tunis" />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label">To</label>
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
                                            </>
                                        )}

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
                                        <h5>Review Flight Request</h5>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {offer ? (
                                        <>
                                            <div className="pb-3 border-bottom">
                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                    <div>
                                                        <h6 className="mb-1">{offer.airline} ({offer.airlineIata})</h6>
                                                        <span className="badge bg-secondary fs-11">Provider: Duffel</span>
                                                    </div>
                                                    <h5 className="text-primary mb-0">{offer.totalCurrency} {offer.totalAmount}</h5>
                                                </div>
                                                {offer.slices.map((s, i) => (
                                                    <div key={i} className="mb-2 pb-2 border-bottom">
                                                        <div className="fw-medium mb-1">{formatLabel(s.origin)} &rarr; {formatLabel(s.destination)}</div>
                                                        <div className="fs-14 text-muted">
                                                            <div>Depart: {formatDate(s.departureTime)} at {formatTime(s.departureTime)}</div>
                                                            <div>Arrive: {formatTime(s.arrivalTime)}</div>
                                                            <div>Duration: {formatDuration(s.duration)}</div>
                                                            <div>{s.stops === 0 ? 'Direct' : `${s.stops} stop${s.stops > 1 ? 's' : ''}`}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="fs-14 mt-2">
                                                    <span className="text-muted">Class:</span> {offer.cabinClass ? offer.cabinClass.charAt(0).toUpperCase() + offer.cabinClass.slice(1) : 'Economy'}
                                                </div>
                                            </div>
                                            <div className="mt-3 pb-3 border-bottom">
                                                <h6 className="text-primary mb-3">Pricing</h6>
                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                    <span className="fs-16">Total</span>
                                                    <span className="fs-16 fw-medium">{offer.totalCurrency} {offer.totalAmount}</span>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span className="fs-14 text-muted">Manual payment only</span>
                                                    <span className="fs-14 text-muted">No online card payment</span>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <h6>Status</h6>
                                                    <h6 className="text-primary">Send a request</h6>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-3 review-img">
                                                <ImageWithBasePath src="assets/img/flight/flight-large-01.jpg" alt="Img" className="img-fluid" />
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <h6 className="mb-2">Custom Flight Quote</h6>
                                                    <p className="fs-14">
                                                        <span className="badge badge-warning text-gray-9 fs-13 fw-medium me-2">Request</span>
                                                        Tell us your route
                                                    </p>
                                                </div>
                                                <h6 className="fs-14 fw-normal text-gray-9">Contact for pricing</h6>
                                            </div>
                                        </>
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

export default FlightBooking;