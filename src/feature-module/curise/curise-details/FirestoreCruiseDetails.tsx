import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { fetchCruiseById } from '../../../core/services/firebaseServices';
import {
  isPublicListing,
  normalizeCruiseDetails,
} from '../../../core/services/listingDetailModels';
import { all_routes } from '../../router/all_routes';

type CruiseRecord = Record<string, any>;

const CRUISE_FALLBACK_IMAGE = 'assets/img/cruise/cruise-large-01.jpg';

const FirestoreCruiseDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const cruiseId = searchParams.get('id');

  const [cruiseData, setCruiseData] = useState<CruiseRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(cruiseId));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCruise = async () => {
      if (!cruiseId) {
        setLoading(false);
        setNotFound(false);
        setCruiseData(null);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchCruiseById(cruiseId);
        if (!active) return;

        if (data && isPublicListing(data)) {
          setCruiseData(data);
          setNotFound(false);
        } else {
          setCruiseData(null);
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading Firestore cruise details:', error);
        if (active) {
          setCruiseData(null);
          setNotFound(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCruise();

    return () => {
      active = false;
    };
  }, [cruiseId]);

  if (!cruiseId) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        />
        <span className="fs-14 text-gray-6">Loading cruise details...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="alert alert-warning mb-4">
        <p className="mb-2">
          The selected cruise could not be found or is not published yet.
        </p>
        <Link to={routes.cruiseList} className="btn btn-primary btn-sm">
          Back to Cruises
        </Link>
      </div>
    );
  }

  const cruise = normalizeCruiseDetails(cruiseData || {});
  const heroImage = cruise.image || cruise.mainImage || CRUISE_FALLBACK_IMAGE;

  return (
    <div className="card shadow-none border mb-4">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-lg-5 mb-3 mb-lg-0">
            <div className="service-img">
              <ImageWithBasePath
                src={heroImage}
                className="img-fluid rounded"
                alt={cruise.title || 'Cruise image'}
                fallbackSrc={CRUISE_FALLBACK_IMAGE}
              />
            </div>
          </div>
          <div className="col-lg-7">
            <div className="d-flex align-items-center flex-wrap mb-2">
              <h4 className="mb-0 me-2">
                {cruise.title || 'Cruise Details'}
              </h4>
              <span className="badge badge-xs bg-success rounded-pill">
                <i className="isax isax-ticket-star me-1"></i>Verified
              </span>
            </div>
            <div className="d-flex align-items-center flex-wrap mb-3">
              <p className="fs-14 mb-2 me-3 pe-3 border-end">
                <i className="isax isax-ship me-2"></i>
                {cruise.category || 'Cruise'}
              </p>
              {cruise.location && (
                <p className="fs-14 mb-2 me-3 pe-3 border-end">
                  <i className="isax isax-location5 me-2"></i>
                  {cruise.location}
                </p>
              )}
              <div className="d-flex align-items-center mb-2">
                <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                  {cruise.rating || '0.0'}
                </span>
                <p className="fs-14 mb-0">
                  ({cruise.reviewsCount || 0} Reviews)
                </p>
              </div>
            </div>
            <h5 className="text-primary mb-3">
              {cruise.price
                ? `${cruise.price} ${cruise.currency || 'TND'}`
                : 'Price on request'}
              {cruise.duration && (
                <span className="fs-14 fw-normal text-default ms-1">
                  / {cruise.duration}
                </span>
              )}
            </h5>
            {cruise.description && (
              <p className="fs-14 line-ellipsis mb-3">{cruise.description}</p>
            )}
            <Link to={routes.cruiseList} className="btn btn-light btn-sm me-2">
              Back to Cruises
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirestoreCruiseDetails;
