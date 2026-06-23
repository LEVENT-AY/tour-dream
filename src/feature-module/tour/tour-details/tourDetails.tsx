import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Reviews from '../../../core/common/reviews/reviews';
import { all_routes } from '../../router/all_routes';
import { fetchTourById } from '../../../core/services/firebaseServices';
import StickyContent from './stickyContent';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { isPublicListing, normalizeTourDetails } from '../../../core/services/listingDetailModels';

const fallbackTour = {
  id: 'tour-demo',
  title: 'DreamsTour',
  name: 'DreamsTour',
  image: 'assets/img/tours/tours-16.jpg',
  gallery: [
    'assets/img/tours/gallery-tour-01.jpg',
    'assets/img/tours/gallery-tour-02.jpg',
    'assets/img/tours/gallery-tour-03.jpg',
  ],
  price: 500,
  location: 'Los Angeles',
  duration: '4 Day, 3 Night',
  category: 'Tour',
  badge: 'Demo',
  description: 'Tour details are shown here when no Firestore id is provided.',
  published: false,
};

const TourDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const tourId = searchParams.get('id');
  const [tourData, setTourData] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(tourId));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const loadTour = async () => {
      if (!tourId) {
        setLoading(false);
        setNotFound(false);
        setTourData(null);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchTourById(tourId);
        if (!active) return;

        if (data && isPublicListing(data)) {
          setTourData(data);
          setNotFound(false);
        } else {
          setTourData(null);
          setNotFound(true);
        }
      } catch (error) {
        if (active) {
          setTourData(null);
          setNotFound(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTour();

    return () => {
      active = false;
    };
  }, [tourId]);

  const displayTour: any = tourData ? normalizeTourDetails(tourData) : fallbackTour;
  const galleryImages = (displayTour.gallery?.length ? displayTour.gallery : [displayTour.image]).filter(Boolean);
  const heroImage = galleryImages[0] || getCategoryFallbackSrc('tours');
  const summaryBadges = [
    displayTour.category,
    displayTour.duration,
    displayTour.location,
  ].filter(Boolean);

  if (tourId && loading) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">Loading tour listing...</div>
        </div>
      </div>
    );
  }

  if (tourId && !loading && notFound) {
    return (
      <div className="content">
        <div className="container">
          <div className="alert alert-warning mb-0">
            The selected tour listing could not be found or is not published yet.
          </div>
          <div className="mt-3">
            <Link to={routes.tourGrid} className="btn btn-primary">
              Back to Tours
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        title={displayTour.title || displayTour.name || 'Tour Details'}
        breadcrumbs={[
          { label: 'Tour Details', link: routes.allService1, active: false },
          { label: 'Tours', active: true },
          { label: 'Tour Details', active: true },
        ]}
        backgroundClass="breadcrumb-bg-02"
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
                    alt={displayTour.title || 'Tour'}
                    fallbackSrc={getCategoryFallbackSrc('tours')}
                  />
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <div>
                      <h4 className="mb-1">{displayTour.title || displayTour.name}</h4>
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium">
                          {displayTour.rating ?? 0}
                        </span>
                        <span className="text-muted">({displayTour.reviewsCount ?? 0} Reviews)</span>
                        {summaryBadges.map((badge: string) => (
                          <span key={badge} className="badge bg-light text-dark text-capitalize">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="fs-13 fw-medium mb-1">Starts From</p>
                      <h5 className="text-primary mb-0">
                        ${displayTour.price ?? 0}{' '}
                        <span className="fs-14 text-default fw-normal">/ Person</span>
                      </h5>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Description</h5>
                <p className="mb-0">
                  {displayTour.description || 'Tour details will appear here once the selected Firestore listing provides a description.'}
                </p>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Tour Details</h5>
                <div className="row gy-3">
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 rounded border bg-white h-100">
                      <p className="text-muted fs-13 mb-1">Duration</p>
                      <h6 className="mb-0">{displayTour.duration || 'Not provided'}</h6>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 rounded border bg-white h-100">
                      <p className="text-muted fs-13 mb-1">Location</p>
                      <h6 className="mb-0">{displayTour.location || 'Not provided'}</h6>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 rounded border bg-white h-100">
                      <p className="text-muted fs-13 mb-1">Category</p>
                      <h6 className="mb-0">{displayTour.category || 'Tour'}</h6>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 rounded border bg-white h-100">
                      <p className="text-muted fs-13 mb-1">Featured</p>
                      <h6 className="mb-0">{displayTour.badge || (displayTour.featured ? 'Trending' : 'Standard')}</h6>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Gallery</h5>
                <div className="row g-3">
                  {galleryImages.map((image: string, index: number) => (
                    <div className="col-md-4" key={`${image}-${index}`}>
                      <Link to="#">
                        <ImageWithBasePath
                          src={image}
                          className="img-fluid rounded"
                          alt={`Tour ${index + 1}`}
                          fallbackSrc={getCategoryFallbackSrc('tours')}
                        />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Frequently Asked Questions</h5>
                <div className="accordion faq-accordion" id="accordionFaq">
                  <div className="accordion-item show mb-2">
                    <div className="accordion-header">
                      <button className="accordion-button fw-medium" type="button" data-bs-toggle="collapse" data-bs-target="#faq-collapseOne" aria-controls="faq-collapseOne">
                        Is this tour suitable for first-time travelers?
                      </button>
                    </div>
                    <div id="faq-collapseOne" className="accordion-collapse collapse show" data-bs-parent="#accordionFaq">
                      <div className="accordion-body">
                        <p className="mb-0">Yes. This section now stays travel-focused and avoids unrelated demo copy.</p>
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item mb-2">
                    <div className="accordion-header">
                      <button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-two" aria-controls="faq-two">
                        What happens if the listing has no dates yet?
                      </button>
                    </div>
                    <div id="faq-two" className="accordion-collapse collapse" data-bs-parent="#accordionFaq">
                      <div className="accordion-body">
                        <p className="mb-0">We show the available Firestore fields and keep the rest neutral until more listing data is added.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Reviews />
            </div>

            <div className="col-xl-4">
              <StickyContent tour={displayTour} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourDetails;
