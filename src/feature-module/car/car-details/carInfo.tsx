import dayjs from 'dayjs';
import { useState } from 'react';
import { DatePicker, TimePicker } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import BannerCounter from '../../../core/common/banner-counter/counter';
import { useAuth } from '../../../core/contexts/AuthContext';
import { createBookingRequest } from '../../../core/services/firebaseServices';
import { all_routes } from '../../router/all_routes';

interface CarInfoProps {
  car?: {
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
    type?: string;
    location?: string;
    priceUnit?: string;
  } | null;
}

const CarInfo = ({ car }: CarInfoProps) => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [defaultDate] = useState(dayjs());
  const [pickupDate, setPickupDate] = useState(defaultDate);
  const [dropoffDate, setDropoffDate] = useState(defaultDate.add(1, 'day'));
  const [pickupTime, setPickupTime] = useState(dayjs('10:30 AM', 'h:mm A'));
  const [dropoffTime, setDropoffTime] = useState(dayjs('10:30 AM', 'h:mm A'));
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
      const ownerId = car?.ownerId || car?.agentId || car?.createdBy || null;
      await createBookingRequest(userProfile.uid, {
        listingId: car?.id || 'car-demo',
        listingType: 'car',
        title: car?.title || car?.name || 'Car Booking',
        customerId: userProfile.uid,
        customerName: userProfile.displayName || userProfile.email || 'Customer',
        customerEmail: userProfile.email,
        customerPhone: userProfile.phone,
        ownerId,
        agentId: ownerId,
        listingOwnerId: ownerId,
        createdBy: car?.createdBy || null,
        checkInDate: pickupDate.hour(pickupTime.hour()).minute(pickupTime.minute()).toISOString(),
        checkOutDate: dropoffDate.hour(dropoffTime.hour()).minute(dropoffTime.minute()).toISOString(),
        bookingDate: pickupDate.hour(pickupTime.hour()).minute(pickupTime.minute()).toISOString(),
        price: car?.price ?? 500,
        currency: car?.currency || 'USD',
      });
      navigate(routes.userCarBooking);
    } catch (error) {
      console.error('Failed to create car booking request:', error);
      setMessage('Unable to create booking request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="">
      <div className="card shadow-none">
        <div className="card-body">
          <h5 className="fs-18 mb-3">Check Availability</h5>
          <div className="banner-form">
            <form onSubmit={handleBookNow} className="form-info border-0">
              <div className="d-flex align-items-center border rounded mb-3">
                <div className="flex-fill">
                  <div className="form-item p-3">
                    <label className="form-label fs-14 text-default mb-1">From</label>
                    <input
                      type="text"
                      className="form-control"
                      value={car?.location || 'Pickup location'}
                      readOnly
                    />
                    <p className="fs-12 mb-0">{car?.type || 'Car rental'}</p>
                  </div>
                </div>
                <div className="form-item flex-fill ps-3 ps-sm-4 p-3">
                  <label className="form-label fs-14 text-default mb-1">To</label>
                  <input
                    type="text"
                    className="form-control"
                    value={car?.location || 'Drop-off location'}
                    readOnly
                  />
                  <p className="fs-12 mb-0">Return at same location</p>
                </div>
              </div>
              <div className="form-info border-0">
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-0">Departure</label>
                  <DatePicker
                    className="form-control datetimepicker"
                    placeholder="dd/mm/yyyy"
                    value={pickupDate}
                    onChange={(date) => setPickupDate(date || defaultDate)}
                    format="DD-MM-YYYY"
                  />
                </div>
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-0">Return</label>
                  <DatePicker
                    className="form-control datetimepicker"
                    placeholder="dd/mm/yyyy"
                    value={dropoffDate}
                    onChange={(date) => setDropoffDate(date || defaultDate.add(1, 'day'))}
                    format="DD-MM-YYYY"
                  />
                </div>
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-1">Pickup Time</label>
                  <TimePicker
                    use12Hours
                    value={pickupTime}
                    onChange={(time) => setPickupTime(time || dayjs('10:30 AM', 'h:mm A'))}
                    format="h:mm A"
                    className="form-control timepicker"
                  />
                </div>
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-1">Dropoff Time</label>
                  <TimePicker
                    use12Hours
                    value={dropoffTime}
                    onChange={(time) => setDropoffTime(time || dayjs('10:30 AM', 'h:mm A'))}
                    format="h:mm A"
                    className="form-control timepicker"
                  />
                </div>
              </div>
              <div className="card shadow-none mb-3">
                <div className="card-body p-3 pb-0">
                  <div className="border-bottom pb-2 mb-2">
                    <h6>Details</h6>
                  </div>
                  <div className="custom-increment">
                    <div className="mb-3 d-flex align-items-center justify-content-between">
                      <label className="form-label text-gray-9">Passengers</label>
                      <BannerCounter />
                    </div>
                  </div>
                </div>
              </div>
              <h6 className="text-success fs-14 fw-medium mb-3">Available For Ride</h6>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg search-btn ms-0 mb-3 w-100 fs-14 justify-content-center"
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
              <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                <i className="isax isax-medal-star"></i>
              </span>
              Expertise and Experience
            </p>
            <p className="d-flex align-items-center mb-3">
              <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                <i className="isax isax-menu"></i>
              </span>
              Tailored Services
            </p>
            <p className="d-flex align-items-center mb-3">
              <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                <i className="isax isax-message-minus"></i>
              </span>
              Comprehensive Planning
            </p>
            <p className="d-flex align-items-center mb-3">
              <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                <i className="isax isax-user-add"></i>
              </span>
              Client Satisfaction
            </p>
            <p className="d-flex align-items-center">
              <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                <i className="isax isax-grammerly"></i>
              </span>
              24/7 Support
            </p>
          </div>
        </div>
      </div>
      <div className="card shadow-none">
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
                <textarea className="form-control" rows={3}></textarea>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-lg search-btn ms-0 w-100 fs-14 justify-content-center"
              >
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
                <ImageWithBasePath
                  src="assets/img/users/user-05.jpg"
                  alt="img"
                  className="rounded-circle"
                />
              </Link>
              <div className="ms-2 overflow-hidden">
                <h6 className="fw-medium text-truncate">
                  <Link to="#">{car?.title || car?.name || 'Listing Provider'}</Link>
                </h6>
                <p className="fs-14">Member Since : 14 May 2024</p>
              </div>
            </div>
            <div className="border br-10 mb-3 p-3">
              <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary">
                  <i className="isax isax-call-outgoing5"></i>
                </span>
                <p>+1 12545 45548</p>
              </div>
              <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary">
                  <i className="isax isax-message-search5"></i>
                </span>
                <p>Info@example.com</p>
              </div>
              <div className="d-flex align-items-center">
                <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary">
                  <i className="isax isax-location-tick5"></i>
                </span>
                <p>{car?.location || '4635 Pheasant Ridge Road, USA'}</p>
              </div>
            </div>
          </div>
          <div className="row g-2">
            <div className="col-sm-6">
              <Link
                to="#"
                className="btn btn-light d-flex align-items-center justify-content-center"
              >
                <i className="isax isax-messages5 me-2"></i>
                Whatsapp Us
              </Link>
            </div>
            <div className="col-sm-6">
              <Link
                to={all_routes.chat}
                className="btn btn-primary d-flex align-items-center justify-content-center"
              >
                <i className="isax isax-message-notif5 me-2"></i>
                Chat Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarInfo;
