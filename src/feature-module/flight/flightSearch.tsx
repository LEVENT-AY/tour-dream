import  { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { DuffelOffer } from '../../core/services/duffelApi'
import { searchFlightOffers } from '../../core/services/duffelApi'
import ImageWithBasePath from '../../core/common/imageWithBasePath'
import { DatePicker } from 'antd'

import BannerCounter from '../../core/common/banner-counter/counter';
import { all_routes } from '../router/all_routes';
import BookingDropdown from '../../core/common/booking-dropdown/bookingDropdown';
type Mode = "flight";
type BookingState = {
  flight: {
    cabinClass: string;
    adults: number;
    children: number;
    infants: number;
  }
};
const FlightSearch = () => {
        const routes = all_routes
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

  const [duffelOrigin, setDuffelOrigin] = useState('TUN');
  const [duffelDest, setDuffelDest] = useState('IST');
  const [duffelDate, setDuffelDate] = useState('');
  const [duffelReturn, setDuffelReturn] = useState('');
  const [duffelAdults, setDuffelAdults] = useState(1);
  const [duffelClass, setDuffelClass] = useState('economy');
  const [duffelResults, setDuffelResults] = useState<DuffelOffer[]>([]);
  const [duffelLoading, setDuffelLoading] = useState(false);
  const [duffelError, setDuffelError] = useState('');
  const navigate = useNavigate();

  const handleDuffelSearch = async () => {
    if (!duffelOrigin || !duffelDest || !duffelDate) {
      setDuffelError('Origin, destination, and date are required');
      return;
    }
    setDuffelLoading(true);
    setDuffelError('');
    setDuffelResults([]);
    try {
      const result = await searchFlightOffers({
        origin: duffelOrigin,
        destination: duffelDest,
        departureDate: duffelDate,
        returnDate: duffelReturn || undefined,
        adults: duffelAdults,
        cabinClass: duffelClass,
      });
      setDuffelResults(result.offers);
    } catch (err) {
      setDuffelError(err instanceof Error ? err.message : 'Search failed. Is the proxy running?');
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
                                          locations={[
                                            { value: "Tunis", subValue: "Carthage International Airport" },
                                            { value: "Sfax", subValue: "Sfax Thyna International Airport" },
                                            { value: "Monastir", subValue: "Monastir Habib Bourguiba Airport" },
                                            { value: "Djerba", subValue: "Djerba Zarzis International Airport" },
                                            { value: "Tozeur", subValue: "Tozeur Nefta International Airport" }
                                          ]}
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
                                          locations={[
                                            { value: "Tunis", subValue: "Carthage International Airport" },
                                            { value: "Sfax", subValue: "Sfax Thyna International Airport" },
                                            { value: "Monastir", subValue: "Monastir Habib Bourguiba Airport" },
                                            { value: "Djerba", subValue: "Djerba Zarzis International Airport" },
                                            { value: "Tozeur", subValue: "Tozeur Nefta International Airport" }
                                          ]}
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
                                                defaultValue="Economy"
                                                name="cabin-class"
                                                id="economy"
                                                defaultChecked
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
                                                defaultValue="Economy"
                                                name="cabin-class"
                                                id="premium-economy"
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
                                                defaultValue="Business"
                                                name="cabin-class"
                                                id="business"
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
                                                defaultValue="First Class"
                                                name="cabin-class"
                                                id="first-class"
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
            
                                  <Link
                                    to={all_routes.flightGrid}
                                    className="btn btn-primary search-btn rounded"
                                  >
                                    Search
                                  </Link>
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
                                          locations={[
                                            { value: "Tunis", subValue: "Carthage International Airport" },
                                            { value: "Sfax", subValue: "Sfax Thyna International Airport" },
                                            { value: "Monastir", subValue: "Monastir Habib Bourguiba Airport" },
                                            { value: "Djerba", subValue: "Djerba Zarzis International Airport" },
                                            { value: "Tozeur", subValue: "Tozeur Nefta International Airport" }
                                          ]}
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
                                          locations={[
                                            { value: "Tunis", subValue: "Carthage International Airport" },
                                            { value: "Sfax", subValue: "Sfax Thyna International Airport" },
                                            { value: "Monastir", subValue: "Monastir Habib Bourguiba Airport" },
                                            { value: "Djerba", subValue: "Djerba Zarzis International Airport" },
                                            { value: "Tozeur", subValue: "Tozeur Nefta International Airport" }
                                          ]}
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
                                      />
                                      <p className="fs-12 mb-0">Monday</p>
                                    </div>
                                  </div>
                                  <Link
                                    to={all_routes.flightGrid}
                                    className="btn btn-primary search-btn rounded"
                                  >
                                    Search
                                  </Link>
                                </div>
                              </div>
                            </form>
            </div>
        </div>
    </div>
    {/* /Flight Search */}

    {/* Flight Types */}
    <div className="mb-2">
        <div className="mb-3">
            <h5 className="mb-2">Choose type of Flights you are interested</h5>
        </div>
        <div className="row">
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                    <Link to={routes.flightGrid} className="avatar avatar-lg">
                        <ImageWithBasePath src="assets/img/flight/flight-company-01.svg" className="rounded-circle" alt="img" />
                    </Link>
                    <div className="ms-2">
                        <h6 className="fs-16 fw-medium"><Link to={routes.flightGrid}>American Airline</Link></h6>
                        <p className="fs-14">216 Flights</p>
                    </div>
                </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                    <Link to={routes.flightGrid} className="avatar avatar-lg">
                        <ImageWithBasePath src="assets/img/flight/flight-company-02.svg" className="rounded-circle" alt="img" />
                    </Link>
                    <div className="ms-2">
                        <h6 className="fs-16 fw-medium"><Link to={routes.flightGrid}>Delta Airlines</Link></h6>
                        <p className="fs-14">569 Flights</p>
                    </div>
                </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                    <Link to={routes.flightGrid} className="avatar avatar-lg">
                        <ImageWithBasePath src="assets/img/flight/flight-company-03.svg" className="rounded-circle" alt="img" />
                    </Link>
                    <div className="ms-2">
                        <h6 className="fs-16 fw-medium"><Link to={routes.flightGrid}>Emirates</Link></h6>
                        <p className="fs-14">129 Flights</p>
                    </div>
                </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                    <Link to={routes.flightGrid} className="avatar avatar-lg">
                        <ImageWithBasePath src="assets/img/flight/flight-company-04.svg" className="rounded-circle" alt="img" />
                    </Link>
                    <div className="ms-2">
                        <h6 className="fs-16 fw-medium"><Link to={routes.flightGrid}>Air France</Link></h6>
                        <p className="fs-14">600 Flights</p>
                    </div>
                </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                    <Link to={routes.flightGrid} className="avatar avatar-lg">
                        <ImageWithBasePath src="assets/img/flight/flight-company-05.svg" className="rounded-circle" alt="img" />
                    </Link>
                    <div className="ms-2">
                        <h6 className="fs-16 fw-medium"><Link to={routes.flightGrid}>Qatar Airways</Link></h6>
                        <p className="fs-14">200 Flights</p>
                    </div>
                </div>
            </div>
            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                    <Link to={routes.flightGrid} className="avatar avatar-lg">
                        <ImageWithBasePath src="assets/img/flight/flight-company-06.svg" className="rounded-circle" alt="img" />
                    </Link>
                    <div className="ms-2">
                        <h6 className="fs-16 fw-medium"><Link to={routes.flightGrid}>Air India</Link></h6>
                        <p className="fs-14">180 Flights</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {/* /Flight Types */}

    {/* Duffel Flight Search */}
    <div className="card mt-4">
      <div className="card-header">
        <h5 className="mb-0">Search Flights via Duffel API <span className="badge bg-secondary fs-11 align-middle ms-2">POC</span></h5>
      </div>
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-md-2">
            <label className="form-label fs-14">Origin</label>
            <input className="form-control" value={duffelOrigin} onChange={e => setDuffelOrigin(e.target.value.toUpperCase())} placeholder="e.g. TUN" maxLength={3} />
          </div>
          <div className="col-md-2">
            <label className="form-label fs-14">Destination</label>
            <input className="form-control" value={duffelDest} onChange={e => setDuffelDest(e.target.value.toUpperCase())} placeholder="e.g. IST" maxLength={3} />
          </div>
          <div className="col-md-2">
            <label className="form-label fs-14">Departure</label>
            <input type="date" className="form-control" value={duffelDate} onChange={e => setDuffelDate(e.target.value)} />
          </div>
          <div className="col-md-2">
            <label className="form-label fs-14">Return (optional)</label>
            <input type="date" className="form-control" value={duffelReturn} onChange={e => setDuffelReturn(e.target.value)} />
          </div>
          <div className="col-md-1">
            <label className="form-label fs-14">Adults</label>
            <input type="number" min={1} className="form-control" value={duffelAdults} onChange={e => setDuffelAdults(Math.max(1, Number(e.target.value)))} />
          </div>
          <div className="col-md-1">
            <label className="form-label fs-14">Class</label>
            <select className="form-select" value={duffelClass} onChange={e => setDuffelClass(e.target.value)}>
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={handleDuffelSearch} disabled={duffelLoading}>
              {duffelLoading ? <><span className="spinner-border spinner-border-sm me-2" />Searching...</> : 'Search'}
            </button>
          </div>
        </div>

        {duffelError && <div className="alert alert-danger mt-3 py-2 fs-14 mb-0">{duffelError}</div>}

        {duffelResults.length > 0 && (
          <div className="mt-4">
            <h6 className="mb-3">{duffelResults.length} offer{duffelResults.length > 1 ? 's' : ''} found</h6>
            <div className="row g-3">
              {duffelResults.map((offer) => (
                <div key={offer.offerId} className="col-md-6">
                  <div className="card border h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">{offer.airline} ({offer.airlineIata})</h6>
                          <span className="badge bg-light text-dark fs-11">{offer.cabinClass || 'economy'}</span>
                        </div>
                        <h5 className="text-primary mb-0">{formatPrice(offer.totalAmount, offer.totalCurrency)}</h5>
                      </div>
                      {offer.slices.map((slice, i) => (
                        <div key={i} className="mb-2 pb-2 border-bottom">
                          <div className="d-flex justify-content-between">
                            <span className="fw-medium">{slice.origin}</span>
                            <span className="text-muted">{formatTime(slice.departureTime)}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="fw-medium">{slice.destination}</span>
                            <span className="text-muted">{formatTime(slice.arrivalTime)}</span>
                          </div>
                          <div className="fs-12 text-muted">
                            {slice.duration} &middot; {slice.stops === 0 ? 'Direct' : `${slice.stops} stop${slice.stops > 1 ? 's' : ''}`}
                          </div>
                        </div>
                      ))}
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="fs-12 text-muted">Expires: {formatTime(offer.expiresAt)}</span>
                        <button className="btn btn-sm btn-primary" onClick={() => handleRequestFlight(offer)}>
                          Request this flight
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!duffelLoading && duffelResults.length === 0 && !duffelError && (
          <p className="text-muted fs-14 mt-3 mb-0">Enter origin/destination IATA codes and a date, then click Search. Test examples: TUN &rarr; IST, TUN &rarr; CDG.</p>
        )}
      </div>
    </div>
    {/* /Duffel Flight Search */}
    </>
  )
}

export default FlightSearch
