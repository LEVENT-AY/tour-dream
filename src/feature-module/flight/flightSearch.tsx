import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { DuffelOffer } from '../../core/services/duffelApi'
import { searchFlightOffers } from '../../core/services/duffelApi'
import ImageWithBasePath from '../../core/common/imageWithBasePath'
import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'

import BannerCounter from '../../core/common/banner-counter/counter';

import BookingDropdown from '../../core/common/booking-dropdown/bookingDropdown';

const AIRPORT_IATA: Record<string, string> = {
  "Tunis (TUN)": "TUN",
  "Sfax (SFA)": "SFA",
  "Monastir (MIR)": "MIR",
  "Djerba (DJE)": "DJE",
  "Tozeur (TOE)": "TOE",
  "Istanbul (IST)": "IST",
  "Paris (CDG)": "CDG",
  "Dubai (DXB)": "DXB",
  "London (LHR)": "LHR",
  "Frankfurt (FRA)": "FRA",
  "Rome (FCO)": "FCO",
  "Madrid (MAD)": "MAD",
  "Casablanca (CMN)": "CMN",
  "Cairo (CAI)": "CAI",
  "Doha (DOH)": "DOH",
};

const LOCATIONS = Object.entries(AIRPORT_IATA).map(([label, code]) => {
  const name = label.replace(/ \(...\)$/, '');
  return { value: label, subValue: `${code} — ${name}` };
});

type Mode = "flight";
type BookingState = {
  flight: {
    cabinClass: string;
    adults: number;
    children: number;
    infants: number;
  }
};
const FlightSearch = ({ onSearch }: { onSearch?: (active: boolean) => void }) => {
      const [flightRadio,setFlightRadio] = useState<string>('oneway')
        const [formData, setFormData] = useState<BookingState>({
          flight: {
            adults: 0,
            children: 0,
            infants: 0,
            cabinClass: "Economy",
          },
        });
        const updateField = <T extends Mode>(
          mode: T,
          field: keyof BookingState[T],
          value: React.SetStateAction<number>
        ) => {
          setFormData((prev) => ({
            ...prev,
            [mode]: {
              ...prev[mode],
              [field]:
                typeof value === "function"
                  ? value(prev[mode][field] as number)
                  : value,
            },
          }));
        };
        const [appliedData, setAppliedData] = useState(formData);

        const handleCounter = (mode: "flight") => {
          setAppliedData((prev) => ({
            ...prev,
            [mode]: formData[mode],
          }));
        };
        const flightPassengers =
          appliedData.flight.adults +
          appliedData.flight.children +
          appliedData.flight.infants;
      const totalFlightPassengers = flightPassengers === 0 ? 1 : flightPassengers;

  const [fromValue, setFromValue] = useState('Select');
  const [toValue, setToValue] = useState('Select');
  const [departurePicker, setDeparturePicker] = useState<Dayjs | null>(null);
  const [returnPicker, setReturnPicker] = useState<Dayjs | null>(null);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [duffelResults, setDuffelResults] = useState<DuffelOffer[]>([]);
  const [duffelLoading, setDuffelLoading] = useState(false);
  const [duffelError, setDuffelError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    const origin = AIRPORT_IATA[fromValue];
    const destination = AIRPORT_IATA[toValue];
    if (!origin || !destination) {
      setDuffelError('Please select both origin and destination airports');
      return;
    }
    if (!departurePicker) {
      setDuffelError('Please select a departure date');
      return;
    }
    setHasSearched(true);
    onSearch?.(true);
    setDuffelLoading(true);
    setDuffelError('');
    setDuffelResults([]);
    try {
      const result = await searchFlightOffers({
        origin,
        destination,
        departureDate: departurePicker.format('YYYY-MM-DD'),
        returnDate: returnPicker ? returnPicker.format('YYYY-MM-DD') : undefined,
        adults: totalFlightPassengers,
        cabinClass: cabinClass.toLowerCase(),
      });
      setDuffelResults(result.offers);
    } catch (err) {
      setDuffelError('Flight search is temporarily unavailable. Please try again.');
    } finally {
      setDuffelLoading(false);
    }
  };

  const handleRequestFlight = (offer: DuffelOffer) => {
    sessionStorage.setItem('duffelOffer', JSON.stringify(offer));
    navigate('/flight/flight-booking');
  };

  const formatTime = (iso: string) => {
    if (!iso) return '--';
    try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  };

  const formatPrice = (amount: string, currency: string) => {
    const symbols: Record<string, string> = { EUR: '\u20AC', USD: '$', GBP: '\u00A3', TND: 'TND' };
    return `${symbols[currency] || currency} ${amount}`;
  };

  return (
    <>
     {/* Flight Search */}
     <div className="card">
        <div className="card-body">
            <div className="banner-form">
            <form>
                              <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                                <div className="d-flex align-items-center flex-wrap">
                                  <div className="form-check d-flex align-items-center me-3 mb-2">
                                    <input
                                      className="form-check-input mt-0"
                                      type="radio"
                                      name="Radio"
                                      id="oneway"
                                      onChange={() => setFlightRadio("oneway")}
                                      checked={flightRadio === "oneway" ? true : false}
                                    />
                                    <label
                                      className="form-check-label fs-14 ms-2"
                                      htmlFor="oneway"
                                    >
                                      Oneway
                                    </label>
                                  </div>
                                  <div className="form-check d-flex align-items-center me-3 mb-2">
                                    <input
                                      className="form-check-input mt-0"
                                      type="radio"
                                      name="Radio"
                                      id="roundtrip"
                                      onChange={() => setFlightRadio("roundtrip")}
                                      checked={
                                        flightRadio === "roundtrip" ? true : false
                                      }
                                    />
                                    <label
                                      className="form-check-label fs-14 ms-2"
                                      htmlFor="roundtrip"
                                    >
                                      Round Trip
                                    </label>
                                  </div>
                                  <div className="form-check d-flex align-items-center me-3 mb-2">
                                    <input
                                      className="form-check-input mt-0"
                                      type="radio"
                                      name="Radio"
                                      id="multiway"
                                      defaultValue="multiway"
                                      onChange={() => setFlightRadio("multiway")}
                                      checked={
                                        flightRadio === "multiway" ? true : false
                                      }
                                    />
                                    <label
                                      className="form-check-label fs-14 ms-2"
                                      htmlFor="multiway"
                                    >
                                      Multi Trip
                                    </label>
                                  </div>
                                </div>
                                <h6 className="fw-medium fs-16 mb-2">
                                  Millions of cheap flights. One simple search
                                </h6>
                              </div>
                              <div
                                className="normal-trip"
                                style={{
                                  display:
                                    flightRadio === "multiway" ? "none" : "block",
                                }}
                              >
                                <div className="d-lg-flex">
                                  <div className="d-flex  form-info">
                                    <div className="form-item dropdown">
                                      <div
                                        data-bs-toggle="dropdown"
                                        data-bs-auto-close="outside"
                                        aria-expanded="false"
                                        role="menu"
                                      >
                                        <BookingDropdown
                                          label="From"
                                          defaultValue="Select"
                                          defaultSubValue="Select airport"
                                          locations={LOCATIONS}
                                          onChange={(v) => setFromValue(v)}
                                        />
                                      </div>

                                    </div>
                                    <div className="form-item dropdown ps-2 ps-sm-3">
                                      <div
                                        data-bs-toggle="dropdown"
                                        data-bs-auto-close="outside"
                                        role="menu"
                                      >
                                        <BookingDropdown
                                          label="To"
                                          defaultValue="Select"
                                          defaultSubValue="Select airport"
                                          locations={LOCATIONS}
                                          onChange={(v) => setToValue(v)}
                                        />
                                        <span className="way-icon badge badge-primary rounded-pill translate-middle">
                                          <i className="fa-solid fa-arrow-right-arrow-left" />
                                        </span>
                                      </div>
                                    </div>
                                    <div className="form-item">
                                      <label className="form-label fs-14 text-default mb-1">
                                        Departure
                                      </label>
                                      <DatePicker
                                        className="form-control datetimepicker"
                                        placeholder="dd/mm/yyyy"
                                        format="DD-MM-YYYY"
                                        value={departurePicker}
                                        onChange={(v) => setDeparturePicker(v)}
                                      />
                                      <p className="fs-12 mb-0">Monday</p>
                                    </div>
                                    <div
                                      className="form-item round-drip"
                                      style={{
                                        display:
                                          flightRadio === "roundtrip"
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      <label className="form-label fs-14 text-default mb-1">
                                        Return
                                      </label>
                                      <DatePicker
                                        className="form-control datetimepicker"
                                        placeholder="dd/mm/yyyy"
                                        format="DD-MM-YYYY"
                                        value={returnPicker}
                                        onChange={(v) => setReturnPicker(v)}
                                      />
                                      <p className="fs-12 mb-0">Wednesday</p>
                                    </div>
                                    <div className="form-item dropdown">
                                      <div
                                        data-bs-toggle="dropdown"
                                        data-bs-auto-close="outside"
                                        role="menu"
                                      >
                                        <label className="form-label fs-14 text-default mb-1">
                                          Travellers and cabin class
                                        </label>
                                        <h5>
                                          {totalFlightPassengers}{" "}
                                          <span className="fw-normal fs-14">
                                            Persons
                                          </span>
                                        </h5>
                                        <p className="fs-12 mb-0">1 Adult, Economy</p>
                                      </div>
                                      <div className="dropdown-menu dropdown-menu-end dropdown-xl">
                                        <h5 className="mb-3">
                                          Select Travelers &amp; Class
                                        </h5>
                                        <div className="mb-3 border br-10 info-item pb-1">
                                          <div className="fs-16 fw-medium mb-2 text-dark">
                                            Travellers
                                          </div>
                                          <div className="row">
                                            <div className="col-md-4">
                                              <div className="mb-3">
                                                <label className="form-label text-gray-9 mb-2">
                                                  Adults
                                                  <span className="text-default fw-normal">
                                                    ( 12+ Yrs )
                                                  </span>
                                                </label>
                                                <BannerCounter
                                                  value={formData.flight.adults}
                                                  setValue={(v) => updateField("flight", "adults", v)}
                                                />
                                              </div>
                                            </div>
                                            <div className="col-md-4">
                                              <div className="mb-3">
                                                <label className="form-label text-gray-9 mb-2">
                                                  Childrens
                                                  <span className="text-default fw-normal">
                                                    ( 2-12 Yrs )
                                                  </span>
                                                </label>
                                                <BannerCounter
                                                  value={formData.flight.children}
                                                  setValue={(v) => updateField("flight", "children", v)}
                                                />
                                              </div>
                                            </div>
                                            <div className="col-md-4">
                                              <div className="mb-3">
                                                <label className="form-label text-gray-9 mb-2">
                                                  Infants
                                                  <span className="text-default fw-normal">
                                                    ( 0-12 Yrs )
                                                  </span>
                                                </label>
                                                <BannerCounter
                                                  value={formData.flight.infants}
                                                  setValue={(v) => updateField("flight", "infants", v)}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="mb-3 border br-10 info-item pb-1">
                                          <h6 className="fs-16 fw-medium mb-2">
                                            Travellers
                                          </h6>
                                          <div className="d-flex align-items-center flex-wrap">
                                            <div className="form-check me-3 mb-3">
                                              <input
                                                className="form-check-input"
                                                type="radio"
                                                value="Economy"
                                                name="cabin-class"
                                                id="economy"
                                                checked={cabinClass === 'Economy'}
                                                onChange={(e) => setCabinClass(e.target.value)}
                                              />
                                              <label
                                                className="form-check-label"
                                                htmlFor="economy"
                                              >
                                                Economy
                                              </label>
                                            </div>
                                            <div className="form-check me-3 mb-3">
                                              <input
                                                className="form-check-input"
                                                type="radio"
                                                value="Premium Economy"
                                                name="cabin-class"
                                                id="premium-economy"
                                                checked={cabinClass === 'Premium Economy'}
                                                onChange={(e) => setCabinClass(e.target.value)}
                                              />
                                              <label
                                                className="form-check-label"
                                                htmlFor="premium-economy"
                                              >
                                                Premium Economy
                                              </label>
                                            </div>
                                            <div className="form-check me-3 mb-3">
                                              <input
                                                className="form-check-input"
                                                type="radio"
                                                value="Business"
                                                name="cabin-class"
                                                id="business"
                                                checked={cabinClass === 'Business'}
                                                onChange={(e) => setCabinClass(e.target.value)}
                                              />
                                              <label
                                                className="form-check-label"
                                                htmlFor="business"
                                              >
                                                Business
                                              </label>
                                            </div>
                                            <div className="form-check mb-3">
                                              <input
                                                className="form-check-input"
                                                type="radio"
                                                value="First Class"
                                                name="cabin-class"
                                                id="first-class"
                                                checked={cabinClass === 'First Class'}
                                                onChange={(e) => setCabinClass(e.target.value)}
                                              />
                                              <label
                                                className="form-check-label"
                                                htmlFor="first-class"
                                              >
                                                First Class
                                              </label>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="d-flex justify-content-end">
                                          <Link
                                            to="#"
                                            className="btn btn-light btn-sm me-2"
                                          >
                                            Cancel
                                          </Link>

                                          <button type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleCounter("flight")}
                                          >
                                            Apply
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <button type="button"
                                    className="btn btn-primary search-btn rounded"
                                    onClick={handleSearch}
                                    disabled={duffelLoading}
                                  >
                                    {duffelLoading ? <><span className="spinner-border spinner-border-sm me-2" />Searching...</> : 'Search'}
                                  </button>
                                </div>
                              </div>
                              <div
                                className="multi-trip"
                                style={{
                                  display:
                                    flightRadio === "multiway" ? "block" : "none",
                                }}
                              >
                                <div className="d-lg-flex">
                                  <div className="d-flex  form-info">
                                    <div className="form-item dropdown">
                                      <div
                                        data-bs-toggle="dropdown"
                                        data-bs-auto-close="outside"
                                        role="menu"
                                      >
                                        <BookingDropdown
                                          label="From"
                                          defaultValue="Select"
                                          defaultSubValue="Select airport"
                                          locations={LOCATIONS}
                                          onChange={(v) => setFromValue(v)}
                                        />
                                      </div>
                                    </div>
                                    <div className="form-item dropdown ps-2 ps-sm-3">
                                      <div
                                        data-bs-toggle="dropdown"
                                        data-bs-auto-close="outside"
                                        role="menu"
                                      >
                                        <BookingDropdown
                                          label="To"
                                          defaultValue="Select"
                                          defaultSubValue="Select airport"
                                          locations={LOCATIONS}
                                          onChange={(v) => setToValue(v)}
                                        />
                                        <span className="way-icon badge badge-primary rounded-pill translate-middle">
                                          <i className="fa-solid fa-arrow-right-arrow-left" />
                                        </span>
                                      </div>
                                    </div>
                                    <div className="form-item">
                                      <label className="form-label fs-14 text-default mb-1">
                                        Departure
                                      </label>
                                      <DatePicker
                                        className="form-control datetimepicker"
                                        placeholder="dd/mm/yyyy"
                                        format="DD-MM-YYYY"
                                        value={departurePicker}
                                        onChange={(v) => setDeparturePicker(v)}
                                      />
                                      <p className="fs-12 mb-0">Monday</p>
                                    </div>
                                  </div>
                                  <button type="button"
                                    className="btn btn-primary search-btn rounded"
                                    onClick={handleSearch}
                                    disabled={duffelLoading}
                                  >
                                    {duffelLoading ? <><span className="spinner-border spinner-border-sm me-2" />Searching...</> : 'Search'}
                                  </button>
                                </div>
                              </div>
                            </form>
            </div>
        </div>
    </div>
    {/* /Flight Search */}

    {/* Flight results */}
    <div className="mb-2">
      {hasSearched && (
        <div className="mb-3">
          <h5 className="mb-2">
            {duffelLoading ? 'Searching flights...' : duffelResults.length > 0 ? `${duffelResults.length} offer${duffelResults.length > 1 ? 's' : ''} found` : 'Flight search results'}
          </h5>
        </div>
      )}

      {duffelLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Searching for the best flight offers...</p>
        </div>
      )}

      {duffelError && (
        <div className="alert alert-danger py-2 fs-14">{duffelError}</div>
      )}

      {!duffelLoading && !duffelError && hasSearched && duffelResults.length === 0 && (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="isax isax-search-normal-1" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
          </div>
          <h5>No flight offers found</h5>
          <p className="text-muted">No flight offers found for this search. Try another route or date.</p>
        </div>
      )}

      {!duffelLoading && duffelResults.length > 0 && (
        <div className="row">
          {duffelResults.map((offer) => (
            <div key={offer.offerId} className="col-xxl-4 col-lg-6 col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="mb-1">{offer.airline} <span className="text-muted fw-normal">({offer.airlineIata})</span></h6>
                      <span className="badge bg-light text-dark fs-11">{offer.cabinClass || 'economy'}</span>
                    </div>
                    <h5 className="text-primary mb-0">{formatPrice(offer.totalAmount, offer.totalCurrency)}</h5>
                  </div>
                  {offer.slices.map((slice, i) => (
                    <div key={i} className="mb-2 pb-2 border-bottom">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-medium fs-14">{slice.origin}</span>
                        <span className="text-muted fs-14">{formatTime(slice.departureTime)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="fw-medium fs-14">{slice.destination}</span>
                        <span className="text-muted fs-14">{formatTime(slice.arrivalTime)}</span>
                      </div>
                      <div className="fs-12 text-muted mt-1">
                        {slice.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                        <span className="mx-1">&middot;</span>
                        {slice.stops === 0 ? 'Direct' : `${slice.stops} stop${slice.stops > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  ))}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="fs-12 text-muted">Expires: {formatTime(offer.expiresAt)}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleRequestFlight(offer)}>
                      Request this flight
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!duffelLoading && !hasSearched && !duffelError && (
        <>
          <div className="mb-3">
            <h5 className="mb-2">Popular airlines</h5>
          </div>
          <div className="row">
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
              <div className="d-flex align-items-center hotel-type-item mb-3">
                <Link to="#" className="avatar avatar-lg">
                  <ImageWithBasePath src="assets/img/flight/flight-company-01.svg" className="rounded-circle" alt="American Airlines" />
                </Link>
                <div className="ms-2">
                  <h6 className="fs-16 fw-medium"><Link to="#">American Airlines</Link></h6>
                  <p className="fs-14">Global carrier</p>
                </div>
              </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
              <div className="d-flex align-items-center hotel-type-item mb-3">
                <Link to="#" className="avatar avatar-lg">
                  <ImageWithBasePath src="assets/img/flight/flight-company-02.svg" className="rounded-circle" alt="Delta Airlines" />
                </Link>
                <div className="ms-2">
                  <h6 className="fs-16 fw-medium"><Link to="#">Delta Airlines</Link></h6>
                  <p className="fs-14">Global carrier</p>
                </div>
              </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
              <div className="d-flex align-items-center hotel-type-item mb-3">
                <Link to="#" className="avatar avatar-lg">
                  <ImageWithBasePath src="assets/img/flight/flight-company-03.svg" className="rounded-circle" alt="Emirates" />
                </Link>
                <div className="ms-2">
                  <h6 className="fs-16 fw-medium"><Link to="#">Emirates</Link></h6>
                  <p className="fs-14">Global carrier</p>
                </div>
              </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
              <div className="d-flex align-items-center hotel-type-item mb-3">
                <Link to="#" className="avatar avatar-lg">
                  <ImageWithBasePath src="assets/img/flight/flight-company-04.svg" className="rounded-circle" alt="Air France" />
                </Link>
                <div className="ms-2">
                  <h6 className="fs-16 fw-medium"><Link to="#">Air France</Link></h6>
                  <p className="fs-14">Global carrier</p>
                </div>
              </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
              <div className="d-flex align-items-center hotel-type-item mb-3">
                <Link to="#" className="avatar avatar-lg">
                  <ImageWithBasePath src="assets/img/flight/flight-company-05.svg" className="rounded-circle" alt="Qatar Airways" />
                </Link>
                <div className="ms-2">
                  <h6 className="fs-16 fw-medium"><Link to="#">Qatar Airways</Link></h6>
                  <p className="fs-14">Global carrier</p>
                </div>
              </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
              <div className="d-flex align-items-center hotel-type-item mb-3">
                <Link to="#" className="avatar avatar-lg">
                  <ImageWithBasePath src="assets/img/flight/flight-company-06.svg" className="rounded-circle" alt="Air India" />
                </Link>
                <div className="ms-2">
                  <h6 className="fs-16 fw-medium"><Link to="#">Air India</Link></h6>
                  <p className="fs-14">Global carrier</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    {/* /Flight results */}
    </>
  )
}

export default FlightSearch
