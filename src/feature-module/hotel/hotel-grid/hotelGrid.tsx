import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { all_routes } from '../../router/all_routes';
import SearchOption from '../searchOption';
import HotelFilter from '../hotelFilter';
import { fetchHotels } from '../../../core/services/firebaseServices';
import { searchStays, type DuffelStay } from '../../../core/services/duffelStaysApi';

type ManualHotelCard = {
  id?: string;
  title?: string;
  name?: string;
  city?: string;
  location?: string;
  country?: string;
  address?: string;
  price?: number;
  priceNote?: string;
  rating?: number;
  image?: string;
  gallery?: string[];
  amenities?: string[];
  published?: boolean;
};

const MANUAL_SELECTION_KEY = 'manualHotelSelection';

const normalizeText = (value: string): string => value.trim().toLowerCase();

const matchesDestination = (hotel: ManualHotelCard, destination: string): boolean => {
  const query = normalizeText(destination);
  if (!query) return true;
  const searchable = [
    hotel.title,
    hotel.name,
    hotel.city,
    hotel.location,
    hotel.address,
  ]
    .filter(Boolean)
    .map((value) => normalizeText(String(value)));
  if (searchable.some((value) => value.includes(query))) return true;
  if (query === 'tunisia') {
    return normalizeText(String(hotel.country || '')).includes('tunisia');
  }
  return false;
};

const HotelGrid = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState<ManualHotelCard[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [stays, setStays] = useState<DuffelStay[]>([]);
  const [loadingStays, setLoadingStays] = useState(false);
  const [staysError, setStaysError] = useState('');

  const destination = searchParams.get('destination') || '';
  const checkInDate = searchParams.get('checkInDate') || '';
  const checkOutDate = searchParams.get('checkOutDate') || '';
  const adults = searchParams.get('adults') || '1';
  const rooms = searchParams.get('rooms') || '1';
  const source = searchParams.get('source') || '';
  const hasCoordinates = !!searchParams.get('lat') && !!searchParams.get('lng');
  const manualMode = source === 'manual' || (!!destination && !!checkInDate && !!checkOutDate && !hasCoordinates);
  const duffelMode = !!destination && !!checkInDate && !!checkOutDate && hasCoordinates && !manualMode;

  useEffect(() => {
    if (duffelMode) {
      setLoadingHotels(false);
      return;
    }
    const getHotels = async () => {
      try {
        const data = await fetchHotels();
        setHotels(data.filter((h) => h.published !== false));
      } catch (error) {
        console.error('Error loading hotels:', error);
      } finally {
        setLoadingHotels(false);
      }
    };
    getHotels();
  }, [duffelMode]);

  useEffect(() => {
    if (!duffelMode) return;
    setLoadingStays(true);
    setStaysError('');
    searchStays({
      destination,
      checkInDate,
      checkOutDate,
      adults: Number(adults) || 1,
      rooms: Number(rooms) || 1,
    })
      .then((result) => {
        setStays(result.stays);
      })
      .catch((err) => {
        setStaysError(err.message || 'Stays search unavailable');
      })
      .finally(() => setLoadingStays(false));
  }, [duffelMode, destination, checkInDate, checkOutDate, adults, rooms]);

  const filteredManualHotels = useMemo(() => {
    if (!manualMode) return [];
    return hotels.filter((hotel) => matchesDestination(hotel, destination));
  }, [destination, hotels, manualMode]);

  //Breadcrumb Data
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
      label: 'Hotel Grid',
      active: true,
    },
  ];

  //ImageSlider
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

  const [selectedItems, setSelectedItems] = useState<boolean[]>([]);
  const handleItemClick = (index: number) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const storeManualHotelSelection = (hotel: ManualHotelCard) => {
    const snapshot = {
      id: hotel.id || '',
      title: hotel.title || hotel.name || '',
      city: hotel.city || '',
      location: hotel.location || hotel.city || hotel.country || '',
      country: hotel.country || 'Tunisia',
      address: hotel.address || '',
      price: hotel.price ?? 0,
      priceNote: hotel.priceNote || '',
      rating: hotel.rating ?? 0,
      image: hotel.image || hotel.gallery?.[0] || '',
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
    };
    sessionStorage.setItem(MANUAL_SELECTION_KEY, JSON.stringify(snapshot));
  };

  const openManualRequest = (hotel?: ManualHotelCard) => {
    if (hotel) {
      storeManualHotelSelection(hotel);
    } else {
      sessionStorage.removeItem(MANUAL_SELECTION_KEY);
    }
    const params = new URLSearchParams();
    params.set('provider', 'manual');
    params.set('source', 'manual');
    if (destination) params.set('destination', destination);
    if (checkInDate) params.set('checkInDate', checkInDate);
    if (checkOutDate) params.set('checkOutDate', checkOutDate);
    params.set('adults', adults || '1');
    params.set('rooms', rooms || '1');
    navigate(`/hotel/hotel-request?${params.toString()}`);
  };

  return (
    <>
      <Breadcrumb title="Hotel" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
      <div className="content">
        <div className="container">
          {!manualMode && <SearchOption />}

          <div className="row">
            {!manualMode && (
              <div className="col-xl-3 col-lg-3 ">
                {/* Sidebar */}
                <HotelFilter />
              </div>
            )}

            <div className={manualMode ? 'col-12 theiaStickySidebar' : 'col-xl-9 col-lg-8 theiaStickySidebar'}>
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <h6 className="mb-3">
                  {manualMode ? `${filteredManualHotels.length} Hotels Available` : `${hotels.length} Hotels Found on Your Search`}
                </h6>
                {!manualMode && (
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="list-item d-flex align-items-center mb-3">
                      <Link to={routes.hotelGrid} className="list-icon active me-2"><i className="isax isax-grid-1"></i></Link>
                      <Link to={routes.hotelList} className="list-icon me-2"><i className="isax isax-firstline"></i></Link>
                      <Link to={routes.hotelMap} className="list-icon me-2"><i className="isax isax-map-1"></i></Link>
                    </div>
                    <div className="dropdown mb-3">
                      <Link to="#" className="dropdown-toggle py-2" data-bs-toggle="dropdown" >
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
                )}
              </div>

              <div className="row justify-content-center">
                {duffelMode ? (
                  loadingStays ? (
                    <div className="text-center py-5 w-100">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Searching Duffel Stays...</p>
                    </div>
                  ) : staysError ? (
                    <div className="text-center py-5 w-100">
                      <p className="text-danger">Stays search unavailable. Please try again later.</p>
                    </div>
                  ) : stays.length === 0 ? (
                    <div className="text-center py-5 w-100">
                      <p className="text-muted">No stays found for "{destination}".</p>
                    </div>
                  ) : (
                    stays.map((stay, index) => (
                      <div className="col-xl-4 col-md-6 d-flex" key={stay.stayId || index}>
                        <div className="place-item mb-4 flex-fill">
                          <div className="place-img">
                            <Link to={`${routes.hotelDetails}?id=${stay.stayId}`}>
                              {stay.imageUrl ? (
                                <img src={stay.imageUrl} className="img-fluid" alt={stay.accommodationName || 'Stay image'} />
                              ) : (
                                <ImageWithBasePath src="assets/img/hotels/hotel-01.jpg" className="img-fluid" alt="Stay" />
                              )}
                            </Link>
                          </div>
                          <div className="place-content">
                            <div className="d-flex align-items-center mb-1">
                              {stay.rating && (
                                <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">{stay.rating}</span>
                              )}
                              <span className="badge bg-secondary fs-11 ms-auto">{stay.provider}</span>
                            </div>
                            <h5 className="mb-1 text-truncate">{stay.accommodationName}</h5>
                            <p className="d-flex align-items-center mb-2"><i className="isax isax-location5 me-2"></i>{[stay.address, stay.city, stay.country].filter(Boolean).join(', ') || 'Location available'}</p>
                            <div className="border-top pt-2 mb-2">
                              <span className="fs-13 text-muted">{stay.checkInDate} &rarr; {stay.checkOutDate} &middot; {stay.nights} night{stay.nights !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-between border-top pt-3">
                              <h5 className="text-primary text-nowrap me-2">{stay.cheapestRateCurrency} {stay.cheapestRateTotalAmount || 'N/A'}<span className="fs-14 fw-normal text-default"> total</span></h5>
                              <Link
                                to={`/hotel/hotel-request?stayId=${stay.stayId}&name=${encodeURIComponent(stay.accommodationName)}&city=${encodeURIComponent(stay.city || '')}&checkIn=${stay.checkInDate}&checkOut=${stay.checkOutDate}&nights=${stay.nights}&amount=${stay.cheapestRateTotalAmount}&currency=${stay.cheapestRateCurrency}&adults=${adults || 1}&rooms=${rooms || 1}`}
                                className="btn btn-primary btn-sm"
                              >
                                Request this hotel
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : loadingHotels ? (
                  <div className="text-center py-5 w-100">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading hotels from database...</p>
                  </div>
                ) : filteredManualHotels.length === 0 ? (
                  <div className="text-center py-5 w-100">
                    <p className="text-muted">No hotels are available for this destination yet. Send us a request and our team will help you.</p>
                    <button type="button" className="btn btn-primary mt-3" onClick={() => openManualRequest()}>
                      Send hotel request
                    </button>
                  </div>
                ) : (
                  filteredManualHotels.map((hotel, index) => (
                    <div className="col-xl-4 col-md-6 d-flex" key={hotel.id || index}>
                      <div className={`place-item mb-4 flex-fill ${hotel.gallery && hotel.gallery.length > 1 ? 'common-grid-slider' : ''}`}>
                        <div className="place-img">
                          {hotel.gallery && hotel.gallery.length > 1 ? (
                            <div className="img-slider image-slide owl-carousel nav-center">
                              <Slider {...imgslideroption}>
                                {hotel.gallery.map((img: string, i: number) => (
                                  <div className="slide-images" key={i}>
                                    <Link to={`${routes.hotelDetails}?id=${hotel.id}`}>
                                      <ImageWithBasePath src={img} className="img-fluid" alt={hotel.title || 'Hotel image'} fallbackSrc={getCategoryFallbackSrc('hotels')} />
                                    </Link>
                                  </div>
                                ))}
                              </Slider>
                            </div>
                          ) : (
                            <Link to={`${routes.hotelDetails}?id=${hotel.id}`}>
                              <ImageWithBasePath src={hotel.image || hotel.gallery?.[0] || 'assets/img/hotels/hotel-01.jpg'} className="img-fluid" alt={hotel.title || 'Hotel image'} fallbackSrc={getCategoryFallbackSrc('hotels')} />
                            </Link>
                          )}
                          <div className="fav-item" onClick={() => handleItemClick(index)}>
                            <Link to="#" className={`fav-icon ${selectedItems[index] ? 'selected' : ''}`}>
                              <i className="isax isax-heart5"></i>
                            </Link>
                          </div>
                        </div>
                        <div className="place-content">
                          <div className="d-flex align-items-center mb-1">
                            {hotel.rating ? <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">{hotel.rating}</span> : null}
                          </div>
                          <h5 className="mb-1 text-truncate">
                            <Link to={`${routes.hotelDetails}?id=${hotel.id}`}>{hotel.title || hotel.name}</Link>
                          </h5>
                          <p className="d-flex align-items-center mb-2">
                            <i className="isax isax-location5 me-2"></i>
                            {hotel.city || hotel.location || hotel.country || 'Tunisia'}
                          </p>
                          <div className="border-top pt-2 mb-2">
                            {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 ? (
                              <div className="d-flex flex-wrap gap-2">
                                {hotel.amenities.slice(0, 4).map((amenity) => (
                                  <span key={amenity} className="badge bg-light text-dark border">{amenity}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="fs-14 text-muted">Amenities available on request</span>
                            )}
                          </div>
                          <div className="d-flex align-items-center justify-content-between border-top pt-3">
                            <div className="me-2">
                              {hotel.price ? (
                                <h5 className="text-primary text-nowrap mb-0">${hotel.price} <span className="fs-14 fw-normal text-default">/ Night</span></h5>
                              ) : hotel.priceNote ? (
                                <h6 className="mb-0 text-primary">{hotel.priceNote}</h6>
                              ) : (
                                <h6 className="mb-0 text-primary">Contact for pricing</h6>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => openManualRequest(hotel)}
                            >
                              Request this hotel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {manualMode && filteredManualHotels.length > 0 && (
                  <div className="col-12 text-center mt-3">
                    <button type="button" className="btn btn-outline-primary" onClick={() => openManualRequest()}>
                      Send hotel request
                    </button>
                  </div>
                )}
              </div>
              {!manualMode && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HotelGrid;
