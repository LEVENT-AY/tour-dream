import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Reviews from '../../../core/common/reviews/reviews';
import { all_routes } from '../../router/all_routes';
import { fetchActivityById } from '../../../core/services/firebaseServices';
import ActivityStickyContent from './ActivityStickyContent';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { isPublicListing, normalizeActivityDetails } from '../../../core/services/listingDetailModels';

const fallbackActivity = {
  id: 'activity-demo',
  title: 'Tropical Reef Snorkeling Adventure',
  name: 'Tropical Reef Snorkeling Adventure',
  category: 'Water Sports',
  image: 'assets/img/activities/activity-14.jpg',
  gallery: [
    'assets/img/activities/activity-12.jpg',
    'assets/img/activities/activity-13.jpg',
    'assets/img/activities/activity-14.jpg',
    'assets/img/activities/activity-15.jpg',
    'assets/img/activities/activity-16.jpg',
  ],
  description:
    'Discover colorful coral reefs and exotic marine life in crystal clear tropical waters with a professionally guided snorkeling experience designed for comfort, safety, and fun.',
  location: 'Phuket, Thailand',
  price: 400,
  duration: '04 hours',
  rating: 5,
  reviewsCount: 400,
  published: false,
};

const ActivityDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const activityId = searchParams.get('id');
  const [activityData, setActivityData] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(activityId));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const loadActivity = async () => {
      if (!activityId) {
        setLoading(false);
        setNotFound(false);
        setActivityData(null);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchActivityById(activityId);
        if (!active) return;

        if (data && isPublicListing(data)) {
          setActivityData(data);
          setNotFound(false);
        } else {
          setActivityData(null);
          setNotFound(true);
        }
      } catch (error) {
        if (active) {
          setActivityData(null);
          setNotFound(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadActivity();

    return () => {
      active = false;
    };
  }, [activityId]);

  const displayActivity: any = activityData ? normalizeActivityDetails(activityData) : fallbackActivity;
  const galleryImages = (displayActivity.gallery?.length ? displayActivity.gallery : [displayActivity.image]).filter(Boolean);
  const heroImage = galleryImages[0] || getCategoryFallbackSrc('activities');

  if (activityId && loading) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">Loading activity listing...</div>
        </div>
      </div>
    );
  }

  if (activityId && !loading && notFound) {
    return (
      <div className="content">
        <div className="container">
          <div className="alert alert-warning mb-0">
            The selected activity listing could not be found or is not published yet.
          </div>
          <div className="mt-3">
            <Link to={routes.activityGrid} className="btn btn-primary">
              Back to Activities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const detailItems = [
    { label: 'Duration', value: displayActivity.duration || 'Not provided' },
    { label: 'Category', value: displayActivity.category || 'Activity' },
    { label: 'Location', value: displayActivity.location || 'Not provided' },
    { label: 'Price', value: `$${displayActivity.price ?? 0}` },
  ];

  return (
    <div>
      <Breadcrumb
        title={displayActivity.title || displayActivity.name || 'Activity'}
        breadcrumbs={[
          { label: 'Activity', link: routes.allService1, active: false },
          { label: 'Activity', active: true },
          { label: 'Activity Details', active: true },
        ]}
        backgroundClass="breadcrumb-bg-01"
      />

      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-8">
              <div className="card border-0 mb-4">
                <div className="card-body">
                  <ImageWithBasePath
                    src={heroImage}
                    className="img-fluid rounded mb-3"
                    alt={displayActivity.title || 'Activity'}
                    fallbackSrc={getCategoryFallbackSrc('activities')}
                  />
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <div>
                      <h4 className="mb-1">{displayActivity.title || displayActivity.name}</h4>
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium">
                          {displayActivity.rating ?? 0}
                        </span>
                        <span className="text-muted">({displayActivity.reviewsCount ?? 0} Reviews)</span>
                        {displayActivity.category ? (
                          <span className="badge bg-light text-dark">{displayActivity.category}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="fs-13 fw-medium mb-1">Starts From</p>
                      <h5 className="text-primary mb-0">
                        ${displayActivity.price ?? 0}{' '}
                        <span className="fs-14 text-default fw-normal">/ Person</span>
                      </h5>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Description</h5>
                <p className="mb-0">
                  {displayActivity.description || 'Activity details will appear here when the selected Firestore listing provides a description.'}
                </p>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Activity Details</h5>
                <div className="row gy-3">
                  {detailItems.map((item) => (
                    <div className="col-md-6 col-lg-3" key={item.label}>
                      <div className="p-3 rounded border bg-white h-100">
                        <p className="text-muted fs-13 mb-1">{item.label}</p>
                        <h6 className="mb-0">{item.value}</h6>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Gallery</h5>
                <div className="row g-3">
                  {galleryImages.map((image: string, index: number) => (
                    <div className="col-md-4" key={`${image}-${index}`}>
                      <ImageWithBasePath
                        src={image}
                        className="img-fluid rounded"
                        alt={`Activity ${index + 1}`}
                        fallbackSrc={getCategoryFallbackSrc('activities')}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Frequently Asked Questions</h5>
                <div className="accordion faq-accordion" id="accordionActivityFaq">
                  <div className="accordion-item show mb-2">
                    <div className="accordion-header">
                      <button className="accordion-button fw-medium" type="button" data-bs-toggle="collapse" data-bs-target="#activity-faq-one" aria-controls="activity-faq-one">
                        Is this activity suitable for beginners?
                      </button>
                    </div>
                    <div id="activity-faq-one" className="accordion-collapse collapse show" data-bs-parent="#accordionActivityFaq">
                      <div className="accordion-body">
                        <p className="mb-0">Yes. This page now keeps the FAQ focused on the selected activity instead of unrelated demo text.</p>
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item mb-2">
                    <div className="accordion-header">
                      <button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#activity-faq-two" aria-controls="activity-faq-two">
                        What if the listing has only a few Firestore fields?
                      </button>
                    </div>
                    <div id="activity-faq-two" className="accordion-collapse collapse" data-bs-parent="#accordionActivityFaq">
                      <div className="accordion-body">
                        <p className="mb-0">Missing fields stay neutral so the page remains truthful to the selected document.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Reviews />
            </div>

            <div className="col-xl-4">
              <ActivityStickyContent activity={displayActivity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetails;
