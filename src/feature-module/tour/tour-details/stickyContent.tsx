import dayjs from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DatePicker } from 'antd';
import BannerCounter from '../../../core/common/banner-counter/counter';
import { all_routes } from '../../router/all_routes';
import { useAuth } from '../../../core/contexts/AuthContext';
import { createBookingRequest } from '../../../core/services/firebaseServices';

interface StickyContentProps {
  tour?: {
    id?: string;
    title?: string;
    name?: string;
    image?: string;
    gallery?: string[];
    price?: number;
    currency?: string;
    ownerId?: string | null;
    agentId?: string | null;
    createdBy?: string | null;
    location?: string;
    duration?: string;
    category?: string;
    description?: string;
    departure?: string;
    returnDate?: string;
    dates?: string;
  } | null;
}

const StickyContent = ({ tour }: StickyContentProps) => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [defaultDate] = useState(dayjs());
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate.add(1, 'day'));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleBookNow = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userProfile?.uid) {
      setMessage('Sign in to request this booking.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const ownerId = tour?.ownerId || tour?.agentId || tour?.createdBy || null;
      await createBookingRequest(userProfile.uid, {
        listingId: tour?.id || 'tour-demo',
        listingType: 'tour',
        title: tour?.title || tour?.name || 'Tour Booking',
        customerId: userProfile.uid,
        customerName: userProfile.displayName || userProfile.email || 'Customer',
        customerEmail: userProfile.email,
        customerPhone: userProfile.phone,
        ownerId,
        agentId: ownerId,
        listingOwnerId: ownerId,
        createdBy: tour?.createdBy || null,
        checkInDate: startDate.toISOString(),
        checkOutDate: endDate.toISOString(),
        price: tour?.price ?? 500,
        currency: tour?.currency || 'USD',
      });
      navigate(routes.userTourBooking);
    } catch (error) {
      console.error('Failed to create tour booking request:', error);
      setMessage('Unable to create booking request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="">
      <div className="card bg-light-200">
        <div className="card-body">
          <h5 className="d-flex align-items-center fs-18 mb-3">
            <span className="avatar avatar-md rounded-circle bg-primary me-2">
              <i className="isax isax-signpost5" />
            </span>
            Tour Details
          </h5>
          <div>
            <div className="d-flex align-items-center justify-content-between details-info">
              <h6 className="fw-medium">Duration</h6>
              <p className="flex-fill">{tour?.duration || 'Not provided'}</p>
            </div>
            <div className="d-flex align-items-center justify-content-between details-info">
              <h6 className="fw-medium">Location</h6>
              <p className="flex-fill">{tour?.location || 'Not provided'}</p>
            </div>
            <div className="d-flex align-items-center justify-content-between details-info">
              <h6 className="fw-medium">Category</h6>
              <p className="flex-fill">{tour?.category || 'Tour'}</p>
            </div>
            <div className="d-flex align-items-center justify-content-between details-info">
              <h6 className="fw-medium">Dates</h6>
              <p className="flex-fill">{tour?.dates || 'Not provided'}</p>
            </div>
            <div className="d-flex align-items-center justify-content-between details-info">
              <h6 className="fw-medium">Departure</h6>
              <p className="flex-fill">{tour?.departure || 'Not provided'}</p>
            </div>
            <div className="d-flex align-items-center justify-content-between details-info">
              <h6 className="fw-medium">Return</h6>
              <p className="flex-fill">{tour?.returnDate || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-none">
        <div className="card-body">
          <div className="mb-3">
            <p className="fs-13 fw-medium mb-1">Starts From</p>
            <h5 className="text-primary mb-1">
              ${tour?.price ?? 500}{' '}
              <span className="fs-14 text-default fw-normal">/ Person</span>
            </h5>
          </div>
          <div className="banner-form">
            <form onSubmit={handleBookNow}>
              <div className="form-info border-0">
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-0">From</label>
                  <DatePicker
                    className="form-control datetimepicker"
                    placeholder="dd/mm/yyyy"
                    value={startDate}
                    onChange={(date) => setStartDate(date || defaultDate)}
                    format="DD-MM-YYYY"
                  />
                </div>
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-0">To</label>
                  <DatePicker
                    className="form-control datetimepicker"
                    placeholder="dd/mm/yyyy"
                    value={endDate}
                    onChange={(date) => setEndDate(date || defaultDate.add(1, 'day'))}
                    format="DD-MM-YYYY"
                  />
                </div>
                <div className="card shadow-none mb-3">
                  <div className="card-body p-3 pb-0">
                    <div className="border-bottom pb-2 mb-2">
                      <h6>Guests</h6>
                    </div>
                    <div className="custom-increment">
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <label className="form-label text-gray-9 mb-0">Adults</label>
                        <BannerCounter />
                      </div>
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <label className="form-label text-gray-9 mb-0">Children</label>
                        <BannerCounter />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg search-btn ms-0 w-100 fs-14 d-flex justify-content-center"
              >
                {submitting ? 'Requesting...' : 'Book Now'}
              </button>
              {message && <p className="fs-14 text-gray-6 mb-0 mt-2">{message}</p>}
            </form>
          </div>
        </div>
      </div>
      <div className="card shadow-none">
        <div className="card-body">
          <h5 className="fs-18 mb-3">Why Book With Us</h5>
          <div>
            <p className="d-flex align-items-center mb-3">
              <i className="isax isax-medal-star text-primary me-2" />
              Verified travel support
            </p>
            <p className="d-flex align-items-center mb-3">
              <i className="isax isax-menu text-primary me-2" />
              Transparent itinerary details
            </p>
            <p className="d-flex align-items-center mb-3">
              <i className="isax isax-message-minus text-primary me-2" />
              Responsive guest assistance
            </p>
            <p className="d-flex align-items-center mb-3">
              <i className="isax isax-user-add text-primary me-2" />
              Booking coordination
            </p>
            <p className="d-flex align-items-center">
              <i className="isax isax-grammerly text-primary me-2" />
              24/7 Support
            </p>
          </div>
        </div>
      </div>
      <div className="card shadow-none mb-0">
        <div className="card-body">
          <h5 className="fs-18 mb-3">Enquire Us</h5>
          <div className="banner-form">
            <form action="#">
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="text" className="form-control" />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" />
              </div>
              <div className="mb-3">
                <label className="form-label">Message</label>
                <textarea className="form-control" rows={3} />
              </div>
              <button type="button" className="btn btn-primary btn-lg search-btn ms-0 w-100 fs-14 d-flex justify-content-center">
                Submit Enquiry
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="card shadow-none mb-0">
        <div className="card-body">
          <h5 className="fs-18 mb-3">Provider Details</h5>
          <div className="py-1">
            <div className="bg-light-500 br-10 mb-3 d-flex align-items-center p-3">
              <Link to="#" className="avatar avatar-lg flex-shrink-0">
                <div className="avatar avatar-lg bg-primary-transparent rounded-circle d-flex align-items-center justify-content-center">
                  <i className="isax isax-user text-primary" />
                </div>
              </Link>
              <div className="ms-2 overflow-hidden">
                <h6 className="fw-medium text-truncate mb-1">
                  <Link to="#">{tour?.title || tour?.name || 'Listing support'}</Link>
                </h6>
                <p className="fs-14 mb-0">Managed by DreamsTour</p>
              </div>
            </div>
            <div className="border br-10 mb-3 p-3">
              <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary">
                  <i className="isax isax-call-outgoing5" />
                </span>
                <p>Travel support available on request</p>
              </div>
              <div className="d-flex align-items-center">
                <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary">
                  <i className="isax isax-message-search5" />
                </span>
                <p>support@tour-dream.com</p>
              </div>
            </div>
          </div>
          <div className="row g-2">
            <div className="col-sm-6">
              <Link to="#" className="btn btn-light d-flex align-items-center justify-content-center">
                <i className="isax isax-messages5 me-2" />
                Whatsapp Us
              </Link>
            </div>
            <div className="col-sm-6">
              <Link to={routes.userChat} className="btn btn-primary d-flex align-items-center justify-content-center">
                <i className="isax isax-message-notif5 me-2" />
                Chat Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyContent;
