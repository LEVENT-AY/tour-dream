import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import ServiceRequestForm from '../../../core/common/service-request/ServiceRequestForm';
import { fetchBusById } from '../../../core/services/firebaseServices';
import {
  isPublicListing,
  normalizeBusDetails,
} from '../../../core/services/listingDetailModels';
import { all_routes } from '../../router/all_routes';

const BUS_FALLBACK_IMAGE = 'assets/img/bus/bus-img-01.jpg';

type BusRecord = Record<string, any>;

const FirestoreBusDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('id');

  const [busData, setBusData] = useState<BusRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(busId));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const loadBus = async () => {
      if (!busId) {
        setLoading(false);
        setNotFound(false);
        setBusData(null);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchBusById(busId);
        if (!active) return;

        if (data && isPublicListing(data)) {
          setBusData(data);
          setNotFound(false);
        } else {
          setBusData(null);
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading Firestore bus details:', error);
        if (active) {
          setBusData(null);
          setNotFound(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadBus();

    return () => {
      active = false;
    };
  }, [busId]);

  if (!busId) {
    return (
      <div className="alert alert-info mb-4">
        <p className="mb-2">Service link is missing. Please return to the service list and choose an option.</p>
        <Link to={routes.busList} className="btn btn-primary btn-sm">Back to Buses</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        />
        <span className="fs-14 text-gray-6">Loading bus details...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="alert alert-warning mb-4">
        <p className="mb-2">
          This bus could not be found or is no longer available. You can return to the service list and choose another option.
        </p>
        <Link to={routes.busList} className="btn btn-primary btn-sm">
          Back to Buses
        </Link>
      </div>
    );
  }

  const bus = normalizeBusDetails(busData || {});
  const heroImage = bus.image || bus.mainImage || BUS_FALLBACK_IMAGE;

  return (
    <div className="card shadow-none border mb-4">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-lg-5 mb-3 mb-lg-0">
            <div className="service-img">
              <ImageWithBasePath
                src={heroImage}
                className="img-fluid rounded"
                alt={bus.title || 'Bus image'}
                fallbackSrc={BUS_FALLBACK_IMAGE}
              />
            </div>
          </div>
          <div className="col-lg-7">
            <div className="d-flex align-items-center flex-wrap mb-2">
              <h4 className="mb-0 me-2">{bus.title || 'Bus Details'}</h4>
              <span className="badge badge-xs bg-success rounded-pill">
                <i className="isax isax-ticket-star me-1"></i>Verified
              </span>
            </div>
            <div className="d-flex align-items-center flex-wrap mb-3">
              <p className="fs-14 mb-2 me-3 pe-3 border-end">
                <i className="isax isax-bus me-2"></i>
                {bus.category || 'Bus'}
              </p>
              {bus.location && (
                <p className="fs-14 mb-2 me-3 pe-3 border-end">
                  <i className="isax isax-location5 me-2"></i>
                  {bus.location}
                </p>
              )}
              <div className="d-flex align-items-center mb-2">
                <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                  {typeof bus.rating === 'number' && bus.rating > 0
                    ? bus.rating
                    : '0.0'}
                </span>
                <p className="fs-14 mb-0">({bus.reviewsCount || 0} Reviews)</p>
              </div>
            </div>
            <h5 className="text-primary mb-3">
              {bus.price
                ? `${bus.price} ${bus.currency || 'TND'}`
                : 'Price on request'}
            </h5>
            {(bus.departureCity || bus.arrivalCity) && (
              <div className="d-flex align-items-center flex-wrap mb-3">
                {bus.departureCity && (
                  <p className="fs-14 mb-2 me-3 pe-3 border-end">
                    <span className="text-muted">From:</span>{' '}
                    <strong>{bus.departureCity}</strong>
                    {bus.departureTime && (
                      <span className="d-block text-muted fs-12">
                        {bus.departureTime}
                        {bus.departureDate ? `, ${bus.departureDate}` : ''}
                      </span>
                    )}
                  </p>
                )}
                {bus.arrivalCity && (
                  <p className="fs-14 mb-2 me-3 pe-3 border-end">
                    <span className="text-muted">To:</span>{' '}
                    <strong>{bus.arrivalCity}</strong>
                    {bus.arrivalTime && (
                      <span className="d-block text-muted fs-12">
                        {bus.arrivalTime}
                        {bus.arrivalDate ? `, ${bus.arrivalDate}` : ''}
                      </span>
                    )}
                  </p>
                )}
                {(bus.seats || bus.capacity) && (
                  <p className="fs-14 mb-2">
                    <span className="text-muted">Seats:</span>{' '}
                    <strong>{bus.seats || bus.capacity}</strong>
                  </p>
                )}
              </div>
            )}
            {bus.description && (
              <p className="fs-14 line-ellipsis mb-3">{bus.description}</p>
            )}
            <Link to={routes.busList} className="btn btn-light btn-sm me-2">
              Back to Buses
            </Link>
            <ServiceRequestForm
              serviceType="bus"
              serviceId={bus.id}
              serviceTitle={bus.title || bus.name || 'Bus'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirestoreBusDetails;
