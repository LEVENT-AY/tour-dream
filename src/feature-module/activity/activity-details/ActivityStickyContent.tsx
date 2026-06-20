import dayjs from 'dayjs';
import { useState } from 'react';
import { DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';
import BannerCounter from '../../../core/common/banner-counter/counter';
import { useAuth } from '../../../core/contexts/AuthContext';
import { createBookingRequest } from '../../../core/services/firebaseServices';
import { all_routes } from '../../router/all_routes';

interface ActivityStickyContentProps {
  activity?: {
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
    duration?: string;
  } | null;
}

const ActivityStickyContent = ({ activity }: ActivityStickyContentProps) => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [defaultDate] = useState(dayjs());
  const [activityDate, setActivityDate] = useState(defaultDate);
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
      const ownerId = activity?.ownerId || activity?.agentId || activity?.createdBy || null;
      await createBookingRequest(userProfile.uid, {
        listingId: activity?.id || 'activity-demo',
        listingType: 'activity',
        title: activity?.title || activity?.name || 'Activity Booking',
        customerId: userProfile.uid,
        customerName: userProfile.displayName || userProfile.email || 'Customer',
        customerEmail: userProfile.email,
        customerPhone: userProfile.phone,
        ownerId,
        agentId: ownerId,
        listingOwnerId: ownerId,
        createdBy: activity?.createdBy || null,
        startDate: activityDate.toISOString(),
        bookingDate: activityDate.toISOString(),
        price: activity?.price ?? 400,
        currency: activity?.currency || 'USD',
      });
      navigate(routes.userActivitiesBooking);
    } catch (error) {
      console.error('Failed to create activity booking request:', error);
      setMessage('Unable to create booking request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-none">
      <div className="card-body">
        <div className="pb-3 mb-3 border-bottom">
          <div className="row">
            <div className="col-lg-6">
              <p className="mb-2">Starts From</p>
              <h4 className="text-primary">
                ${activity?.price ?? 400}{' '}
                <span className="fs-14 text-default fw-normal">/ Person</span>
              </h4>
            </div>
            <div className="col-lg-6">
              <label>Select your Date</label>
              <div className="input-icon-end position-relative">
                <DatePicker
                  className="form-control datetimepicker"
                  placeholder="dd/mm/yyyy"
                  value={activityDate}
                  onChange={(date) => setActivityDate(date || defaultDate)}
                  format="DD-MM-YYYY"
                />
                <span className="input-icon-addon">
                  <i className="isax isax-calendar" />
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-3 pb-3 border-bottom">
          <div className="card shadow-none mb-0">
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
                  <label className="form-label text-gray-9 mb-0">
                    Children <span className="text-default fw-normal">( 2-12 Yrs )</span>
                  </label>
                  <BannerCounter />
                </div>
                <div className="mb-3 d-flex align-items-center justify-content-between">
                  <label className="form-label text-gray-9 mb-0">Duration</label>
                  <span className="text-default">{activity?.duration || 'Half day'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleBookNow}
          disabled={submitting}
          className="btn btn-primary rounded-pill w-100 mt-3"
        >
          {submitting ? 'Requesting...' : 'Book Now'}
        </button>
        {message && <p className="fs-14 text-gray-6 mb-0 mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default ActivityStickyContent;
