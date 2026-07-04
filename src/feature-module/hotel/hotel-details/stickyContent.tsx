import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BannerCounter from '../../../core/common/banner-counter/counter';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { all_routes } from '../../router/all_routes';
import { formatHotelPrice } from '../../../core/common/hotelPricing';

type StickyContentProps = {
  hotel?: {
    id?: string;
    title?: string;
    location?: string;
    image?: string;
    gallery?: string[];
    price?: number | null;
    priceFrom?: number | null;
    priceCurrency?: string;
    priceUnit?: string;
    priceNote?: string;
    bookingMode?: string;
    bookingEnabled?: boolean;
    sourceName?: string;
    sourceUrl?: string;
    selectedBoardType?: string;
    nearbyLandmarks?: string[];
    latitude?: number | string | null;
    longitude?: number | string | null;
    viewsCount?: number | string | null;
    providerMessage?: string;
    providerPhone?: string;
    providerEmail?: string;
  } | null;
  initialCheckInDate?: string;
  initialCheckOutDate?: string;
  initialAdults?: number;
  initialRooms?: number;
  initialChildren?: number;
  initialChildAges?: string;
};

const parseDateValue = (value?: string, fallback?: dayjs.Dayjs) => {
  if (!value) return fallback;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : fallback;
};

const StickyContent = ({
  hotel,
  initialCheckInDate,
  initialCheckOutDate,
  initialAdults = 2,
  initialRooms = 1,
  initialChildren = 0,
  initialChildAges = '',
}: StickyContentProps) => {
  const routes = all_routes;
  const navigate = useNavigate();

  const [checkInDate, setCheckInDate] = useState(() =>
    (parseDateValue(initialCheckInDate, dayjs()) || dayjs()).toDate(),
  );
  const [checkOutDate, setCheckOutDate] = useState(() =>
    (parseDateValue(initialCheckOutDate, dayjs().add(1, 'day')) || dayjs().add(1, 'day')).toDate(),
  );
  const [rooms, setRooms] = useState(Math.max(1, initialRooms || 1));
  const [adults, setAdults] = useState(Math.max(1, initialAdults || 1));
  const [children, setChildren] = useState(Math.max(0, initialChildren || 0));

  const isRequestOnly = hotel?.bookingMode === 'request_only' || hotel?.bookingEnabled === false;

  const priceCopy = useMemo(
    () =>
      formatHotelPrice(
        {
          priceFrom: hotel?.priceFrom ?? hotel?.price,
          priceCurrency: hotel?.priceCurrency,
          priceUnit: hotel?.priceUnit,
          priceNote: hotel?.priceNote || 'Final price and availability are confirmed after request',
        },
        { prefix: 'Starts From', fallbackLabel: 'Price on request' },
      ),
    [hotel?.price, hotel?.priceCurrency, hotel?.priceFrom, hotel?.priceNote, hotel?.priceUnit],
  );

  const hasValidCoordinates =
    Number.isFinite(Number(hotel?.latitude)) &&
    Number.isFinite(Number(hotel?.longitude)) &&
    Number(hotel?.latitude) > 30 &&
    Number(hotel?.latitude) < 38 &&
    Number(hotel?.longitude) > 7 &&
    Number(hotel?.longitude) < 12.5;

  const mapSrc = hasValidCoordinates
    ? `https://www.google.com/maps?q=${Number(hotel?.latitude)},${Number(hotel?.longitude)}&z=14&output=embed`
    : '';

  const persistSelection = () => {
    const snapshot = {
      id: hotel?.id || '',
      title: hotel?.title || '',
      city: hotel?.location || '',
      location: hotel?.location || '',
      price: hotel?.price ?? hotel?.priceFrom ?? 0,
      priceFrom: hotel?.priceFrom ?? hotel?.price ?? 0,
      priceCurrency: hotel?.priceCurrency || '',
      priceUnit: hotel?.priceUnit || 'night',
      priceNote: hotel?.priceNote || 'Final price and availability are confirmed after request',
      image: hotel?.image || hotel?.gallery?.[0] || '',
      amenities: [],
      bookingMode: hotel?.bookingMode || '',
      sourceName: hotel?.sourceName || '',
      sourceUrl: hotel?.sourceUrl || '',
      selectedBoardType: hotel?.selectedBoardType || '',
    };
    sessionStorage.setItem('manualHotelSelection', JSON.stringify(snapshot));
  };

  const goToRequest = () => {
    persistSelection();
    const params = new URLSearchParams();
    params.set('provider', 'manual');
    params.set('source', 'manual');
    if (hotel?.id) params.set('hotelId', hotel.id);
    if (hotel?.title) params.set('hotelName', hotel.title);
    if (hotel?.location) params.set('destination', hotel.location);
    params.set('checkInDate', dayjs(checkInDate).format('YYYY-MM-DD'));
    params.set('checkOutDate', dayjs(checkOutDate).format('YYYY-MM-DD'));
    params.set('adults', String(Math.max(1, adults || 1)));
    params.set('rooms', String(Math.max(1, rooms || 1)));
    params.set('children', String(Math.max(0, children || 0)));
    if (initialChildAges) params.set('childAges', initialChildAges);
    if (hotel?.selectedBoardType) params.set('selectedBoardType', hotel.selectedBoardType);
    if (hotel?.priceFrom != null) params.set('priceFrom', String(hotel.priceFrom));
    if (hotel?.priceCurrency) params.set('priceCurrency', hotel.priceCurrency);
    if (hotel?.priceUnit) params.set('priceUnit', hotel.priceUnit);
    if (hotel?.sourceName) params.set('sourceName', hotel.sourceName);
    if (hotel?.sourceUrl) params.set('sourceUrl', hotel.sourceUrl);
    navigate(`/hotel/hotel-request?${params.toString()}`);
  };

  return (
    <div className="sticky-components">
      <div className="card shadow-none">
        <div className="card-body">
          <div className="mb-3">
            <p className="fs-13 fw-medium mb-1">{priceCopy.headline}</p>
            <p className="fs-12 text-muted mb-0">
              {priceCopy.note || 'Final price and availability are confirmed after request'}
            </p>
          </div>
          <div className="banner-form">
            <form>
              <div className="form-info border-0">
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-0">Check In</label>
                  <DatePicker
                    className="form-control datetimepicker"
                    placeholder="dd/mm/yyyy"
                    value={dayjs(checkInDate)}
                    onChange={(date) => setCheckInDate((date || dayjs()).toDate())}
                    format="DD-MM-YYYY"
                  />
                </div>
                <div className="form-item border rounded p-3 mb-3 w-100">
                  <label className="form-label fs-14 text-default mb-0">Check Out</label>
                  <DatePicker
                    className="form-control datetimepicker"
                    placeholder="dd/mm/yyyy"
                    value={dayjs(checkOutDate)}
                    onChange={(date) => setCheckOutDate((date || dayjs().add(1, 'day')).toDate())}
                    format="DD-MM-YYYY"
                  />
                </div>
                <div className="card shadow-none mb-3">
                  <div className="card-body p-3 pb-0">
                    <div className="border-bottom pb-2 mb-2">
                      <h6>Details</h6>
                    </div>
                    <div className="custom-increment">
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <label className="form-label text-gray-9 mb-0">Rooms</label>
                        <BannerCounter value={rooms} setValue={setRooms} />
                      </div>
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <label className="form-label text-gray-9 mb-0">Adults</label>
                        <BannerCounter value={adults} setValue={setAdults} />
                      </div>
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <label className="form-label text-gray-9">Children <span className="text-default fw-normal">( 2-12 Yrs )</span></label>
                        <BannerCounter value={children} setValue={setChildren} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-lg search-btn ms-0 mb-3 w-100 fs-14 d-flex justify-content-center"
                onClick={goToRequest}
              >
                {isRequestOnly ? 'Request this hotel' : 'Continue'}
              </button>
            </form>
          </div>
          <div className="d-flex align-items-center justify-content-between mt-1">
            {typeof hotel?.viewsCount === 'number' && hotel.viewsCount > 0 ? (
              <p className="fs-14 text-dark d-inline-flex align-items-center mb-0">
                <i className="isax isax-eye me-2" />
                {hotel.viewsCount} Views
              </p>
            ) : (
              <span className="fs-14 text-muted mb-0">Request-only hotel</span>
            )}
            <Link to="#availability" className="link-primary text-decoration-underline fs-14">
              View Request Details
            </Link>
          </div>
        </div>
      </div>

      <div className="card shadow-none" id="location">
        {hasValidCoordinates ? (
          <div>
            <iframe
              src={mapSrc}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="contact-map"
              title="Hotel location map"
            />
          </div>
        ) : (
          <div className="p-4 text-center border-bottom">
            <p className="mb-0 text-muted">Location map unavailable</p>
          </div>
        )}
        <div className="card-body">
          <div className="mb-1 d-flex align-items-center justify-content-between flex-wrap">
            <p className="d-flex align-items-center mb-3">
              <i className="isax isax-location5 me-2" />
              {hotel?.location || 'Property location not specified'}
            </p>
          </div>
          <h5 className="mb-3 fs-18">Nearby Landmarks & Visits</h5>
          {(hotel?.nearbyLandmarks?.length ? hotel.nearbyLandmarks : ['Nearby attractions not provided']).map((landmark) => (
            <p className="d-flex align-items-center mb-2" key={landmark}>
              <i className="isax isax-tick-circle me-2" />
              {landmark}
            </p>
          ))}
        </div>
      </div>

      <div className="card shadow-none mb-0">
        <div className="card-body">
          <h5 className="mb-3 fs-18">Provider Details</h5>
          <p className="text-muted mb-3">
            {hotel?.providerMessage || 'DreamsTour will confirm availability and price after request.'}
          </p>
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
