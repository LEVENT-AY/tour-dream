import React, { useEffect, useMemo, useState } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from '@react-google-maps/api';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import SearchOption from '../searchOption';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import HotelFilterModal from '../../../core/common/modal/hotelFilterModal';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { fetchHotels } from '../../../core/services/firebaseServices';

type HotelRecord = Record<string, any>;

type HotelMapMarker = HotelRecord & {
  lat: number;
  lng: number;
};

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 53.470692,
  lng: -2.220328,
};

const markerOffsets = [
  { lat: 0, lng: 0 },
  { lat: -0.0021, lng: 0.0042 },
  { lat: -0.0042, lng: 0.0104 },
  { lat: 0.0035, lng: -0.0063 },
  { lat: 0.0056, lng: 0.0074 },
  { lat: -0.0068, lng: -0.0041 },
];

const HotelMap: React.FC = () => {
  const routes = all_routes;
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [selectedItems, setSelectedItems] = useState<boolean[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<HotelMapMarker | null>(null);

  const handleItemClick = (index: number) => {
    setSelectedItems((prevSelectedItems) => {
      const updatedSelectedItems = [...prevSelectedItems];
      updatedSelectedItems[index] = !updatedSelectedItems[index];
      return updatedSelectedItems;
    });
  };

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

  const hotelMarkers = useMemo<HotelMapMarker[]>(
    () =>
      hotels.map((hotel, index) => {
        const fallbackOffset = markerOffsets[index % markerOffsets.length];
        return {
          ...hotel,
          lat: Number(hotel.lat ?? hotel.latitude ?? defaultCenter.lat + fallbackOffset.lat),
          lng: Number(hotel.lng ?? hotel.longitude ?? defaultCenter.lng + fallbackOffset.lng),
        };
      }),
    [hotels],
  );

  useEffect(() => {
    if (!selectedMarker && hotelMarkers.length > 0) {
      setSelectedMarker(hotelMarkers[0]);
    }
  }, [hotelMarkers, selectedMarker]);

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

  const breadcrumbs = [
    {
      label: 'Hotels',
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

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyD6adZVdzTvBpE2yBRK8cDfsss8QXChK0I',
  });

  const buildHotelDetailsLink = (hotelId: string) => `${routes.hotelDetails}?id=${hotelId}`;

  const getHotelImages = (hotel: HotelRecord) => {
    const gallery = Array.isArray(hotel.gallery) ? hotel.gallery.filter(Boolean) : [];
    const primary = hotel.image || gallery[0];
    return gallery.length > 0 ? gallery : primary ? [primary] : [];
  };

  const renderHotelCard = (hotel: HotelMapMarker, index: number) => {
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

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <>
      <Breadcrumb
        title="Hotels"
        breadcrumbs={breadcrumbs}
        backgroundClass="breadcrumb-bg-01"
      />
      <div className="content pb-0">
        <div className="map-content">
          <SearchOption />
          <div className="d-flex align-items-center justify-content-between flex-wrap recommend-wrap mb-2">
            <div className="d-flex align-items-center flex-wrap">
              <div className="dropdown mb-3">
                <Link to="#" className="dropdown-toggle btn btn-white btn-sm border rounded" data-bs-toggle="modal" data-bs-target="#filter_modal">
                  <i className="isax isax-filter-add me-1"></i> Filters
                </Link>
              </div>
              <div className="dropdown mb-3">
                <Link to="#" className="dropdown-toggle btn btn-white btn-sm border rounded" data-bs-toggle="dropdown">
                  Pricing
                </Link>
                <div className="dropdown-menu dropdown-sm">
                  <form action={routes.hotelGrid}>
                    <h6 className="fw-medium fs-16 mb-3">Pricing</h6>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="pricing1" type="checkbox" id="pricing1" defaultChecked />
                      <label className="form-check-label ms-2" htmlFor="pricing1">
                        $50 - $100
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="pricing2" type="checkbox" id="pricing2" defaultChecked />
                      <label className="form-check-label ms-2" htmlFor="pricing2">
                        $100 - $1000
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="pricing3" type="checkbox" id="pricing3" defaultChecked />
                      <label className="form-check-label ms-2" htmlFor="pricing3">
                        $1000 - $5000
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-0">
                      <input className="form-check-input ms-0 mt-0" name="pricing4" type="checkbox" id="pricing4" defaultChecked />
                      <label className="form-check-label ms-2" htmlFor="pricing4">
                        $10000 - $2000
                      </label>
                    </div>
                    <div className="d-flex align-items-center justify-content-end border-top pt-3 mt-3">
                      <Link to="#" className="btn btn-light btn-sm me-2">Reset</Link>
                      <button type="button" className="btn btn-primary btn-sm">Apply</button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="dropdown mb-3">
                <Link to="#" className="dropdown-toggle btn btn-white btn-sm border rounded" data-bs-toggle="dropdown">
                  Guest Ratings
                </Link>
                <div className="dropdown-menu dropdown-sm">
                  <form action={routes.hotelGrid}>
                    <h6 className="fw-medium fs-16 mb-3">Ratings</h6>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="review01" type="checkbox" id="review01" />
                      <label className="form-check-label ms-2" htmlFor="review01">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary"></i>
                          <span className="ms-2">5 Star</span>
                        </span>
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="review02" type="checkbox" id="review02" />
                      <label className="form-check-label ms-2" htmlFor="review02">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary"></i>
                          <span className="ms-2">4 Star</span>
                        </span>
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="review03" type="checkbox" id="review03" />
                      <label className="form-check-label ms-2" htmlFor="review03">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <span className="ms-2">3 Star</span>
                        </span>
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="review04" type="checkbox" id="review04" />
                      <label className="form-check-label ms-2" htmlFor="review04">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary me-1"></i>
                          <i className="fas fa-star filled text-primary"></i>
                          <span className="ms-2">2 Star</span>
                        </span>
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-0">
                      <input className="form-check-input ms-0 mt-0" name="review05" type="checkbox" id="review05" />
                      <label className="form-check-label ms-2" htmlFor="review05">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary"></i>
                          <span className="ms-2">1 Star</span>
                        </span>
                      </label>
                    </div>
                    <div className="d-flex align-items-center justify-content-end border-top pt-3 mt-3">
                      <Link to="#" className="btn btn-light btn-sm me-2">Reset</Link>
                      <button type="button" className="btn btn-primary btn-sm">Apply</button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="dropdown mb-3">
                <Link to="#" className="dropdown-toggle btn btn-white btn-sm border rounded" data-bs-toggle="dropdown">
                  Amenities
                </Link>
                <div className="dropdown-menu dropdown-sm">
                  <form action={routes.hotelGrid}>
                    <h6 className="fw-medium fs-16 mb-3">Amenities</h6>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities1" type="checkbox" id="amenities1" defaultChecked />
                      <label className="form-check-label ms-2" htmlFor="amenities1">Pet friendly</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities2" type="checkbox" id="amenities2" />
                      <label className="form-check-label ms-2" htmlFor="amenities2">Airport shuttle included</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities3" type="checkbox" id="amenities3" />
                      <label className="form-check-label ms-2" htmlFor="amenities3">Spa</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities4" type="checkbox" id="amenities4" />
                      <label className="form-check-label ms-2" htmlFor="amenities4">Hot tub</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities5" type="checkbox" id="amenities5" />
                      <label className="form-check-label ms-2" htmlFor="amenities5">Parking</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities6" type="checkbox" id="amenities6" />
                      <label className="form-check-label ms-2" htmlFor="amenities6">Kitchen</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities7" type="checkbox" id="amenities7" />
                      <label className="form-check-label ms-2" htmlFor="amenities7">Air conditioned</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities8" type="checkbox" id="amenities8" defaultChecked />
                      <label className="form-check-label ms-2" htmlFor="amenities8">Cribs</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities9" type="checkbox" id="amenities9" defaultChecked />
                      <label className="form-check-label ms-2" htmlFor="amenities9">Gym</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input className="form-check-input ms-0 mt-0" name="amenities10" type="checkbox" id="amenities10" defaultChecked />
                      <label className="form-check-label ms-2" htmlFor="amenities10">Wifi Included</label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-0">
                      <input className="form-check-input ms-0 mt-0" name="amenities11" type="checkbox" id="amenities11" defaultChecked />
                      <label className="form-check-label ms-2" htmlFor="amenities11">Ocean view</label>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon mb-3 me-3">
                <span className="input-icon-addon">
                  <i className="isax isax-search-normal"></i>
                </span>
                <input type="text" className="form-control" placeholder="Search by Hotel Name" />
              </div>
              <div className="list-item d-flex align-items-center mb-3">
                <Link to={routes.hotelGrid} className="list-icon me-2"><i className="isax isax-grid-1"></i></Link>
                <Link to={routes.hotelList} className="list-icon me-2"><i className="isax isax-firstline"></i></Link>
                <Link to={routes.hotelMap} className="list-icon active  me-2"><i className="isax isax-map-1"></i></Link>
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
        </div>
        <div className="row">
          <div className="col-xl-8">
            <div className="map-lists-widget border-top">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <h6 className="mb-4">{loadingHotels ? 'Loading hotels...' : `${hotelMarkers.length} Hotels Found on Your Search`}</h6>
                <div className="list-item d-flex align-items-center shadow-md bg-white rounded-3 p-2 mb-4">
                  <Link to={routes.hotelGrid} className="list-icon me-2"><i className="isax isax-grid-1"></i></Link>
                  <Link to={routes.hotelList} className="list-icon active"><i className="isax isax-firstline"></i></Link>
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
                    ) : hotelMarkers.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No hotels found in database.</p>
                      </div>
                    ) : (
                      hotelMarkers.map(renderHotelCard)
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Link to="#" className="btn btn-primary">Load More</Link>
              </div>
            </div>
          </div>
          <div className="col-xl-4 map-right grid-map">
            <div id="map" className="map-listing">
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={selectedMarker ? { lat: selectedMarker.lat, lng: selectedMarker.lng } : defaultCenter}
                zoom={14}
                options={{
                  scrollwheel: false,
                  mapTypeId: 'roadmap',
                }}
              >
                {hotelMarkers.map((hotel) => (
                  <Marker
                    key={hotel.id}
                    position={{ lat: hotel.lat, lng: hotel.lng }}
                    onClick={() => setSelectedMarker(hotel)}
                  />
                ))}

                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div>
                      <div className="card">
                        <div className="card-img">
                          <Link to={buildHotelDetailsLink(selectedMarker.id)} className="property-img">
                            <ImageWithBasePath
                              className="img-fluid w-100"
                              alt={selectedMarker.title || 'Hotel image'}
                              src={selectedMarker.image || getHotelImages(selectedMarker)[0]}
                              fallbackSrc={getCategoryFallbackSrc('hotels')}
                            />
                          </Link>
                        </div>
                        <div className="card-body">
                          <h5 className="title mb-2">
                            <Link to={buildHotelDetailsLink(selectedMarker.id)} tabIndex={-1}>
                              {selectedMarker.title}
                            </Link>
                          </h5>
                          <p className="mb-3">
                            <i className="isax isax-location"></i>{' '}
                            {selectedMarker.location}
                          </p>
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <h4 className="text-primary border-end pe-2 me-2">
                                ${selectedMarker.price}
                              </h4>
                              <p>Per night</p>
                            </div>
                            <span className="badge badge-warning text-dark">
                              {selectedMarker.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          </div>
        </div>
      </div>

      <HotelFilterModal />
    </>
  );
};

export default HotelMap;
