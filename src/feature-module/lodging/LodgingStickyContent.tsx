import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import BannerCounter from '../../core/common/banner-counter/counter';
import { all_routes } from '../router/all_routes';
import { useAuth } from '../../core/contexts/AuthContext';
import { createBookingRequest } from '../../core/services/firebaseServices';

interface LodgingStickyContentProps {
  listingType: 'chalet' | 'resort';
  lodging?: {
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
  } | null;
}

const LodgingStickyContent = ({ listingType, lodging }: LodgingStickyContentProps) => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [defaultDate] = useState(dayjs());
  const [checkInDate, setCheckInDate] = useState(defaultDate);
  const [checkOutDate, setCheckOutDate] = useState(defaultDate.add(1, 'day'));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleBookNow = async () => {
    if (!userProfile?.uid) {
      setMessage('Sign in to request this booking.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const ownerId = lodging?.ownerId || lodging?.agentId || lodging?.createdBy || null;
      await createBookingRequest(userProfile.uid, {
        listingId: lodging?.id || `${listingType}-demo`,
        listingType,
        title: lodging?.title || lodging?.name || 'Lodging Booking',
        customerId: userProfile.uid,
        customerName: userProfile.displayName || userProfile.email || 'Customer',
        customerEmail: userProfile.email,
        customerPhone: userProfile.phone,
        ownerId,
        agentId: ownerId,
        listingOwnerId: ownerId,
        createdBy: lodging?.createdBy || null,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        price: lodging?.price ?? 500,
        currency: lodging?.currency || 'USD',
      });
      navigate(routes.userHotlesBooking);
    } catch (error) {
      console.error(`Failed to create ${listingType} booking request:`, error);
      setMessage('Unable to create booking request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sticky-components">
      <div className="card shadow-none">
        <div className="card-body">
          <div className="mb-3">
            <p className="fs-13 fw-medium mb-1">Starts From</p>
            <h5 className="text-primary mb-1">
              ${lodging?.price ?? 500} <span className="fs-14 text-default fw-normal">/ Night</span>
            </h5>
          </div>
          <div className="banner-form">
            <form>
              <div className="form-info border-0">
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-0">Check In</label>
                  <DatePicker
                    className="form-control datetimepicker"
                    placeholder="dd/mm/yyyy"
                    value={checkInDate}
                    onChange={(date) => setCheckInDate(date || defaultDate)}
                    format="DD-MM-YYYY"
                  />
                  <p className="fs-12">Monday</p>
                </div>
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-0">Check Out</label>
                  <DatePicker
                    className="form-control datetimepicker"
                    placeholder="dd/mm/yyyy"
                    value={checkOutDate}
                    onChange={(date) => setCheckOutDate(date || defaultDate.add(1, 'day'))}
                    format="DD-MM-YYYY"
                  />
                  <p className="fs-12">Monday</p>
                </div>
                <div className="card shadow-none mb-3">
                  <div className="card-body p-3 pb-0">
                    <div className="border-bottom pb-2 mb-2">
                      <h6>Details</h6>
                    </div>
                    <div className="custom-increment">
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <label className="form-label text-gray-9 mb-0">Adults</label>
                        <BannerCounter />
                      </div>
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <label className="form-label text-gray-9">Children</label>
                        <BannerCounter />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" className="btn btn-primary btn-lg search-btn ms-0 mb-3 w-100 fs-14 d-flex justify-content-center" onClick={handleBookNow} disabled={submitting}>
                {submitting ? 'Requesting...' : 'Book Now'}
              </button>
              {message && <p className="fs-14 text-gray-6 mb-0">{message}</p>}
            </form>
          </div>
          <div className="d-flex align-items-center justify-content-between mt-1">
            <p className="fs-14 text-dark d-inline-flex align-items-center mb-0"><i className="isax isax-eye me-2"></i>Listing details available</p>
            <Link to="#" className="link-primary text-decoration-underline fs-14">View Availability</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LodgingStickyContent;
