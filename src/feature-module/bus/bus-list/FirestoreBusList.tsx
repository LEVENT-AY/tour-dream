import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { fetchBuses } from '../../../core/services/firebaseServices';
import { all_routes } from '../../router/all_routes';

const BUS_FALLBACK_IMAGE = 'assets/img/bus/bus-img-01.jpg';

type BusRecord = Record<string, any>;

const FirestoreBusList = () => {
  const routes = all_routes;
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadBuses = async () => {
      try {
        const data = await fetchBuses();
        if (active) {
          setBuses(data.filter((bus) => bus.published !== false));
        }
      } catch (error) {
        console.error('Error loading Firestore buses:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadBuses();

    return () => {
      active = false;
    };
  }, []);

  const buildBusDetailsLink = (busId: string) =>
    `${routes.busDetails}?id=${busId}`;

  const getBusImage = (bus: BusRecord) =>
    bus.mainImage || bus.image || (Array.isArray(bus.gallery) ? bus.gallery[0] : '') || BUS_FALLBACK_IMAGE;

  const formatPrice = (bus: BusRecord) => {
    const price = bus.price ?? 0;
    const currency = bus.currency || 'TND';
    return price > 0 ? `${price} ${currency}` : 'Price on request';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        />
        <span className="fs-14 text-gray-6">Loading available buses...</span>
      </div>
    );
  }

  if (buses.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
        <h6 className="mb-0">Available Buses from Agents</h6>
        <span className="fs-14 text-gray-6">{buses.length} found</span>
      </div>
      <div className="bus-list">
        <div className="row justify-content-center">
          <div className="col-md-12">
            {buses.map((bus, index) => {
              const busLink = buildBusDetailsLink(bus.id);
              return (
                <div className="place-item p-4 mb-4" key={bus.id || index}>
                  <div className="place-img">
                    <Link to={busLink}>
                      <ImageWithBasePath
                        src={getBusImage(bus)}
                        className="img-fluid"
                        alt={bus.title || 'Bus image'}
                        fallbackSrc={BUS_FALLBACK_IMAGE}
                      />
                    </Link>
                  </div>
                  <div className="place-content">
                    <div className="bus-content">
                      <div className="bus-title-item">
                        <h5 className="text-truncate mb-1">
                          <Link to={busLink}>
                            {bus.title || bus.name || 'Bus'}
                          </Link>
                        </h5>
                        {bus.location && (
                          <p className="fs-14 mb-0 me-2">{bus.location}</p>
                        )}
                      </div>
                      <div className="bus-title">
                        <div className="bus-title-item">
                          <h5 className="text-truncate mb-1">
                            <Link to={busLink}>
                              {bus.departureCity || 'Departure'}
                            </Link>
                          </h5>
                          <p>{bus.departureTime || bus.departureDate || '—'}</p>
                        </div>
                        <div className="dot-line">
                          <span>
                            <small className="text-muted">Bus</small>
                          </span>
                        </div>
                        <div className="bus-title-item">
                          <h5 className="text-truncate mb-1">
                            <Link to={busLink}>
                              {bus.arrivalCity || 'Arrival'}
                            </Link>
                          </h5>
                          <p>{bus.arrivalTime || bus.arrivalDate || '—'}</p>
                        </div>
                      </div>
                      <div className="bus-title-item">
                        <h6 className="d-flex align-items-center text-gray-6 fs-14 fw-normal">
                          From
                          <span className="ms-1 fs-18 fw-semibold text-primary">
                            {formatPrice(bus)}
                          </span>
                        </h6>
                      </div>
                    </div>
                    <div className="bus-footer">
                      <div className="d-flex align-items-center justify-content-between me-2">
                        <div className="me-2">
                          <span className="badge bg-light rounded-pill">
                            {bus.seats || bus.capacity || 'Bus'}
                            {bus.seats || bus.capacity ? ' Seats' : ''}
                          </span>
                        </div>
                        <div className="bus-footer-dot">
                          <span />
                        </div>
                        <div>
                          <span>
                            <i className="isax isax-home-wifi text-gray-6 me-1" />
                          </span>
                          <span>
                            <i className="isax isax-location-tick text-gray-6 me-1" />
                          </span>
                          <span>
                            <i className="isax isax-hierarchy text-gray-6" />
                          </span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <Link
                          to={busLink}
                          className="btn btn-dark btn-md search-btn"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirestoreBusList;
