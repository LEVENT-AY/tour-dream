import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { fetchGuideById } from '../../../core/services/firebaseServices';
import {
  isPublicListing,
  normalizeGuideDetails,
} from '../../../core/services/listingDetailModels';
import { all_routes } from '../../router/all_routes';

const GUIDE_FALLBACK_IMAGE = 'assets/img/guide/guide-details-img-01.jpg';

type GuideRecord = Record<string, any>;

const FirestoreGuideDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const guideId = searchParams.get('id');

  const [guideData, setGuideData] = useState<GuideRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(guideId));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const loadGuide = async () => {
      if (!guideId) {
        setLoading(false);
        setNotFound(false);
        setGuideData(null);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchGuideById(guideId);
        if (!active) return;

        if (data && isPublicListing(data)) {
          setGuideData(data);
          setNotFound(false);
        } else {
          setGuideData(null);
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading Firestore guide details:', error);
        if (active) {
          setGuideData(null);
          setNotFound(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadGuide();

    return () => {
      active = false;
    };
  }, [guideId]);

  if (!guideId) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        />
        <span className="fs-14 text-gray-6">Loading guide details...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="alert alert-warning mb-4">
        <p className="mb-2">
          The selected guide could not be found or is not published yet.
        </p>
        <Link to={routes.guideGrid} className="btn btn-primary btn-sm">
          Back to Guides
        </Link>
      </div>
    );
  }

  const guide = normalizeGuideDetails(guideData || {});
  const heroImage = guide.image || guide.mainImage || GUIDE_FALLBACK_IMAGE;

  const formatList = (value: unknown): string => {
    if (Array.isArray(value) && value.length > 0) {
      return value.join(', ');
    }
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    return '';
  };

  return (
    <div className="guide-details-card-one mb-4">
      <div className="guide-details-card-one-inner">
        <div className="d-flex align-items-center guide-details-card-one-inner-content">
          <div className="guide-img">
            <ImageWithBasePath
              src={heroImage}
              alt={guide.title || 'Guide image'}
              className="img-fluid"
              fallbackSrc={GUIDE_FALLBACK_IMAGE}
            />
          </div>
          <div className="w-100">
            <div className="guide-info">
              <h2 className="guide-name">
                {guide.title || guide.name || 'Guide Details'}
              </h2>
              <div className="d-flex align-items-center flex-wrap">
                <ul className="d-flex flex-wrap align-items-center">
                  {(guide.location || guide.city || guide.country) && (
                    <li className="fs-14 text-gray-6 pe-2 me-2 border-end border-light d-flex align-items-center">
                      <i className="isax isax-location5 me-2" />
                      {guide.location || guide.city || guide.country}
                    </li>
                  )}
                  {guide.experienceYears > 0 && (
                    <li className="fs-14 text-gray-6 pe-2 me-2 border-end border-light d-flex align-items-center">
                      <i className="isax isax-personalcard me-2" />
                      {guide.experienceYears} Years Of Experience
                    </li>
                  )}
                  <li className="d-flex align-items-center">
                    <span className="badge badge-warning text-dark me-2">
                      {typeof guide.rating === 'number' && guide.rating > 0
                        ? guide.rating
                        : '0.0'}
                    </span>
                    ({guide.reviewsCount || 0} Reviews)
                  </li>
                </ul>
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 w-100">
              <div className="d-flex align-items-center flex-wrap row-gap-3">
                {guide.languages && formatList(guide.languages) &&
                  formatList(guide.languages).split(', ').map((lang) => (
                    <span
                      key={lang}
                      className="badge badge-soft-info badge-md rounded-pill text-info me-2"
                    >
                      {lang}
                    </span>
                  ))}
              </div>
              <h5 className="text-primary mb-0">
                {guide.price
                  ? `${guide.price} ${guide.currency || 'TND'}`
                  : 'Price on request'}
              </h5>
            </div>
            {guide.description && (
              <p className="fs-14 mt-3 mb-0">{guide.description}</p>
            )}
            <div className="mt-3">
              <Link to={routes.guideGrid} className="btn btn-light btn-sm me-2">
                Back to Guides
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirestoreGuideDetails;
