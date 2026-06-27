import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import ServiceRequestForm from '../../../core/common/service-request/ServiceRequestForm';
import { fetchVisaById } from '../../../core/services/firebaseServices';
import {
  isPublicListing,
  normalizeVisaDetails,
} from '../../../core/services/listingDetailModels';
import { all_routes } from '../../router/all_routes';

const VISA_FALLBACK_IMAGE = 'assets/img/visa/visa-details.jpg';

type VisaRecord = Record<string, any>;

const FirestoreVisaDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const visaId = searchParams.get('id');

  const [visaData, setVisaData] = useState<VisaRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(visaId));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const loadVisa = async () => {
      if (!visaId) {
        setLoading(false);
        setNotFound(false);
        setVisaData(null);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchVisaById(visaId);
        if (!active) return;

        if (data && isPublicListing(data)) {
          setVisaData(data);
          setNotFound(false);
        } else {
          setVisaData(null);
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading Firestore visa details:', error);
        if (active) {
          setVisaData(null);
          setNotFound(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadVisa();

    return () => {
      active = false;
    };
  }, [visaId]);

  if (!visaId) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        />
        <span className="fs-14 text-gray-6">Loading visa details...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="alert alert-warning mb-4">
        <p className="mb-2">
          The selected visa could not be found or is not published yet.
        </p>
        <Link to={routes.visaList} className="btn btn-primary btn-sm">
          Back to Visas
        </Link>
      </div>
    );
  }

  const visa = normalizeVisaDetails(visaData || {});
  const heroImage = visa.image || visa.mainImage || VISA_FALLBACK_IMAGE;

  return (
    <div className="card shadow-none border mb-4">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-lg-5 mb-3 mb-lg-0">
            <div className="service-img">
              <ImageWithBasePath
                src={heroImage}
                className="img-fluid rounded"
                alt={visa.title || 'Visa image'}
                fallbackSrc={VISA_FALLBACK_IMAGE}
              />
            </div>
          </div>
          <div className="col-lg-7">
            <div className="d-flex align-items-center flex-wrap mb-2">
              <h4 className="mb-0 me-2">{visa.title || 'Visa Details'}</h4>
              <span className="badge badge-xs bg-success rounded-pill">
                <i className="isax isax-ticket-star me-1" />Verified
              </span>
            </div>
            <div className="d-flex align-items-center flex-wrap mb-3">
              <p className="fs-14 mb-2 me-3 pe-3 border-end">
                <i className="isax isax-document me-2" />
                {visa.visaType || 'Visa'}
              </p>
              {(visa.country || visa.destination) && (
                <p className="fs-14 mb-2 me-3 pe-3 border-end">
                  <i className="isax isax-location5 me-2" />
                  {visa.country || visa.destination}
                </p>
              )}
              <div className="d-flex align-items-center mb-2">
                <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                  {typeof visa.rating === 'number' && visa.rating > 0
                    ? visa.rating
                    : '0.0'}
                </span>
                <p className="fs-14 mb-0">({visa.reviewsCount || 0} Reviews)</p>
              </div>
            </div>
            <h5 className="text-primary mb-3">
              {visa.price
                ? `${visa.price} ${visa.currency || 'TND'}`
                : 'Price on request'}
            </h5>
            <div className="d-flex align-items-center flex-wrap mb-3">
              {visa.processingTime && (
                <p className="fs-14 mb-2 me-3 pe-3 border-end">
                  <span className="text-muted">Processing:</span>{' '}
                  <strong>{visa.processingTime}</strong>
                </p>
              )}
              {visa.serviceFee > 0 && (
                <p className="fs-14 mb-2">
                  <span className="text-muted">Service fee:</span>{' '}
                  <strong>
                    {visa.serviceFee} {visa.currency || 'TND'}
                  </strong>
                </p>
              )}
            </div>
            {visa.description && (
              <p className="fs-14 line-ellipsis mb-3">{visa.description}</p>
            )}
            <Link to={routes.visaList} className="btn btn-light btn-sm me-2">
              Back to Visas
            </Link>
            <ServiceRequestForm
              serviceType="visa"
              serviceId={visa.id}
              serviceTitle={visa.title || visa.name || 'Visa'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirestoreVisaDetails;
