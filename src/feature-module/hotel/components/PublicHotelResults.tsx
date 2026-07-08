import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { divIcon, latLngBounds, type DivIcon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
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

type ResolvedMapHotel = HotelRecord & {
  approximateLocation: boolean;
  mapLat: number;
  mapLng: number;
  mapPlacementKey: string;
  mapPlacementLabel: string;
  markerLabel: string;
};

type MapPlacement = {
  key: string;
  label: string;
  lat: number;
  lng: number;
  aliases: string[];
};

const PAGE_SIZE = 12;
const DEFAULT_CENTER: LatLngExpression = [33.8869, 9.5375];
const DEFAULT_ZOOM = 7;
const BAD_DESCRIPTION_MARKERS = [
  /Restaurants Ã  proximitÃ©/i,
  /Restaurants a proximite/i,
  /CafÃ©s aux alentours/i,
  /Cafes aux alentours/i,
  /HÃ´tels Ã  proximitÃ©/i,
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
const AMENITY_LABEL_MAP: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /wifi.*room/i, label: 'WiFi room' },
  { pattern: /wifi.*recept/i, label: 'WiFi reception' },
  { pattern: /restaurant.*a la carte/i, label: 'À la carte' },
  { pattern: /restaurant.*buffet/i, label: 'Buffet' },
  { pattern: /climatisation/i, label: 'A/C' },
  { pattern: /wifi/i, label: 'WiFi' },
  { pattern: /pool/i, label: 'Pool' },
  { pattern: /beach/i, label: 'Beach' },
  { pattern: /parking/i, label: 'Parking' },
  { pattern: /air conditioning|clim/i, label: 'Air conditioning' },
  { pattern: /spa/i, label: 'Spa' },
  { pattern: /restaurant/i, label: 'Restaurant' },
];
const MAP_PLACEMENTS: MapPlacement[] = [
  { key: 'djerba', label: 'Djerba', lat: 33.8076, lng: 10.8451, aliases: ['djerba', 'midoun', 'houmt souk', 'medenine', 'mezzraya'] },
  { key: 'hammamet', label: 'Hammamet', lat: 36.4002, lng: 10.6167, aliases: ['hammamet', 'nabeul', 'yasmine hammamet', 'nabeul governorate'] },
  { key: 'sousse', label: 'Sousse', lat: 35.8256, lng: 10.6369, aliases: ['sousse', 'port el kantaoui', 'kantaoui', 'zone touristique sousse'] },
  { key: 'monastir', label: 'Monastir', lat: 35.7778, lng: 10.8262, aliases: ['monastir', 'skanes', 'zone touristique monastir'] },
  { key: 'mahdia', label: 'Mahdia', lat: 35.5047, lng: 11.0622, aliases: ['mahdia'] },
  { key: 'tunis', label: 'Tunis', lat: 36.8065, lng: 10.1815, aliases: ['tunis', 'gammarth', 'la marsa', 'carthage', 'les berges du lac', 'lac 1', 'lac 2'] },
  { key: 'tozeur', label: 'Tozeur', lat: 33.9197, lng: 8.1335, aliases: ['tozeur', 'nefta'] },
  { key: 'tabarka', label: 'Tabarka', lat: 36.9544, lng: 8.7580, aliases: ['tabarka', 'jendouba'] },
  { key: 'bizerte', label: 'Bizerte', lat: 37.2744, lng: 9.8739, aliases: ['bizerte'] },
  { key: 'sfax', label: 'Sfax', lat: 34.7406, lng: 10.7603, aliases: ['sfax'] },
  { key: 'kairouan', label: 'Kairouan', lat: 35.6781, lng: 10.0963, aliases: ['kairouan'] },
  { key: 'douz', label: 'Douz', lat: 33.4667, lng: 9.0167, aliases: ['douz', 'kebili'] },
  { key: 'tataouine', label: 'Tataouine', lat: 32.9297, lng: 10.4518, aliases: ['tataouine'] },
  { key: 'tunisia_center', label: 'Tunisia', lat: 34.1110, lng: 9.4140, aliases: ['tunisia'] },
];

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .replace(/\u0000/g, ' ')
    .replace(/[\uFFFD\u0001-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizePhrase = (value: unknown): string =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
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

const shortenAmenityLabel = (value: string): string => {
  const normalized = normalizeText(value);
  const customLabel = AMENITY_LABEL_MAP.find(({ pattern }) => pattern.test(normalized));
  if (customLabel) return customLabel.label;

  return normalized
    .replace(/\bgratuit\b/gi, '')
    .replace(/\bdans la chambre\b/gi, 'room')
    .replace(/\bdans la reception\b/gi, 'reception')
    .replace(/\s+/g, ' ')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .trim();
};

const hasValidTunisiaCoordinates = (hotel: HotelRecord): boolean => {
  const lat = Number(hotel.lat ?? hotel.latitude);
  const lng = Number(hotel.lng ?? hotel.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 30 && lat <= 38.8 && lng >= 7 && lng <= 12.5;
};

const buildHotelLocation = (hotel: HotelRecord): string => {
  const parts = [hotel.city, hotel.address, hotel.country].map((value) => normalizeText(value)).filter(Boolean);
  const unique = Array.from(new Set(parts));
  return unique.join(', ') || normalizeText(hotel.location) || 'Tunisia';
};

const formatApproximateLabel = (hotel: ResolvedMapHotel): string => {
  if (hotel.mapPlacementLabel) {
    return `Approx. near ${hotel.mapPlacementLabel}`;
  }
  return 'Approx. location';
};

const formatMarkerLabel = (hotel: HotelRecord): string => {
  const priceValue = Number(hotel.priceFrom ?? hotel.price ?? 0);
  const currency = normalizeText(hotel.priceCurrency || 'EUR');
  if (priceValue > 0) {
    const roundedValue = Number.isInteger(priceValue) ? String(priceValue) : priceValue.toFixed(0);
    return `${roundedValue} ${currency}`.trim();
  }
  return 'Price soon';
};

const resolveApproximatePlacement = (hotel: HotelRecord): MapPlacement => {
  const searchableValues = [
    hotel.city,
    hotel.location,
    hotel.address,
    hotel.region,
    hotel.country,
    hotel.rawSource?.detail?.location,
    hotel.rawSource?.detail?.address,
  ]
    .map((value) => normalizePhrase(value))
    .filter(Boolean);

  const exactMatch = MAP_PLACEMENTS.find((placement) =>
    placement.aliases.some((alias) => searchableValues.some((value) => value.includes(normalizePhrase(alias)))),
  );

  return exactMatch || MAP_PLACEMENTS.find((placement) => placement.key === 'tunisia_center')!;
};

const resolveMapHotel = (hotel: HotelRecord): ResolvedMapHotel => {
  if (hasValidTunisiaCoordinates(hotel)) {
    return {
      ...hotel,
      approximateLocation: false,
      mapLat: Number(hotel.lat ?? hotel.latitude),
      mapLng: Number(hotel.lng ?? hotel.longitude),
      mapPlacementKey: 'exact',
      mapPlacementLabel: buildHotelLocation(hotel),
      markerLabel: formatMarkerLabel(hotel),
    };
  }

  const placement = resolveApproximatePlacement(hotel);
  return {
    ...hotel,
    approximateLocation: true,
    mapLat: placement.lat,
    mapLng: placement.lng,
    mapPlacementKey: placement.key,
    mapPlacementLabel: placement.label,
    markerLabel: formatMarkerLabel(hotel),
  };
};

const buildPriceMarkerIcon = (hotel: ResolvedMapHotel, isSelected: boolean): DivIcon =>
  divIcon({
    className: 'public-hotel-price-marker-wrapper',
    html: `
      <div
        class="public-hotel-price-marker ${hotel.approximateLocation ? 'is-approximate' : 'is-exact'} ${isSelected ? 'is-selected' : ''}"
        data-map-marker-kind="${hotel.approximateLocation ? 'approximate' : 'exact'}"
        data-map-marker-label="${hotel.markerLabel}"
        title="${hotel.approximateLocation ? 'Approximate location' : 'Exact location'}"
        aria-label="${hotel.approximateLocation ? 'Approximate location' : 'Exact location'} ${hotel.markerLabel}"
        data-testid="public-hotel-price-marker"
      >
        <span>${hotel.markerLabel}</span>
      </div>
    `,
    iconSize: [92, 34],
    iconAnchor: [46, 17],
  });

const HotelMapViewport = ({
  hotels,
  selectedHotel,
}: {
  hotels: ResolvedMapHotel[];
  selectedHotel: ResolvedMapHotel | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!hotels.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (selectedHotel) {
      map.flyTo([selectedHotel.mapLat, selectedHotel.mapLng], selectedHotel.approximateLocation ? 10 : 12, {
        duration: 0.5,
      });
      return;
    }

    const boundsHotels = hotels.some((hotel) => hotel.mapPlacementKey !== 'tunisia_center')
      ? hotels.filter((hotel) => hotel.mapPlacementKey !== 'tunisia_center')
      : hotels;
    const bounds = latLngBounds(boundsHotels.map((hotel) => [hotel.mapLat, hotel.mapLng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
  }, [hotels, map, selectedHotel]);

  return null;
};

const PublicHotelResults = ({ mode }: PublicHotelResultsProps) => {
  const routes = all_routes;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [hotelNameQuery, setHotelNameQuery] = useState(searchParams.get('hotelName') || '');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

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
    dots: false,
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

  const mapHotels = useMemo(() => filteredHotels.map(resolveMapHotel), [filteredHotels]);
  const exactLocationCount = mapHotels.filter((hotel) => !hotel.approximateLocation).length;
  const approximateLocationCount = mapHotels.length - exactLocationCount;
  const selectedMarker = mapHotels.find((hotel) => hotel.id === selectedMarkerId) || null;

  const queryString = searchParams.toString();
  const listUrl = queryString ? `${routes.hotelList}?${queryString}` : routes.hotelList;
  const mapUrl = queryString ? `${routes.hotelMap}?${queryString}` : routes.hotelMap;
  const gridParams = new URLSearchParams(queryString);
  gridParams.set('view', 'grid');
  const gridUrl = `${routes.hotelGrid}?${gridParams.toString()}`;

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

  const handleMarkerSelect = (hotelId: string) => {
    setSelectedMarkerId(hotelId);
    const selectedIndex = filteredHotels.findIndex((hotel) => hotel.id === hotelId);
    if (selectedIndex < 0) return;
    const markerPage = Math.floor(selectedIndex / PAGE_SIZE) + 1;
    if (markerPage !== safePage) {
      updateSearchParams({ page: String(markerPage) });
    }
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

    const mapHotel = mapHotels.find((candidate) => candidate.id === hotel.id) || null;
    const compactAmenities = Array.from(new Set(visibleAmenities.map(shortenAmenityLabel).filter(Boolean)));
    const hotelImageCount = hotelImages.length;

    return (
      <article
        className={`place-item public-hotel-card mb-4 ${selectedMarkerId && hotel.id === selectedMarkerId ? 'is-selected' : ''}`}
        key={hotel.id || index}
        data-testid="public-hotel-card"
        onMouseEnter={() => hotel.id && setSelectedMarkerId(hotel.id)}
      >
        <div className="public-hotel-card__media">
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
          <div className="public-hotel-card__image-meta">
            {hotel.featured ? <span className="badge bg-info">Trending</span> : null}
            {hotelImageCount > 1 ? <span className="public-hotel-card__image-count">{hotelImageCount} photos</span> : null}
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
            {compactAmenities.map((amenity) => (
              <span className="badge rounded-pill bg-light text-dark border public-hotel-card__amenity-chip" key={amenity}>
                {amenity}
              </span>
            ))}
            {extraAmenities > 0 ? (
              <span className="badge rounded-pill bg-light text-dark border public-hotel-card__amenity-chip">+{extraAmenities}</span>
            ) : null}
          </div>

          {mapHotel?.approximateLocation ? (
            <div className="public-hotel-card__approximate">
              <i className="isax isax-location5" aria-hidden="true"></i>
              <span>{formatApproximateLabel(mapHotel)}</span>
            </div>
          ) : null}

          <div className="public-hotel-card__footer border-top pt-3 mt-3 gap-3">
            <div className="text-start">
              <h5 className="text-primary text-nowrap mb-1">{priceInfo.headline}</h5>
              {priceInfo.note ? <div className="fs-12 text-muted public-hotel-card__note">{priceInfo.note}</div> : null}
            </div>
            <div className="d-flex align-items-center gap-2 public-hotel-card__actions">
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
                  <span data-testid="public-hotel-map-total-count">{mapHotels.length} shown on map</span>
                  <span data-testid="public-hotel-map-exact-count">{exactLocationCount} exact</span>
                  <span data-testid="public-hotel-map-approximate-count">{approximateLocationCount} approximate</span>
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
                    <MapContainer
                      center={DEFAULT_CENTER}
                      zoom={DEFAULT_ZOOM}
                      scrollWheelZoom
                      className="public-hotel-results__leaflet-map"
                      data-testid="public-hotel-leaflet-map"
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <HotelMapViewport hotels={mapHotels} selectedHotel={selectedMarker} />
                      {mapHotels.map((hotel) => (
                        <Marker
                          key={hotel.id}
                          position={[hotel.mapLat, hotel.mapLng]}
                          icon={buildPriceMarkerIcon(hotel, hotel.id === selectedMarkerId)}
                          eventHandlers={{
                            click: () => handleMarkerSelect(hotel.id),
                          }}
                        />
                      ))}
                    </MapContainer>
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
