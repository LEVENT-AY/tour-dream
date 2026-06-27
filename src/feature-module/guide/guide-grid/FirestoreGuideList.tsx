import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { fetchGuides } from '../../../core/services/firebaseServices';
import { normalizeGuideDetails } from '../../../core/services/listingDetailModels';
import { all_routes } from '../../router/all_routes';

const GUIDE_FALLBACK_IMAGE = 'assets/img/guide/guide-01.jpg';

type GuideRecord = Record<string, any>;

interface FirestoreGuideListProps {
  onStatus?: (status: 'loading' | 'hasData' | 'empty') => void;
}

const FirestoreGuideList: React.FC<FirestoreGuideListProps> = ({ onStatus }) => {
  const routes = all_routes;
  const [guides, setGuides] = useState<GuideRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadGuides = async () => {
      try {
        if (active) onStatus?.('loading');
        const data = await fetchGuides();
        if (active) {
          const processed = data
            .filter((guide) => guide.published !== false)
            .map((guide) => normalizeGuideDetails(guide));
          setGuides(processed);
          onStatus?.(processed.length > 0 ? 'hasData' : 'empty');
        }
      } catch (error) {
        console.error('Error loading Firestore guides:', error);
        if (active) onStatus?.('empty');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadGuides();

    return () => {
      active = false;
    };
  }, []);

  const getGuideImage = (guide: GuideRecord) =>
    guide.mainImage || guide.image || (Array.isArray(guide.gallery) ? guide.gallery[0] : '') || GUIDE_FALLBACK_IMAGE;

  const formatPrice = (guide: GuideRecord) => {
    const price = guide.price ?? 0;
    const currency = guide.currency || 'TND';
    return price > 0 ? `${price} ${currency}` : 'Price on request';
  };

  const formatList = (value: unknown): string => {
    if (Array.isArray(value) && value.length > 0) {
      return value.slice(0, 3).join(', ');
    }
    if (typeof value === 'string' && value.trim()) {
      return value.split(',').slice(0, 3).join(', ');
    }
    return '';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        />
        <span className="fs-14 text-gray-6">Loading available guides...</span>
      </div>
    );
  }

  if (guides.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
        <h6 className="mb-0">Local Guides</h6>
        <span className="fs-14 text-gray-6">{guides.length} found</span>
      </div>
      <div className="row">
        {guides.map((guide, index) => (
          <div className="col-md-6 col-lg-3 mb-4" key={guide.id || index}>
            <div className="card guide-card h-100">
              <div className="card-body">
                <div className="guide-img">
                  <Link to={`${routes.guideDetails}?id=${guide.id}`}>
                    <ImageWithBasePath
                      src={getGuideImage(guide)}
                      alt={guide.title || 'Guide image'}
                      className="img-fluid"
                      fallbackSrc={GUIDE_FALLBACK_IMAGE}
                    />
                  </Link>
                </div>
                <div className="mb-2">
                  <h3 className="text-truncate">
                    <Link to={`${routes.guideDetails}?id=${guide.id}`}>
                      {guide.title || guide.name || 'Guide'}
                    </Link>
                  </h3>
                  <p className="fs-14 text-gray-6 mb-1">
                    {guide.location || guide.city || guide.region || 'Location on request'}
                  </p>
                </div>
                {guide.specialties && formatList(guide.specialties) && (
                  <p className="fs-14 text-gray-9 mb-1">
                    <strong>Specialties:</strong> {formatList(guide.specialties)}
                  </p>
                )}
                {guide.languages && formatList(guide.languages) && (
                  <p className="fs-14 text-gray-9 mb-1">
                    <strong>Languages:</strong> {formatList(guide.languages)}
                  </p>
                )}
                {guide.experienceYears > 0 && (
                  <p className="fs-14 text-gray-9 mb-1">
                    <strong>Experience:</strong> {guide.experienceYears} years
                  </p>
                )}
                {guide.description && (
                  <p className="fs-14 text-gray-6 mb-2 line-clamp-2">
                    {guide.description}
                  </p>
                )}
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="d-flex align-items-center text-gray-6 fs-14 fw-normal mb-0">
                    From
                    <span className="ms-1 fs-16 fw-semibold text-primary">
                      {formatPrice(guide)}
                    </span>
                  </h6>
                  <Link
                    to={`${routes.guideDetails}?id=${guide.id}`}
                    className="btn btn-dark btn-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FirestoreGuideList;
