import { useEffect, useState } from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { all_routes } from '../../router/all_routes';
import SearchOption from '../searchOption';
import HotelFilter from '../hotelFilter';
import { fetchHotels } from '../../../core/services/firebaseServices';

type HotelRecord = Record<string, any>;

const HotelList = () => {
  const routes = all_routes;
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [selectedItems, setSelectedItems] = useState<boolean[]>([]);

  useEffect(() => {
    const getHotels = async () => {
      try {
        const data = await fetchHotels();
        setHotels(data.filter((hotel) => hotel.published !== false));
      } catch (error) {
        console.error('Error loading hotels:', error);
      } finally {
        setLoadingHotels(false);
      }
    };

    getHotels();
  }, []);

  const handleItemClick = (index: number) => {
    setSelectedItems((prevSelectedItems) => {
      const updatedSelectedItems = [...prevSelectedItems];
      updatedSelectedItems[index] = !updatedSelectedItems[index];
      return updatedSelectedItems;
    });
  };

  const breadcrumbs = [
    {
      label: 'Hotel',
      link: routes.allService1,
      active: false,
    },
    {
      label: 'Hotels',
      active: false,
    },
    {
      label: 'Hotel List',
      active: true,
    },
  ];

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
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 1300,
        settings: {
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 0,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const buildHotelDetailsLink = (hotelId: string) => `${routes.hotelDetails}?id=${hotelId}`;

  const getHotelImages = (hotel: HotelRecord) => {
    const gallery = Array.isArray(hotel.gallery) ? hotel.gallery.filter(Boolean) : [];
    const primary = hotel.image || gallery[0];
    return gallery.length > 0 ? gallery : primary ? [primary] : [];
  };

  const renderHotelCard = (hotel: HotelRecord, index: number) => {
    const hotelImages = getHotelImages(hotel);
    const hotelLink = buildHotelDetailsLink(hotel.id);
    const hotelDescription =
      hotel.description ||
      hotel.details ||
      'Explore this admin-managed hotel listing with up-to-date pricing, images, and location details.';

    return (
      <div className="place-item mb-4" key={hotel.id || index}>
        <div className="place-img">
          {hotelImages.length > 1 ? (
            <div className="img-slider image-slide owl-carousel nav-center">
              <Slider {...imgslideroption}>
                {hotelImages.map((image: string, imageIndex: number) => (
                  <div className="slide-images" key={`${hotel.id || index}-${imageIndex}`}>
                    <Link to={hotelLink}>
                      <ImageWithBasePath
                        src={image}
                        className="img-fluid"
                        alt={hotel.title || 'Hotel image'}
                        fallbackSrc={getCategoryFallbackSrc('hotels')}
                      />
                    </Link>
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <Link to={hotelLink}>
              <ImageWithBasePath
                src={hotelImages[0] || hotel.image}
                className="img-fluid"
                alt={hotel.title || 'Hotel image'}
                fallbackSrc={getCategoryFallbackSrc('hotels')}
              />
            </Link>
          )}
          <div className="fav-item" onClick={() => handleItemClick(index)}>
            {hotel.badge && (
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1"></i>
                {hotel.badge}
              </span>
            )}
            <Link to="#" className={`fav-icon ${selectedItems[index] ? 'selected' : ''}`}>
              <i className="isax isax-heart5"></i>
            </Link>
          </div>
        </div>
        <div className="place-content pb-1">
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div className="overflow-hidden">
              <h5 className="mb-1 text-truncate">
                <Link to={hotelLink}>{hotel.title}</Link>
              </h5>
              <p className="d-flex align-items-center text-truncate mb-2">
                <i className="isax isax-location5 me-2"></i>
                {hotel.location}
              </p>
            </div>
            <div className="d-flex align-items-center mb-2">
              <Link to="#" className="d-flex align-items-center overflow-hidden border-end pe-2 me-2">
                <span className="avatar avatar-md flex-shrink-0 me-2">
                  <ImageWithBasePath src="assets/img/users/user-08.jpg" className="rounded-circle" alt="img" />
                </span>
                <p className="fs-14 text-truncate">Agent</p>
              </Link>
              <div className="d-flex align-items-center text-nowrap">
                <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">{hotel.rating}</span>
                <p className="fs-14">({hotel.reviewsCount || 0})</p>
              </div>
            </div>
          </div>
          <p className="line-ellipsis fs-14">{hotelDescription}</p>
          <div className="d-flex align-items-center justify-content-between flex-wrap border-top pt-3">
            <h6 className="d-flex align-items-center mb-3">
              Facillities :
              <i className="isax isax-home-wifi ms-2 me-2 text-primary"></i>
              <i className="isax isax-scissor me-2 text-primary"></i>
              <i className="isax isax-profile-2user me-2 text-primary"></i>
              <i className="isax isax-wind-2 me-2 text-primary"></i>
              <Link to="#" className="fs-14 fw-normal text-default d-inline-block">+2</Link>
            </h6>
            <h5 className="text-primary text-nowrap me-2 mb-3">
              ${hotel.price} <span className="fs-14 fw-normal text-default">/ Night</span>
            </h5>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Breadcrumb title="Hotel" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
      <div className="content">
        <div className="container">
          <SearchOption />

          <div className="row">
            <div className="col-xl-3 col-lg-3 ">
              <HotelFilter />
            </div>

            <div className="col-xl-9 col-lg-9">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <h6 className="mb-3">{loadingHotels ? 'Loading hotels...' : `${hotels.length} Hotels Found on Your Search`}</h6>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="list-item d-flex align-items-center mb-3">
                    <Link to={routes.hotelGrid} className="list-icon me-2"><i className="isax isax-grid-1"></i></Link>
                    <Link to={routes.hotelList} className="list-icon active me-2"><i className="isax isax-firstline"></i></Link>
                    <Link to={routes.hotelMap} className="list-icon me-2"><i className="isax isax-map-1"></i></Link>
                  </div>
                  <div className="dropdown mb-3">
                    <Link to="#" className="dropdown-toggle py-2" data-bs-toggle="dropdown">
                      <span className="fw-medium text-gray-9">Sort By : </span>Recommended
                    </Link>
                    <div className="dropdown-menu dropdown-sm">
                      <form>
                        <h6 className="fw-medium fs-16 mb-3">Sort By</h6>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend1" defaultChecked />
                          <label className="form-check-label ms-2" htmlFor="recommend1">Recommended</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend2" />
                          <label className="form-check-label ms-2" htmlFor="recommend2">Price: low to high</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend3" />
                          <label className="form-check-label ms-2" htmlFor="recommend3">Price: high to low</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend4" />
                          <label className="form-check-label ms-2" htmlFor="recommend4">Newest</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend5" />
                          <label className="form-check-label ms-2" htmlFor="recommend5">Ratings</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-0">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend6" />
                          <label className="form-check-label ms-2" htmlFor="recommend6">Reviews</label>
                        </div>
                        <div className="d-flex align-items-center justify-content-end border-top pt-3 mt-3">
                          <Link to="#" className="btn btn-light btn-sm me-2">Reset</Link>
                          <button type="button" className="btn btn-primary btn-sm">Apply</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-info br-10 p-3 pb-2 mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                  <p className="fs-14 fw-medium mb-2 d-inline-flex align-items-center"><i className="isax isax-info-circle me-2"></i>Save an average of 15% on thousands of hotels when you're signed in</p>
                  <Link to={routes.login} className="btn btn-white btn-sm mb-2">Sign In</Link>
                </div>
              </div>
              <div className="hotel-list">
                <div className="row justify-content-center">
                  <div className="col-md-12">
                    {loadingHotels ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading hotels from database...</p>
                      </div>
                    ) : hotels.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No hotels found in database.</p>
                      </div>
                    ) : (
                      hotels.map(renderHotelCard)
                    )}
                  </div>
                </div>
              </div>

              <nav className="pagination-nav">
                <ul className="pagination justify-content-center">
                  <li className="page-item disabled">
                    <Link className="page-link" to="#" aria-label="Previous">
                      <span aria-hidden="true"><i className="fa-solid fa-chevron-left"></i></span>
                    </Link>
                  </li>
                  <li className="page-item"><Link className="page-link" to="#">1</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">2</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">3</Link></li>
                  <li className="page-item active"><Link className="page-link" to="#">4</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">5</Link></li>
                  <li className="page-item">
                    <Link className="page-link" to="#" aria-label="Next">
                      <span aria-hidden="true"><i className="fa-solid fa-chevron-right"></i></span>
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HotelList;
