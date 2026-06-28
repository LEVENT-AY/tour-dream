import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { fetchVisas } from '../../../core/services/firebaseServices';
import { normalizeVisaDetails } from '../../../core/services/listingDetailModels';
import { all_routes } from '../../router/all_routes';

const VISA_FALLBACK_IMAGE = 'assets/img/visa/visa-01.jpg';

type VisaRecord = Record<string, any>;

interface FirestoreVisaListProps {
  onStatus?: (status: 'loading' | 'hasData' | 'empty') => void;
}

const FirestoreVisaList: React.FC<FirestoreVisaListProps> = ({ onStatus }) => {
  const routes = all_routes;
  const [visas, setVisas] = useState<VisaRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadVisas = async () => {
      try {
        if (active) onStatus?.('loading');
        const data = await fetchVisas();
        if (active) {
          const processed = data
            .filter((visa) => visa.published !== false)
            .map((visa) => normalizeVisaDetails(visa));
          setVisas(processed);
          onStatus?.(processed.length > 0 ? 'hasData' : 'empty');
        }
      } catch (error) {
        console.error('Error loading Firestore visas:', error);
        if (active) onStatus?.('empty');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadVisas();

    return () => {
      active = false;
    };
  }, []);

  const getVisaImage = (visa: VisaRecord) =>
    visa.mainImage || visa.image || (Array.isArray(visa.gallery) ? visa.gallery[0] : '') || VISA_FALLBACK_IMAGE;

  const buildVisaDetailsLink = (id: string) => `${routes.visaDetails}?id=${id}`;

  const formatPrice = (visa: VisaRecord) => {
    const price = visa.price ?? 0;
    const currency = visa.currency || 'TND';
    return price > 0 ? `${price} ${currency}` : 'Price on request';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        />
        <span className="fs-14 text-gray-6">Loading available visas...</span>
      </div>
    );
  }

  if (visas.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="fs-14 text-muted mb-0">No visa services available right now. Check back later.</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
        <h6 className="mb-0">Visa Services</h6>
        <span className="fs-14 text-gray-6">{visas.length} found</span>
      </div>
      <div className="hotel-list">
        <div className="row justify-content-center">
          <div className="col-md-12">
            {visas.map((visa, index) => {
              const visaLink = buildVisaDetailsLink(visa.id);
              return (
              <div className="place-item mb-4" key={visa.id || index}>
                <div className="place-img">
                  <div className="slide-images">
                    <Link to={visaLink}>
                      <ImageWithBasePath
                        src={getVisaImage(visa)}
                        className="img-fluid w-100"
                        alt={visa.title || 'Visa image'}
                        fallbackSrc={VISA_FALLBACK_IMAGE}
                      />
                    </Link>
                  </div>
                  <div className="fav-item">
                    <span className="badge bg-white text-dark d-inline-flex align-items-center">
                      {visa.visaType || 'Visa'}
                    </span>
                  </div>
                </div>
                <div className="place-content d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex flex-wrap align-items-center me-2">
                      <span className="me-1">
                        <i className="isax isax-clock text-gray-6" />
                      </span>
                      <p className="fs-14 text-gray-9">
                        {visa.processingTime || 'Processing time on request'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-2 text-truncate">
                      <Link to={visaLink}>
                        {visa.title || visa.name || 'Visa'}
                      </Link>
                    </h5>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      {visa.destination && (
                        <p className="d-flex align-items-center fs-14 mb-0">
                          Destination : {visa.destination}
                        </p>
                      )}
                      {visa.country && (
                        <p className="fs-14 mb-0">
                          <i className="ti ti-point-filled text-primary me-2" />
                          {visa.country}
                        </p>
                      )}
                    </div>
                    {visa.description && (
                      <p className="fs-14 text-gray-6 mb-3 line-clamp-2">
                        {visa.description}
                      </p>
                    )}
                  </div>
                  <div className="d-flex align-items-center justify-content-between border-top pt-3">
                    <div className="mb-0">
                      <h6 className="d-flex align-items-center text-gray-6 fs-14 fw-normal">
                        From
                        <span className="ms-1 fs-18 fw-semibold text-primary">
                          {formatPrice(visa)}
                        </span>
                        <span className="ms-1 fs-14 text-gray-3">
                          / Person
                        </span>
                      </h6>
                    </div>
                    <div className="d-flex align-items-center">
                      {visa.location && (
                        <p className="d-flex fs-14 align-items-center mb-0 me-3">
                          <i className="isax isax-location5 me-1" />
                          {visa.location}
                        </p>
                      )}
                      <Link
                        to={visaLink}
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

export default FirestoreVisaList;
