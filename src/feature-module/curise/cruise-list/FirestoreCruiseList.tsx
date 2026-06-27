import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { fetchCruises } from '../../../core/services/firebaseServices';
import { all_routes } from '../../router/all_routes';

type CruiseRecord = Record<string, any>;

const CRUISE_FALLBACK_IMAGE = 'assets/img/cruise/cruise-05.jpg';
const AGENT_FALLBACK_IMAGE = 'assets/img/users/user-08.jpg';

interface FirestoreCruiseListProps {
  onStatus?: (status: 'loading' | 'hasData' | 'empty') => void;
}

const FirestoreCruiseList: React.FC<FirestoreCruiseListProps> = ({ onStatus }) => {
  const routes = all_routes;
  const [cruises, setCruises] = useState<CruiseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<boolean[]>([]);

  useEffect(() => {
    let active = true;

    const loadCruises = async () => {
      try {
        if (active) onStatus?.('loading');
        const data = await fetchCruises();
        if (active) {
          const filtered = data.filter((cruise) => cruise.published !== false);
          setCruises(filtered);
          onStatus?.(filtered.length > 0 ? 'hasData' : 'empty');
        }
      } catch (error) {
        console.error('Error loading Firestore cruises:', error);
        if (active) onStatus?.('empty');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCruises();

    return () => {
      active = false;
    };
  }, []);

  const handleItemClick = (index: number) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const imgslideroption = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 2000,
    autoplay: false,
    swipe: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1400, settings: { slidesToShow: 1 } },
      { breakpoint: 1300, settings: { slidesToShow: 1 } },
      { breakpoint: 992, settings: { slidesToShow: 1 } },
      { breakpoint: 576, settings: { slidesToShow: 1 } },
      { breakpoint: 0, settings: { slidesToShow: 1 } },
    ],
  };

  const buildCruiseDetailsLink = (cruiseId: string) =>
    `${routes.cruiseDetails}?id=${cruiseId}`;

  const getCruiseImages = (cruise: CruiseRecord) => {
    const gallery = Array.isArray(cruise.gallery)
      ? cruise.gallery.filter(Boolean)
      : [];
    const primary = cruise.image || cruise.mainImage || gallery[0];
    return gallery.length > 0 ? gallery : primary ? [primary] : [];
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        />
        <span className="fs-14 text-gray-6">Loading available cruises...</span>
      </div>
    );
  }

  if (cruises.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
        <h6 className="mb-0">Available Cruises</h6>
        <span className="fs-14 text-gray-6">{cruises.length} found</span>
      </div>
      <div className="hotel-list list-full">
        <div className="row justify-content-center">
          <div className="col-md-12">
            {cruises.map((cruise, index) => {
              const cruiseImages = getCruiseImages(cruise);
              const cruiseLink = buildCruiseDetailsLink(cruise.id);

              return (
                <div className="place-item mb-4" key={cruise.id || index}>
                  <div className="place-img">
                    {cruiseImages.length > 1 ? (
                      <div className="img-slider image-slide owl-carousel nav-center">
                        <Slider {...imgslideroption}>
                          {cruiseImages.map(
                            (image: string, imageIndex: number) => (
                              <div
                                className="slide-images"
                                key={`${cruise.id || index}-${imageIndex}`}
                              >
                                <Link to={cruiseLink}>
                                  <ImageWithBasePath
                                    src={image}
                                    className="img-fluid"
                                    alt={cruise.title || 'Cruise image'}
                                    fallbackSrc={CRUISE_FALLBACK_IMAGE}
                                  />
                                </Link>
                              </div>
                            )
                          )}
                        </Slider>
                      </div>
                    ) : (
                      <Link to={cruiseLink}>
                        <ImageWithBasePath
                          src={cruiseImages[0] || CRUISE_FALLBACK_IMAGE}
                          className="img-fluid"
                          alt={cruise.title || 'Cruise image'}
                          fallbackSrc={CRUISE_FALLBACK_IMAGE}
                        />
                      </Link>
                    )}
                    <div
                      className="fav-item"
                      onClick={() => handleItemClick(index)}
                    >
                      <Link
                        to="#"
                        className={`fav-icon ${
                          selectedItems[index] ? 'selected' : ''
                        }`}
                      >
                        <i className="isax isax-heart5"></i>
                      </Link>
                      {cruise.featured && (
                        <span className="badge bg-info d-inline-flex align-items-center">
                          <i className="isax isax-ranking me-1"></i>Trending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="place-content">
                    <div className="d-flex justify-content-between align-items-center flex-wrap row-gap-2 mb-3">
                      <div>
                        <h5 className="mb-1 text-truncate">
                          <Link to={cruiseLink}>
                            {cruise.title || cruise.name || 'Cruise'}
                          </Link>
                        </h5>
                        <p className="d-flex align-items-center fs-14">
                          <i className="isax isax-location5 me-2"></i>
                          {cruise.location || 'Tunisia'}
                        </p>
                      </div>
                      <div className="d-flex align-items-center">
                        <Link
                          to="#"
                          className="d-flex align-items-center overflow-hidden border-end pe-2 me-2"
                        >
                          <span className="avatar avatar-sm flex-shrink-0 me-2">
                            <ImageWithBasePath
                              src={
                                cruise.agentPhoto ||
                                cruise.ownerPhoto ||
                                AGENT_FALLBACK_IMAGE
                              }
                              className="rounded-circle"
                              alt="img"
                              fallbackSrc={AGENT_FALLBACK_IMAGE}
                            />
                          </span>
                          <p className="fs-14 text-truncate">
                            {cruise.agentName || cruise.ownerName || 'Agent'}
                          </p>
                        </Link>
                        <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                          {cruise.rating || '0.0'}
                        </span>
                        <p className="fs-14 text-truncate">
                          ({cruise.reviewsCount || 0})
                        </p>
                      </div>
                    </div>
                    <p className="fs-14 line-ellipsis mb-3">
                      {cruise.description ||
                        'Explore this cruise listing with up-to-date pricing and details.'}
                    </p>
                    <div className="d-flex align-items-center justify-content-between cruise-list-item border-top flex-wrap row-gap-2 pt-3 mb-3">
                      {cruise.duration && (
                        <p className="fs-14 mb-0">
                          <i className="isax isax-calendar-2 text-gray-6 me-1"></i>
                          Duration:{' '}
                          <span className="text-dark fw-medium">
                            {cruise.duration}
                          </span>
                        </p>
                      )}
                      {cruise.category && (
                        <p className="fs-14 mb-0">
                          <i className="isax isax-fatrows text-gray-6 me-1"></i>
                          Type:{' '}
                          <span className="text-dark fw-medium">
                            {cruise.category}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top pt-3">
                      <h6 className="d-flex align-items-center">
                        <i className="isax isax-home-wifi ms-2 me-2"></i>
                        <i className="isax isax-scissor me-2"></i>
                        <i className="isax isax-profile-2user me-2"></i>
                        <i className="isax isax-wind-2 me-2"></i>
                      </h6>
                      <h5 className="text-primary text-nowrap me-2">
                        {cruise.price ? `${cruise.price} TND` : 'Price on request'}
                        {cruise.priceUnit && (
                          <span className="fs-14 fw-normal text-default">
                            {' '}
                            / {cruise.priceUnit}
                          </span>
                        )}
                      </h5>
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

export default FirestoreCruiseList;
