import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { GoogleMap, InfoWindow, Marker, useLoadScript } from '@react-google-maps/api';
import Slider from 'react-slick';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { formatHotelPrice } from '../../../core/common/hotelPricing';
import { matchesTunisiaHotelDestination } from '../../../core/common/data/tunisiaHotelLocations';
import { fetchHotels } from '../../../core/services/firebaseServices';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { all_routes } from '../../router/all_routes';
import HotelSearchPanel from './HotelSearchPanel';

type HotelRecord = Record<string, any>;

type PublicHotelResultsProps = {
  mode: 'map' | 'list';
};

type MarkerHotel = HotelRecord & {
  mapLat: number;
  mapLng: number;
};

const PAGE_SIZE = 12;
const DEFAULT_CENTER = { lat: 33.8869, lng: 9.5375 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const BAD_DESCRIPTION_MARKERS = [
  /Restaurants à proximité/i,
  /Restaurants a proximite/i,
  /Cafés aux alentours/i,
  /Cafes aux alentours/i,
  /Hôtels à proximité/i,
  /Hotels a proximite/i,
];
const AMENITY_PREFERENCE = [
  'pool',
  'beach',
  'spa',
  'wifi',
  'restaurant',
  'parking',
  'family',
  'room service',
  'air conditioning',
  'bar',
  'breakfast',
  'wellness',
];

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .replace(/\u0000/g, ' ')
    .replace(/[\uFFFD\u0001-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeDestination = (value: string): string => {
  const text = value.trim();
  if (!text || text.toLowerCase() === 'select') return '';
  return text;
};

const sanitizeDescription = (hotel: HotelRecord): string => {
  const candidates = [
    hotel.descriptionShort,
    hotel.description,
    hotel.details,
    hotel.rawSource?.detail?.descriptionExtended,
    hotel.rawSource?.detail?.description,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (!normalized) continue;
    const stopAt = BAD_DESCRIPTION_MARKERS
      .map((pattern) => normalized.search(pattern))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];
    const trimmed = stopAt >= 0 ? normalized.slice(0, stopAt).trim() : normalized;
    if (trimmed) return trimmed;
  }

  return 'Discover a published Tunisia hotel with source-backed rooms, amenities, and pricing.';
};

const normalizeAmenities = (hotel: HotelRecord): string[] => {
  const rawAmenities = Array.isArray(hotel.amenities)
    ? hotel.amenities
    : typeof hotel.amenities === 'string'
      ? hotel.amenities.split(',')
      : [];

  const normalized = rawAmenities
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .filter((item) => !/non disponible|not available|unavailable|indisponible/i.test(item));

  const unique = Array.from(new Set(normalized));
  return unique.sort((left, right) => {
    const leftIndex = AMENITY_PREFERENCE.findIndex((token) => left.toLowerCase().includes(token));
    const rightIndex = AMENITY_PREFERENCE.findIndex((token) => right.toLowerCase().includes(token));
    const normalizedLeft = leftIndex === -1 ? AMENITY_PREFERENCE.length : leftIndex;
    const normalizedRight = rightIndex === -1 ? AMENITY_PREFERENCE.length : rightIndex;
    return normalizedLeft - normalizedRight;
  });
};

const hasValidTunisiaCoordinates = (hotel: HotelRecord): hotel is MarkerHotel => {
  const lat = Number(hotel.lat ?? hotel.latitude);
  const lng = Number(hotel.lng ?? hotel.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 30 && lat <= 38.8 && lng >= 7 && lng <= 12.5;
};

const getMapHotel = (hotel: HotelRecord): MarkerHotel | null => {
  if (!hasValidTunisiaCoordinates(hotel)) return null;
  return {
    ...hotel,
    mapLat: Number(hotel.lat ?? hotel.latitude),
    mapLng: Number(hotel.lng ?? hotel.longitude),
  };
};

const buildHotelLocation = (hotel: HotelRecord): string => {
  const parts = [hotel.city, hotel.address, hotel.country].map((value) => normalizeText(value)).filter(Boolean);
  const unique = Array.from(new Set(parts));
  return unique.join(', ') || normalizeText(hotel.location) || 'Tunisia';
};

const PublicHotelResults = ({ mode }: PublicHotelResultsProps) => {
  const routes = all_routes;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [hotelNameQuery, setHotelNameQuery] = useState(searchParams.get('hotelName') || '');
  const [selectedItems, setSelectedItems] = useState<boolean[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const destination = searchParams.get('destination') || '';
  const checkInDate = searchParams.get('checkInDate') || '';
  const checkOutDate = searchParams.get('checkOutDate') || '';
  const adults = searchParams.get('adults') || '1';
  const rooms = searchParams.get('rooms') || '1';
  const destinationFilter = normalizeDestination(destination);

  const breadcrumbs = [
    { label: 'Hotels', link: routes.allService1, active: false },
    { label: 'Hotels', active: false },
    { label: mode === 'map' ? 'Hotel Map' : 'Hotel List', active: true },
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
      { breakpoint: 1400, settings: { slidesToShow: 1 } },
      { breakpoint: 1300, settings: { slidesToShow: 1 } },
      { breakpoint: 992, settings: { slidesToShow: 1 } },
      { breakpoint: 576, settings: { slidesToShow: 1 } },
      { breakpoint: 0, settings: { slidesToShow: 1 } },
    ],
  };

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyD6adZVdzTvBpE2yBRK8cDfsss8QXChK0I',
  });

  useEffect(() => {
    const loadHotels = async () => {
      try {
        const data = await fetchHotels();
        setHotels(data.filter((hotel) => hotel.published !== false));
      } catch (error) {
        console.error('Error loading hotels:', error);
      } finally {
        setLoadingHotels(false);
      }
    };

    loadHotels();
  }, []);

  useEffect(() => {
    setHotelNameQuery(searchParams.get('hotelName') || '');
  }, [searchParams]);

  const filteredHotels = useMemo(() => {
    const byDestination = destinationFilter
      ? hotels.filter((hotel) => matchesTunisiaHotelDestination(hotel, destinationFilter))
      : hotels;
    const query = hotelNameQuery.trim().toLowerCase();
    if (!query) return byDestination;
    return byDestination.filter((hotel) =>
      normalizeText(hotel.title || hotel.name).toLowerCase().includes(query),
    );
  }, [destinationFilter, hotelNameQuery, hotels]);

  const currentPage = Number(searchParams.get('page') || '1');
  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const visibleHotels = useMemo(
    () => filteredHotels.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredHotels, safePage],
  );

  const markerHotels = useMemo(
    () => filteredHotels.map((hotel) => getMapHotel(hotel)).filter(Boolean) as MarkerHotel[],
    [filteredHotels],
  );

  const missingCoordinateCount = filteredHotels.length - markerHotels.length;
  const selectedMarker = markerHotels.find((hotel) => hotel.id === selectedMarkerId) || markerHotels[0] || null;
  const queryString = searchParams.toString();
  const listUrl = queryString ? `${routes.hotelList}?${queryString}` : routes.hotelList;
  const mapUrl = queryString ? `${routes.hotelMap}?${queryString}` : routes.hotelMap;
  const gridParams = new URLSearchParams(queryString);
  gridParams.set('view', 'grid');
  const gridUrl = `${routes.hotelGrid}?${gridParams.toString()}`;

  useEffect(() => {
    if (selectedMarkerId && !markerHotels.some((hotel) => hotel.id === selectedMarkerId)) {
      setSelectedMarkerId(markerHotels[0]?.id || null);
    }
    if (!selectedMarkerId && markerHotels[0]?.id) {
      setSelectedMarkerId(markerHotels[0].id);
    }
  }, [markerHotels, selectedMarkerId]);

  useEffect(() => {
    if (!mapInstance) return;
    if (selectedMarker) {
      mapInstance.panTo({ lat: selectedMarker.mapLat, lng: selectedMarker.mapLng });
      return;
    }
    if (markerHotels.length === 0) {
      mapInstance.panTo(DEFAULT_CENTER);
      mapInstance.setZoom(6);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    markerHotels.forEach((hotel) => {
      bounds.extend({ lat: hotel.mapLat, lng: hotel.mapLng });
    });
    mapInstance.fitBounds(bounds, 80);
  }, [mapInstance, markerHotels, selectedMarker]);

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value == null || value === '') nextParams.delete(key);
      else nextParams.set(key, value);
    });
    const nextQuery = nextParams.toString();
    navigate(`${location.pathname}${nextQuery ? `?${nextQuery}` : ''}`);
  };

  const handleHotelNameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSearchParams({
      hotelName: hotelNameQuery.trim() || null,
      page: '1',
    });
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: String(page) });
  };

  const handleFavoriteClick = (index: number) => {
    setSelectedItems((previous) => {
      const next = [...previous];
      next[index] = !next[index];
      return next;
    });
  };

  const storeManualHotelSelection = (hotel: HotelRecord) => {
    const snapshot = {
      id: hotel.id || '',
      title: hotel.title || hotel.name || '',
      city: hotel.city || '',
      location: hotel.location || hotel.city || hotel.country || '',
      country: hotel.country || 'Tunisia',
      address: hotel.address || '',
      price: hotel.price ?? hotel.priceFrom ?? 0,
      priceFrom: hotel.priceFrom ?? hotel.price ?? 0,
      priceCurrency: hotel.priceCurrency || '',
      priceUnit: hotel.priceUnit || 'night',
      priceNote: hotel.priceNote || '',
      rating: hotel.rating ?? 0,
      image: hotel.image || hotel.gallery?.[0] || '',
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
      bookingMode: hotel.bookingMode || '',
      sourceName: hotel.sourceName || '',
      sourceUrl: hotel.sourceUrl || '',
    };
    sessionStorage.setItem('manualHotelSelection', JSON.stringify(snapshot));
  };

  const handlePrimaryAction = (hotel: HotelRecord) => {
    const priceValue = Number(hotel.priceFrom ?? hotel.price ?? 0);
    const isPayNowHotel = hotel.bookingMode === 'pay_now';
    const hasPayableAmount = isPayNowHotel && priceValue > 0 && Boolean(hotel.priceCurrency);

    if (!isPayNowHotel || !hasPayableAmount) {
      navigate(`${routes.hotelDetails}?id=${hotel.id}`);
      return;
    }

    storeManualHotelSelection(hotel);
    const params = new URLSearchParams();
    params.set('provider', 'manual');
    params.set('source', 'manual');
    if (destinationFilter) params.set('destination', destinationFilter);
    if (checkInDate) params.set('checkInDate', checkInDate);
    if (checkOutDate) params.set('checkOutDate', checkOutDate);
    params.set('adults', adults || '1');
    params.set('rooms', rooms || '1');
    params.set('hotelId', hotel.id);
    params.set('hotelName', hotel.title || hotel.name || '');
    params.set('priceFrom', String(hotel.priceFrom ?? hotel.price ?? ''));
    if (hotel.priceCurrency) params.set('priceCurrency', hotel.priceCurrency);
    if (hotel.priceUnit) params.set('priceUnit', hotel.priceUnit);
    if (hotel.bookingMode) params.set('bookingMode', hotel.bookingMode);
    params.set('paymentMode', 'manual_payment');
    if (hotel.sourceName) params.set('sourceName', hotel.sourceName);
    if (hotel.sourceUrl) params.set('sourceUrl', hotel.sourceUrl);
    navigate(`${routes.hotelRequest}?${params.toString()}`);
  };

  const buildHotelDetailsLink = (hotelId: string) => `${routes.hotelDetails}?id=${hotelId}`;

  const getHotelImages = (hotel: HotelRecord) => {
    const gallery = Array.isArray(hotel.gallery) ? hotel.gallery.filter(Boolean) : [];
    const primary = hotel.image || gallery[0];
    return gallery.length > 0 ? gallery : primary ? [primary] : [];
  };

  const renderRating = (hotel: HotelRecord) => {
    const ratingValue = Number(hotel.rating ?? 0);
    const reviewsCount = Number(hotel.reviewsCount ?? 0);
    if (!ratingValue || ratingValue <= 0) return null;
    return (
      <div className="public-hotel-rating">
        <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
          {ratingValue}
        </span>
        {reviewsCount > 0 ? <p className="fs-14 mb-0">({reviewsCount})</p> : null}
      </div>
    );
  };

  const renderCard = (hotel: HotelRecord, index: number) => {
    const hotelImages = getHotelImages(hotel);
    const hotelLink = buildHotelDetailsLink(hotel.id);
    const description = sanitizeDescription(hotel);
    const amenities = normalizeAmenities(hotel);
    const visibleAmenities = amenities.slice(0, 4);
    const extraAmenities = amenities.length - visibleAmenities.length;
    const isPayNowHotel = hotel.bookingMode === 'pay_now';
    const hasPayableAmount = isPayNowHotel && Number(hotel.priceFrom ?? hotel.price ?? 0) > 0 && Boolean(hotel.priceCurrency);
    const cardLabel = isPayNowHotel && hasPayableAmount ? 'Pay Now' : 'View Details';
    const priceInfo = formatHotelPrice(
      {
        priceFrom: hotel.priceFrom ?? hotel.price,
        priceCurrency: hotel.priceCurrency,
        priceUnit: hotel.priceUnit,
        priceNote: isPayNowHotel
          ? (hasPayableAmount
              ? 'Manual payment. Booking is confirmed after payment verification.'
              : 'Price required before payment')
          : hotel.priceNote || 'Request this hotel for final confirmation.',
      },
      { prefix: 'From', fallbackLabel: isPayNowHotel ? 'Price available soon' : 'Price on request' },
    );

    const markerHotel = getMapHotel(hotel);

    return (
      <article
        className={`place-item public-hotel-card mb-4 ${selectedMarkerId && markerHotel?.id === selectedMarkerId ? 'is-selected' : ''}`}
        key={hotel.id || index}
        data-testid="public-hotel-card"
      >
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
          <div className="fav-item" onClick={() => handleFavoriteClick(index)}>
            {hotel.featured ? (
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1"></i>
                Trending
              </span>
            ) : null}
            <Link to="#" className={`fav-icon ${selectedItems[index] ? 'selected' : ''}`} aria-label="Save hotel">
              <i className="isax isax-heart5"></i>
            </Link>
          </div>
        </div>
        <div className="place-content public-hotel-card__content">
          <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
            <div className="overflow-hidden flex-grow-1">
              <h5 className="mb-1 text-truncate">
                <Link to={hotelLink}>{hotel.title || hotel.name}</Link>
              </h5>
              <p className="d-flex align-items-center text-truncate mb-2">
                <i className="isax isax-location5 me-2"></i>
                {buildHotelLocation(hotel)}
              </p>
            </div>
            {renderRating(hotel)}
          </div>

          <p className="line-ellipsis fs-14 public-hotel-card__description">{description}</p>

          <div className="public-hotel-card__amenities">
            {visibleAmenities.map((amenity) => (
              <span className="badge rounded-pill bg-light text-dark border" key={amenity}>
                {amenity}
              </span>
            ))}
            {extraAmenities > 0 ? (
              <span className="badge rounded-pill bg-light text-dark border">+{extraAmenities}</span>
            ) : null}
          </div>

          {markerHotel ? null : (
            <div className="public-hotel-card__map-note">Map location unavailable</div>
          )}

          <div className="d-flex align-items-end justify-content-between flex-wrap border-top pt-3 mt-3 gap-3">
            <div className="text-start">
              <h5 className="text-primary text-nowrap mb-1">{priceInfo.headline}</h5>
              {priceInfo.note ? <div className="fs-12 text-muted public-hotel-card__note">{priceInfo.note}</div> : null}
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link to={hotelLink} className="btn btn-light btn-sm">
                View Details
              </Link>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handlePrimaryAction(hotel)}
              >
                {cardLabel}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const paginationItems = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <>
      <Breadcrumb
        title="Hotels"
        breadcrumbs={breadcrumbs}
        backgroundClass="breadcrumb-bg-01"
      />
      <div className="content pb-0 public-results-shell">
        <div className="container public-results-full-width">
          <HotelSearchPanel
            standalone
            initialDestination={destination}
            initialCheckInDate={checkInDate}
            initialCheckOutDate={checkOutDate}
            initialAdults={Number(adults) || 1}
            initialRooms={Number(rooms) || 1}
          />

          <section className="public-hotel-results">
            <div className="public-hotel-results__toolbar">
              <div>
                <h6 className="mb-2" data-testid="public-hotel-count-label">
                  {loadingHotels
                    ? 'Loading hotels...'
                    : `${filteredHotels.length} Hotels${destinationFilter ? ` in ${destinationFilter}` : ''}`}
                </h6>
                <div className="public-hotel-results__meta" data-testid="public-hotel-map-summary">
                  <span>{markerHotels.length} shown on map</span>
                  <span>{missingCoordinateCount} without map location</span>
                </div>
              </div>

              <div className="public-hotel-results__actions">
                <form className="public-hotel-results__search" onSubmit={handleHotelNameSubmit}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Hotel Name"
                    value={hotelNameQuery}
                    onChange={(event) => setHotelNameQuery(event.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Search
                  </button>
                </form>
                <div className="list-item d-flex align-items-center">
                  <Link to={gridUrl} className="list-icon me-2" aria-label="Grid view">
                    <i className="isax isax-grid-1"></i>
                  </Link>
                  <Link to={listUrl} className={`list-icon me-2 ${mode === 'list' ? 'active' : ''}`} aria-label="List view">
                    <i className="isax isax-firstline"></i>
                  </Link>
                  <Link to={mapUrl} className={`list-icon ${mode === 'map' ? 'active' : ''}`} aria-label="Map view">
                    <i className="isax isax-map-1"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className={`row ${mode === 'map' ? 'public-hotel-results__layout' : ''}`}>
              <div className={mode === 'map' ? 'col-xl-7' : 'col-12'}>
                {loadingHotels ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading published hotels...</p>
                  </div>
                ) : visibleHotels.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">No published hotels match the current search.</p>
                  </div>
                ) : (
                  <>
                    <div className="hotel-list">
                      {visibleHotels.map(renderCard)}
                    </div>

                    {totalPages > 1 ? (
                      <nav className="pagination-nav">
                        <ul className="pagination justify-content-center">
                          <li className={`page-item ${safePage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" type="button" onClick={() => handlePageChange(safePage - 1)}>
                              <span aria-hidden="true"><i className="fa-solid fa-chevron-left"></i></span>
                            </button>
                          </li>
                          {paginationItems.map((page) => (
                            <li className={`page-item ${page === safePage ? 'active' : ''}`} key={page}>
                              <button className="page-link" type="button" onClick={() => handlePageChange(page)}>
                                {page}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${safePage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" type="button" onClick={() => handlePageChange(safePage + 1)}>
                              <span aria-hidden="true"><i className="fa-solid fa-chevron-right"></i></span>
                            </button>
                          </li>
                        </ul>
                      </nav>
                    ) : null}
                  </>
                )}
              </div>

              {mode === 'map' ? (
                <div className="col-xl-5 map-right public-hotel-results__map-column">
                  <div className="map-listing public-hotel-results__map-shell">
                    {isLoaded ? (
                      <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={selectedMarker ? { lat: selectedMarker.mapLat, lng: selectedMarker.mapLng } : DEFAULT_CENTER}
                        zoom={6}
                        onLoad={(map) => setMapInstance(map)}
                        options={{
                          scrollwheel: false,
                          mapTypeId: 'roadmap',
                          streetViewControl: false,
                          fullscreenControl: false,
                        }}
                      >
                        {markerHotels.map((hotel) => (
                          <Marker
                            key={hotel.id}
                            position={{ lat: hotel.mapLat, lng: hotel.mapLng }}
                            onClick={() => setSelectedMarkerId(hotel.id)}
                          />
                        ))}

                        {selectedMarker ? (
                          <InfoWindow
                            position={{ lat: selectedMarker.mapLat, lng: selectedMarker.mapLng }}
                            onCloseClick={() => setSelectedMarkerId(null)}
                          >
                            <div className="public-hotel-map-popup" data-testid="public-hotel-map-popup">
                              <Link to={buildHotelDetailsLink(selectedMarker.id)} className="public-hotel-map-popup__image">
                                <ImageWithBasePath
                                  className="img-fluid w-100"
                                  alt={selectedMarker.title || 'Hotel image'}
                                  src={selectedMarker.image || getHotelImages(selectedMarker)[0]}
                                  fallbackSrc={getCategoryFallbackSrc('hotels')}
                                />
                              </Link>
                              <div className="public-hotel-map-popup__content">
                                <h6 className="mb-1">
                                  <Link to={buildHotelDetailsLink(selectedMarker.id)} tabIndex={-1}>
                                    {selectedMarker.title}
                                  </Link>
                                </h6>
                                <p className="mb-2">{buildHotelLocation(selectedMarker)}</p>
                                <div className="d-flex align-items-center justify-content-between gap-2">
                                  <span className="text-primary fw-semibold">
                                    {formatHotelPrice(
                                      {
                                        priceFrom: selectedMarker.priceFrom ?? selectedMarker.price,
                                        priceCurrency: selectedMarker.priceCurrency,
                                        priceUnit: selectedMarker.priceUnit,
                                      },
                                      { prefix: 'From', fallbackLabel: 'Price available soon', includeFinalNote: false },
                                    ).headline}
                                  </span>
                                  <div className="d-flex gap-2">
                                    <Link to={buildHotelDetailsLink(selectedMarker.id)} className="btn btn-light btn-sm">
                                      View Details
                                    </Link>
                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handlePrimaryAction(selectedMarker)}>
                                      {selectedMarker.bookingMode === 'pay_now' ? 'Pay Now' : 'Request'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </InfoWindow>
                        ) : null}
                      </GoogleMap>
                    ) : (
                      <div className="text-center py-5">Loading map...</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default PublicHotelResults;
