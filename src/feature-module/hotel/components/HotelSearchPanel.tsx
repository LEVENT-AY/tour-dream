import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BannerCounter from '../../../core/common/banner-counter/counter';
import BookingDropdown from '../../../core/common/booking-dropdown/bookingDropdown';
import CommonDateRange from '../../../core/common/dateRange/CommonDateRange';
import { TUNISIA_HOTEL_LOCATIONS, findTunisiaHotelLocation } from '../../../core/common/data/tunisiaHotelLocations';
import { all_routes } from '../../router/all_routes';

type HotelSearchPanelProps = {
  standalone?: boolean;
  initialDestination?: string;
  initialCheckInDate?: string;
  initialCheckOutDate?: string;
  initialAdults?: number;
  initialRooms?: number;
};

const parseDateValue = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const formatDateValue = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDestination = (value: string): string => {
  const text = value.trim();
  if (!text || text.toLowerCase() === 'select') return '';
  return text;
};

const HotelSearchPanel = ({
  standalone = false,
  initialDestination = '',
  initialCheckInDate = '',
  initialCheckOutDate = '',
  initialAdults = 1,
  initialRooms = 1,
}: HotelSearchPanelProps) => {
  const navigate = useNavigate();
  const routes = all_routes;

  const [destination, setDestination] = useState(initialDestination);
  const [adults, setAdults] = useState(Math.max(1, initialAdults));
  const [rooms, setRooms] = useState(Math.max(1, initialRooms));
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [checkInDate, setCheckInDate] = useState<Date>(
    parseDateValue(initialCheckInDate) ?? new Date(Date.now() + 86400000),
  );
  const [checkOutDate, setCheckOutDate] = useState<Date>(
    parseDateValue(initialCheckOutDate) ?? new Date(Date.now() + 3 * 86400000),
  );
  const [priceValue, setPriceValue] = useState('Any price');
  const [priceSubValue, setPriceSubValue] = useState('Search available hotels');

  const priceOptions = [
    { value: 'Any price', subValue: 'Search available hotels' },
  ];

  useEffect(() => {
    setDestination(initialDestination);
  }, [initialDestination]);

  useEffect(() => {
    setAdults(Math.max(1, initialAdults || 1));
  }, [initialAdults]);

  useEffect(() => {
    setRooms(Math.max(1, initialRooms || 1));
  }, [initialRooms]);

  useEffect(() => {
    const nextCheckIn = parseDateValue(initialCheckInDate);
    if (nextCheckIn) setCheckInDate(nextCheckIn);
  }, [initialCheckInDate]);

  useEffect(() => {
    const nextCheckOut = parseDateValue(initialCheckOutDate);
    if (nextCheckOut) setCheckOutDate(nextCheckOut);
  }, [initialCheckOutDate]);

  const selectedLocation = useMemo(
    () => findTunisiaHotelLocation(destination),
    [destination],
  );

  const guestSummary = `${adults} Adult${adults === 1 ? '' : 's'}, ${rooms} Room${rooms === 1 ? '' : 's'}`;

  const handleSearch = () => {
    const realDestination = normalizeDestination(destination);
    const params = new URLSearchParams();
    params.set('source', 'manual');
    params.set('checkInDate', formatDateValue(checkInDate));
    params.set('checkOutDate', formatDateValue(checkOutDate));
    params.set('adults', String(Math.max(1, adults)));
    params.set('rooms', String(Math.max(1, rooms)));
    if (realDestination) {
      params.set('destination', selectedLocation?.city || realDestination);
    }
    navigate(`${routes.hotelMap}?${params.toString()}`);
  };

  const hotelSearchForm = (
    <form>
      <div className="fw-medium fs-16 mb-2 text-center text-white">
        Book Hotel - Villas, Apartments &amp; more.
      </div>
      <div className="d-lg-flex">
        <div className="d-flex form-info">
          <div className="form-item booking-dropdown dropdown">
            <div
              data-bs-toggle="dropdown"
              data-bs-auto-close="outside"
              aria-expanded="false"
              role="menu"
            >
              <BookingDropdown
                label="Destination"
                defaultValue="Select"
                defaultSubValue="Choose a Tunisian city"
                locations={TUNISIA_HOTEL_LOCATIONS.map((location) => ({
                  value: location.label,
                  subValue: location.governorate,
                }))}
                value={destination || 'Select'}
                subValue={selectedLocation?.governorate || 'Choose a Tunisian city'}
                onChange={(v) => setDestination(v)}
              />
            </div>
          </div>

          <CommonDateRange
            onApply={(start, end) => {
              setCheckInDate(start);
              setCheckOutDate(end);
            }}
            fromLabel="Check In"
            toLabel="Check Out"
            initialStartDate={checkInDate}
            initialEndDate={checkOutDate}
          />

          <div className="form-item dropdown">
            <div
              data-bs-toggle="dropdown"
              data-bs-auto-close="outside"
              aria-expanded="false"
              role="menu"
            >
              <label className="form-label fs-14 text-default mb-1">
                Guests
              </label>
              <div className="home-eight-title text-dark member-count">
                {guestSummary}
              </div>
              <p className="fs-12 mb-0">
                <span className="adult">{adults}</span> Adult{adults === 1 ? '' : 's'}, <span className="room">{rooms}</span> Room{rooms === 1 ? '' : 's'}
              </p>
            </div>
            <div className="dropdown-menu dropdown-menu-end dropdown-xl">
              <div className="mb-3 home-eight-title text-dark">
                Select Travelers &amp; Class
              </div>
              <div className="mb-3 border br-10 info-item pb-1">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3 d-flex align-items-center justify-content-between">
                      <label className="form-label text-gray-9 mb-2">
                        Rooms
                      </label>
                      <BannerCounter value={rooms} setValue={setRooms} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3 d-flex align-items-center justify-content-between">
                      <label className="form-label text-gray-9 mb-2">
                        Adults
                      </label>
                      <BannerCounter value={adults} setValue={setAdults} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3 d-flex align-items-center justify-content-between">
                      <label className="form-label text-gray-9 mb-2">
                        Children
                        <span className="text-default fw-normal">( 2-12 Yrs )</span>
                      </label>
                      <BannerCounter value={children} setValue={setChildren} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3 d-flex align-items-center justify-content-between">
                      <label className="form-label text-gray-9 mb-2">
                        Infants
                        <span className="text-default fw-normal">( 0-12 Yrs )</span>
                      </label>
                      <BannerCounter value={infants} setValue={setInfants} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-3 border br-10 info-item pb-1">
                <div className="fs-16 fw-medium mb-2 text-dark">
                  Travellers
                </div>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="form-check me-3 mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="room"
                      id="hotel-room-single"
                      defaultChecked
                    />
                    <label className="form-check-label" htmlFor="hotel-room-single">
                      Single
                    </label>
                  </div>
                  <div className="form-check me-3 mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="room"
                      id="hotel-room-double"
                    />
                    <label className="form-check-label" htmlFor="hotel-room-double">
                      Double
                    </label>
                  </div>
                  <div className="form-check me-3 mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="room"
                      id="hotel-room-delux"
                    />
                    <label className="form-check-label" htmlFor="hotel-room-delux">
                      Delux
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="room"
                      id="hotel-room-suite"
                    />
                    <label className="form-check-label" htmlFor="hotel-room-suite">
                      Suite
                    </label>
                  </div>
                </div>
              </div>
              <div className="mb-3 border br-10 info-item pb-1">
                <div className="fs-16 fw-medium mb-2 text-dark">
                  Property Type
                </div>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="form-check me-3 mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="property"
                      id="hotel-property-villa"
                      defaultChecked
                    />
                    <label className="form-check-label" htmlFor="hotel-property-villa">
                      Villa
                    </label>
                  </div>
                  <div className="form-check me-3 mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="property"
                      id="hotel-property-condo"
                    />
                    <label className="form-check-label" htmlFor="hotel-property-condo">
                      Condo
                    </label>
                  </div>
                  <div className="form-check me-3 mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="property"
                      id="hotel-property-cabin"
                    />
                    <label className="form-check-label" htmlFor="hotel-property-cabin">
                      Cabin
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="property"
                      id="hotel-property-apartment"
                    />
                    <label className="form-check-label" htmlFor="hotel-property-apartment">
                      Apartments
                    </label>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <Link to="#" className="btn btn-light btn-sm me-2">
                  Cancel
                </Link>
                <button
                  type="button"
                  className="btn btn-primary btn-sm apply-btn"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <div className="form-item booking-dropdown dropdown">
            <div
              data-bs-toggle="dropdown"
              data-bs-auto-close="outside"
              aria-expanded="false"
              role="menu"
            >
              <BookingDropdown
                label="Any price"
                defaultValue={priceValue}
                defaultSubValue={priceSubValue}
                locations={priceOptions}
                value={priceValue}
                subValue={priceSubValue}
                onChange={(v) => {
                  const selected = priceOptions.find((option) => option.value === v);
                  setPriceValue(v);
                  setPriceSubValue(selected?.subValue || 'Search available hotels');
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary search-btn rounded"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
    </form>
  );

  const tabs = (
    <div className="card-header">
      <ul className="nav">
        <li>
          <Link to={routes.flightGrid} className="nav-link">
            <i className="isax isax-airplane5 me-2" />
            Flights
          </Link>
        </li>
        <li>
          <Link to={routes.hotelGrid} className="nav-link active">
            <i className="isax isax-buildings5 me-2" />
            Hotels
          </Link>
        </li>
        <li>
          <Link to={routes.carGrid} className="nav-link">
            <i className="isax isax-car5 me-2" />
            Cars
          </Link>
        </li>
        <li>
          <Link to={routes.cruiseGrid} className="nav-link">
            <i className="isax isax-ship5 me-2" />
            Cruise
          </Link>
        </li>
        <li>
          <Link to={routes.tourGrid} className="nav-link">
            <i className="isax isax-camera5 me-2" />
            Tour
          </Link>
        </li>
        <li>
          <Link to={routes.busList} className="nav-link">
            <i className="isax isax-bus5 me-2" />
            Bus
          </Link>
        </li>
        <li>
          <Link to={routes.activityGrid} className="nav-link">
            <i className="isax isax-calendar5 me-2" />
            Activity
          </Link>
        </li>
        <li>
          <Link to={routes.visaList} className="nav-link">
            <i className="isax isax-document5 me-2" />
            Visa
          </Link>
        </li>
        <li>
          <Link to={routes.guideGrid} className="nav-link">
            <i className="isax isax-user-octagon me-2" />
            Guide
          </Link>
        </li>
      </ul>
    </div>
  );

  if (!standalone) {
    return hotelSearchForm;
  }

  return (
    <div className="banner-form card mb-0 wow fadeInUp">
      {tabs}
      <div className="card-body">
        {hotelSearchForm}
      </div>
    </div>
  );
};

export default HotelSearchPanel;
