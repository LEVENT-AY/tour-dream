import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import Breadcrumb from '../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../core/services/firebaseStorage';
import { all_routes } from '../router/all_routes';
import SearchOption from '../hotel/searchOption';
import HotelFilter from '../hotel/hotelFilter';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface LodgingGridPageProps {
  listingType: 'chalet' | 'resort';
  title: string;
  route: string;
  detailsRoute: string;
  fetchListings: () => Promise<any[]>;
}

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

const LodgingGridPage = ({
  listingType,
  title,
  route,
  detailsRoute,
  fetchListings,
}: LodgingGridPageProps) => {
  const routes = all_routes;
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedItems, setSelectedItems] = useState<boolean[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadListings = async () => {
      try {
        const data = await fetchListings();
        if (isMounted) {
          setListings(data.filter((item) => item.published !== false));
        }
      } catch (error) {
        console.error(`Error loading ${listingType}s:`, error);
      } finally {
        if (isMounted) {
          setLoadingListings(false);
        }
      }
    };

    loadListings();

    return () => {
      isMounted = false;
    };
  }, [fetchListings, listingType]);

  const breadcrumbs = [
    {
      label: 'Hotel',
      link: routes.allService1,
      active: false,
    },
    {
      label: title,
      active: false,
    },
    {
      label: `${title} Grid`,
      active: true,
    },
  ];

  const handleItemClick = (index: number) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  return (
    <>
      <Breadcrumb title={title} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
      <div className="content">
        <div className="container">
          <SearchOption />
          <div className="row">
            <div className="col-xl-3 col-lg-3">
              <HotelFilter />
            </div>

            <div className="col-xl-9 col-lg-8 theiaStickySidebar">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <h6 className="mb-3">{listings.length} {title} Found on Your Search</h6>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="list-item d-flex align-items-center mb-3">
                    <Link to={route} className="list-icon active me-2"><i className="isax isax-grid-1"></i></Link>
                  </div>
                </div>
              </div>
              <div className="bg-info br-10 p-3 pb-2 mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                  <p className="fs-14 fw-medium mb-2 d-inline-flex align-items-center">
                    <i className="isax isax-info-circle me-2"></i>
                    Explore verified {listingType} listings published by approved agents.
                  </p>
                  <Link to={routes.login} className="btn btn-white btn-sm mb-2">Sign In</Link>
                </div>
              </div>
              <div className="row justify-content-center">
                {loadingListings ? (
                  <div className="text-center py-5 w-100">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading {listingType} listings from database...</p>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-5 w-100">
                    <p className="text-muted">No {listingType} listings found in database.</p>
                  </div>
                ) : (
                  listings.map((listing, index) => (
                    <div className="col-xl-4 col-md-6 d-flex" key={listing.id || index}>
                      <div className={`place-item mb-4 flex-fill ${listing.gallery && listing.gallery.length > 1 ? 'common-grid-slider' : ''}`}>
                        <div className="place-img">
                          {listing.gallery && listing.gallery.length > 1 ? (
                            <div className="img-slider image-slide owl-carousel nav-center">
                              <Slider {...imgslideroption}>
                                {listing.gallery.map((img: string, imageIndex: number) => (
                                  <div className="slide-images" key={imageIndex}>
                                    <Link to={`${detailsRoute}?id=${listing.id}`} data-testid={`${listingType}-card-link-${listing.id}`}>
                                      <ImageWithBasePath
                                        src={img}
                                        className="img-fluid"
                                        alt={listing.title || `${title} image`}
                                        fallbackSrc={getCategoryFallbackSrc(`${listingType}s` as 'chalets' | 'resorts')}
                                      />
                                    </Link>
                                  </div>
                                ))}
                              </Slider>
                            </div>
                          ) : (
                            <Link to={`${detailsRoute}?id=${listing.id}`} data-testid={`${listingType}-card-link-${listing.id}`}>
                              <ImageWithBasePath
                                src={listing.mainImage || listing.image || listing.gallery?.[0]}
                                className="img-fluid"
                                alt={listing.title || `${title} image`}
                                fallbackSrc={getCategoryFallbackSrc(`${listingType}s` as 'chalets' | 'resorts')}
                              />
                            </Link>
                          )}
                          <div className="fav-item" onClick={() => handleItemClick(index)}>
                            <span className="badge bg-info d-inline-flex align-items-center text-capitalize">
                              <i className="isax isax-ranking me-1"></i>
                              {listing.propertyType || listingType}
                            </span>
                            <Link to="#" className={`fav-icon ${selectedItems[index] ? 'selected' : ''}`}>
                              <i className="isax isax-heart5"></i>
                            </Link>
                          </div>
                        </div>
                        <div className="place-content">
                          <div className="d-flex align-items-center mb-1">
                            <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">{listing.rating ?? 0}</span>
                            <p className="fs-14">({listing.reviewsCount ?? 0} Reviews)</p>
                          </div>
                          <h5 className="mb-1 text-truncate">
                            <Link to={`${detailsRoute}?id=${listing.id}`} data-testid={`${listingType}-title-link-${listing.id}`}>
                              {listing.title || listing.name}
                            </Link>
                          </h5>
                          <p className="d-flex align-items-center mb-2">
                            <i className="isax isax-location5 me-2"></i>
                            {listing.location || 'Location unavailable'}
                          </p>
                          <div className="border-top pt-2 mb-2">
                            <h6 className="d-flex align-items-center">
                              Amenities:
                              {Array.isArray(listing.amenities) && listing.amenities.length > 0 ? (
                                <Link to="#" className="fs-14 fw-normal text-default d-inline-block ms-2">
                                  {listing.amenities.slice(0, 3).join(' • ')}
                                </Link>
                              ) : (
                                <span className="fs-14 fw-normal text-default d-inline-block ms-2">Published listing</span>
                              )}
                            </h6>
                          </div>
                          <div className="d-flex align-items-center justify-content-between border-top pt-3">
                            <h5 className="text-primary text-nowrap me-2">
                              ${listing.price ?? 0} <span className="fs-14 fw-normal text-default">/ Night</span>
                            </h5>
                            <Link to={`${detailsRoute}?id=${listing.id}`} className="btn btn-sm btn-primary">
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LodgingGridPage;
