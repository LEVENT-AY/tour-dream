import { all_routes } from "../../feature-module/router/all_routes";
import { formatHotelPrice } from "../common/hotelPricing";
import { AIRPORT_IATA } from "../common/data/flightAirports";
import { getCategoryFallbackSrc } from "./firebaseStorage";
import { searchFlightOffers, type DuffelOffer } from "./duffelApi";
import {
  fetchActivities,
  fetchCars,
  fetchHotels,
  fetchTours,
} from "./firebaseServices";

type TrendingTabKey = "flights" | "hotels" | "cars" | "cruise" | "tour" | "activity" | "visa";

type BaseCard = {
  id: string;
  title: string;
  image: string;
  route: string;
  badge?: string;
  featured?: boolean;
  published?: boolean;
};

export type TrendingFlightCard = BaseCard & {
  airline: string;
  airlineIata: string;
  originLabel: string;
  destinationLabel: string;
  travelDateLabel: string;
  departureLabel: string;
  arrivalLabel: string;
  durationLabel: string;
  stopsLabel: string;
  cabinClass: string;
  price: string;
};

export type TrendingHotelCard = BaseCard & {
  location: string;
  bookingMode: string;
  priceFrom: number | null;
  priceCurrency: string;
  priceUnit: string;
  priceNote: string;
  rating: string;
  reviewsLabel: string;
  description: string;
  amenities: string[];
};

export type TrendingCarCard = BaseCard & {
  type: string;
  location: string;
  fuel: string;
  gear: string;
  travelled: string;
  price: string;
  priceSuffix: string;
  rating: string;
  reviewsLabel: string;
};

export type TrendingTourCard = BaseCard & {
  category: string;
  rating: string;
  reviewsLabel: string;
  location: string;
  price: string;
  oldPrice: string;
  duration: string;
  guestsLabel: string;
  guestAvatar: string;
};

export type TrendingActivityCard = BaseCard & {
  rating: string;
  reviewsLabel: string;
  location: string;
  duration: string;
  price: string;
  oldPrice: string;
  hostAvatar: string;
};

export type TrendingCruiseCard = BaseCard & {
  hostName: string;
  rating: string;
  reviewsLabel: string;
  location: string;
  year: string;
  guests: string;
  width: string;
  speed: string;
  price: string;
  priceSuffix: string;
};

export type TrendingVisaCard = BaseCard & {
  processingTime: string;
  mode: string;
  validity: string;
  price: string;
  priceSuffix: string;
  location: string;
  details: string;
};

export type TrendingSectionCards = {
  flights: TrendingFlightCard[];
  hotels: TrendingHotelCard[];
  cars: TrendingCarCard[];
  cruise: TrendingCruiseCard[];
  tour: TrendingTourCard[];
  activity: TrendingActivityCard[];
  visa: TrendingVisaCard[];
};

const FALLBACK_LIMIT = 4;
const REPLACEMENT_CHAR_PATTERN = /\uFFFD|�/;
const MOJIBAKE_PATTERN = /(?:Ã.|Â|â€|ï¿½|�)/;
const HOMEPAGE_BAD_DESCRIPTION_MARKERS = [
  /restaurants?\s+a\s+proximite/i,
  /restaurants?\s+à\s+proximité/i,
  /cafes?\s+aux\s+alentours/i,
  /cafés?\s+aux\s+alentours/i,
  /hotels?\s+a\s+proximite/i,
  /hôtels?\s+à\s+proximité/i,
];

const toStringValue = (value: unknown, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
};

const toNumberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value: unknown, fallback = 0): string => `$${toNumberValue(value, fallback)}`;

const firstGalleryImage = (data: Record<string, any>): string =>
  Array.isArray(data.gallery) && data.gallery.length > 0 ? data.gallery[0] : "";

const resolveImage = (data: Record<string, any>, category: Parameters<typeof getCategoryFallbackSrc>[0]) =>
  toStringValue(data.image || data.mainImage || data.thumbnail || firstGalleryImage(data), getCategoryFallbackSrc(category));

const resolveFeatured = (data: Record<string, any>) => data.featured === true || data.isFeatured === true;

const resolvePublished = (data: Record<string, any>) => data.published === true;

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasReplacementCharacter = (value: string) => REPLACEMENT_CHAR_PATTERN.test(value);
const hasMojibake = (value: string) => MOJIBAKE_PATTERN.test(value);

const repairMojibake = (value: string) => {
  const text = normalizeText(value);
  if (!text || !hasMojibake(text)) return text;

  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
    const repaired = new TextDecoder("utf-8").decode(bytes).replace(/\u0000/g, "").trim();
    if (!repaired) return text;
    if (!hasReplacementCharacter(text) && hasReplacementCharacter(repaired)) return text;
    return normalizeText(repaired);
  } catch {
    return text;
  }
};

const cleanText = (value: unknown) => repairMojibake(normalizeText(value));

const sanitizeHomepageHotelDescription = (data: Record<string, any>) => {
  const candidates = [
    data.descriptionShort,
    data.description,
    data.details,
    data.rawSource?.detail?.descriptionExtended,
    data.rawSource?.detail?.description,
  ];

  for (const candidate of candidates) {
    const normalized = cleanText(candidate);
    if (!normalized || hasReplacementCharacter(normalized)) continue;

    const stopAt = HOMEPAGE_BAD_DESCRIPTION_MARKERS
      .map((pattern) => normalized.search(pattern))
      .filter((index) => index >= 0)
      .sort((left, right) => left - right)[0];

    const trimmed = normalizeText(stopAt >= 0 ? normalized.slice(0, stopAt) : normalized);
    if (!trimmed || hasReplacementCharacter(trimmed)) continue;
    return trimmed;
  }

  return "";
};

const AIRPORT_LABEL_BY_CODE = Object.entries(AIRPORT_IATA).reduce<Record<string, string>>((acc, [label, code]) => {
  acc[code] = label;
  return acc;
}, {});

const HOMEPAGE_FLIGHT_ORIGINS = ["TUN", "DJE", "MIR"];
const HOMEPAGE_FLIGHT_DESTINATIONS = ["CDG", "IST", "FCO", "FRA", "MAD", "LHR", "DXB", "CAI", "CMN", "DOH"];
const HOMEPAGE_FLIGHT_CACHE_PREFIX = "homepage-flight-deals";
const HOMEPAGE_FLIGHT_SEARCH_DAYS = 7;
const HOMEPAGE_FLIGHT_MAX_ATTEMPTS = 12;

const getAirportLabel = (code: string): string => AIRPORT_LABEL_BY_CODE[code] || code;

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pad = (value: number): string => String(value).padStart(2, "0");

const toDateKey = (value: Date): string =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

const addDays = (baseDate: Date, days: number): Date => {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateLabel = (isoDate: string): string => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const formatTimeLabel = (isoDateTime: string): string => {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) return isoDateTime;
  return parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildFlightSearchRoute = (params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  cabinClass?: string;
}) => {
  const query = new URLSearchParams();
  query.set("origin", params.origin);
  query.set("destination", params.destination);
  query.set("departureDate", params.departureDate);
  query.set("adults", String(params.adults || 1));
  query.set("cabinClass", (params.cabinClass || "economy").toLowerCase());
  if (params.returnDate) query.set("returnDate", params.returnDate);
  return `${all_routes.flightGrid}?${query.toString()}`;
};

const getFlightCacheKey = (dateKey: string) => `${HOMEPAGE_FLIGHT_CACHE_PREFIX}-${dateKey}`;

const readFlightCache = (dateKey: string): TrendingFlightCard[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getFlightCacheKey(dateKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.cards) ? parsed.cards : null;
  } catch {
    return null;
  }
};

const writeFlightCache = (dateKey: string, cards: TrendingFlightCard[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getFlightCacheKey(dateKey),
      JSON.stringify({ dateKey, cards }),
    );
  } catch {
    // ignore cache failures
  }
};

const buildFlightRouteCandidates = (dateKey: string) =>
  HOMEPAGE_FLIGHT_ORIGINS.flatMap((origin) =>
    HOMEPAGE_FLIGHT_DESTINATIONS.map((destination) => ({
      origin,
      destination,
      score: hashString(`${dateKey}:${origin}:${destination}`),
    })),
  ).sort((left, right) => left.score - right.score);

const mapFlightOfferToCard = (
  offer: DuffelOffer,
  route: { origin: string; destination: string },
  departureDate: string,
  index: number,
): TrendingFlightCard => {
  const firstSlice = offer.slices[0];
  const airportOrigin = firstSlice?.origin || route.origin;
  const airportDestination = firstSlice?.destination || route.destination;
  const departureTime = firstSlice?.departureTime || `${departureDate}T00:00:00Z`;
  const arrivalTime = firstSlice?.arrivalTime || departureTime;
  const stops = Number(firstSlice?.stops ?? 0);
  const duration = firstSlice?.duration || "";
  const stopsLabel = stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`;

  return {
    id: `${offer.offerId || `${route.origin}-${route.destination}`}-${index}`,
    title: `${getAirportLabel(airportOrigin)} -> ${getAirportLabel(airportDestination)}`,
    image: `assets/img/flight/flight-thumb-${String((index % 6) + 1).padStart(2, "0")}.jpg`,
    route: buildFlightSearchRoute({
      origin: airportOrigin,
      destination: airportDestination,
      departureDate,
      adults: 1,
      cabinClass: offer.cabinClass || "economy",
    }),
    featured: false,
    published: true,
    airline: offer.airline || "Airline",
    airlineIata: offer.airlineIata || "",
    originLabel: getAirportLabel(airportOrigin),
    destinationLabel: getAirportLabel(airportDestination),
    travelDateLabel: formatDateLabel(departureDate),
    departureLabel: formatTimeLabel(departureTime),
    arrivalLabel: formatTimeLabel(arrivalTime),
    durationLabel: duration ? duration.replace("PT", "").replace("H", "h ").replace("M", "m") : "",
    stopsLabel,
    cabinClass: offer.cabinClass || "economy",
    price: offer.totalCurrency ? `${offer.totalCurrency} ${offer.totalAmount}` : offer.totalAmount,
  };
};

const loadHomepageFlightCards = async (): Promise<TrendingFlightCard[]> => {
  const todayKey = toDateKey(new Date());
  const cached = readFlightCache(todayKey);
  if (cached && cached.length > 0) {
    return cached.slice(0, FALLBACK_LIMIT);
  }

  const travelDate = addDays(new Date(), HOMEPAGE_FLIGHT_SEARCH_DAYS + (hashString(todayKey) % 3));
  const departureDate = toDateKey(travelDate);
  const candidates = buildFlightRouteCandidates(todayKey);
  const collected: TrendingFlightCard[] = [];

  for (const candidate of candidates.slice(0, HOMEPAGE_FLIGHT_MAX_ATTEMPTS)) {
    if (collected.length >= FALLBACK_LIMIT) break;
    try {
      const result = await searchFlightOffers({
        origin: candidate.origin,
        destination: candidate.destination,
        departureDate,
        adults: 1,
        cabinClass: "economy",
      });
      const offer = result.offers[0];
      if (!offer) continue;
      collected.push(mapFlightOfferToCard(offer, candidate, departureDate, collected.length));
    } catch {
      try {
        const fallbackResponse = await fetch("https://us-central1-tour-tunisi.cloudfunctions.net/flightOffersSearch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: candidate.origin,
            destination: candidate.destination,
            departureDate,
            adults: 1,
            cabinClass: "economy",
          }),
        });
        if (!fallbackResponse.ok) continue;
        const fallbackResult = (await fallbackResponse.json()) as { offers?: DuffelOffer[] };
        const fallbackOffer = fallbackResult.offers?.[0];
        if (!fallbackOffer) continue;
        collected.push(mapFlightOfferToCard(fallbackOffer, candidate, departureDate, collected.length));
      } catch {
        continue;
      }
    }
  }

  if (collected.length > 0) {
    writeFlightCache(todayKey, collected);
  }

  return collected.slice(0, FALLBACK_LIMIT);
};

const sortHomepageHotels = (items: Record<string, any>[]) =>
  [...items].sort((left, right) => {
    const leftFeatured = resolveFeatured(left) ? 1 : 0;
    const rightFeatured = resolveFeatured(right) ? 1 : 0;
    if (leftFeatured !== rightFeatured) return rightFeatured - leftFeatured;

    const leftPayNow = String(left.bookingMode || "").toLowerCase() === "pay_now" ? 1 : 0;
    const rightPayNow = String(right.bookingMode || "").toLowerCase() === "pay_now" ? 1 : 0;
    if (leftPayNow !== rightPayNow) return rightPayNow - leftPayNow;

    const leftUpdated = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightUpdated = new Date(right.updatedAt || right.createdAt || 0).getTime();
    if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;

    const leftRating = toNumberValue(left.rating || left.starRating, 0);
    const rightRating = toNumberValue(right.rating || right.starRating, 0);
    return rightRating - leftRating;
  });

const loadHomepageHotels = async (): Promise<TrendingHotelCard[]> => {
  const hotels = await fetchHotels();
  return sortHomepageHotels(hotels)
    .filter(resolvePublished)
    .slice(0, FALLBACK_LIMIT)
    .map((hotel, index) => mapHotelCard(hotel, index));
};

const buildHotelDetailsRoute = (itemId?: string) =>
  itemId ? `${all_routes.hotelDetails}?id=${encodeURIComponent(itemId)}` : all_routes.hotelDetails;

const buildCruiseDetailsRoute = (itemId?: string) =>
  itemId ? `${all_routes.cruiseDetails}?id=${encodeURIComponent(itemId)}` : all_routes.cruiseDetails;

const buildVisaDetailsRoute = (itemId?: string) =>
  itemId ? `${all_routes.visaDetails}?id=${encodeURIComponent(itemId)}` : all_routes.visaDetails;

const sortTrendingItems = (items: Record<string, any>[]) =>
  [...items].sort((left, right) => {
    const leftFeatured = resolveFeatured(left) ? 1 : 0;
    const rightFeatured = resolveFeatured(right) ? 1 : 0;
    if (leftFeatured !== rightFeatured) return rightFeatured - leftFeatured;

    const leftUpdated = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightUpdated = new Date(right.updatedAt || right.createdAt || 0).getTime();
    if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;

    const leftRating = toNumberValue(left.rating, 0);
    const rightRating = toNumberValue(right.rating, 0);
    return rightRating - leftRating;
  });

const takeTrendingItems = (items: Record<string, any>[], fallback: Record<string, any>[]) => {
  const eligible = sortTrendingItems(items.filter(resolvePublished));
  return eligible.length > 0
    ? eligible.slice(0, FALLBACK_LIMIT)
    : fallback.map((item) => ({ ...item, __fallback: true }));
};

const mapHotelCard = (data: Record<string, any>, index: number): TrendingHotelCard => {
  const price = data.priceFrom ?? data.price ?? data.pricePerNight ?? null;
  const priceCurrency = toStringValue(data.priceCurrency || data.currency || "", "");
  const priceUnit = toStringValue(data.priceUnit || data.pricePerNightUnit || "night", "night");
  const isPayNowHotel = String(data.bookingMode || "").toLowerCase() === "pay_now";
  const hasPayableAmount = price != null && Number(price) > 0 && Boolean(priceCurrency);
  const priceInfo = formatHotelPrice(
    {
      priceFrom: price,
      priceCurrency,
      priceUnit,
      priceNote: isPayNowHotel
        ? (hasPayableAmount
            ? "Manual payment. Booking is confirmed after payment verification."
            : "Price required before payment")
        : data.priceNote || "",
    },
    {
      prefix: "Starts From",
      fallbackLabel: isPayNowHotel ? "Price available soon" : "Price on request",
    },
  );

  return {
    id: toStringValue(data.id, `hotel-${index}`),
    title: toStringValue(data.title || data.name, `Hotel ${index + 1}`),
    image: `assets/img/hotels/hotel-thumb-${String((index % 6) + 1).padStart(2, "0")}.jpg`,
    route: data.__fallback ? all_routes.hotelDetails : buildHotelDetailsRoute(toStringValue(data.id, "")),
    badge: toStringValue(data.badge || (data.featured ? "Trending" : ""), data.featured ? "Trending" : ""),
    featured: resolveFeatured(data),
    published: resolvePublished(data),
    location: cleanText(data.location || data.city || data.country || "Unknown location"),
    bookingMode: String(data.bookingMode || ""),
    priceFrom: price == null || price === "" ? null : Number(price),
    priceCurrency,
    priceUnit,
    priceNote: priceInfo.note || "",
    rating: toStringValue(data.rating ?? data.starRating ?? 0, "0"),
    reviewsLabel: `(${toNumberValue(data.reviewsCount, 0)} Reviews)`,
    description: sanitizeHomepageHotelDescription(data),
    amenities: Array.isArray(data.amenities) ? data.amenities.map((item) => cleanText(item)).filter(Boolean) : [],
  };
};

const mapCarCard = (data: Record<string, any>, index: number): TrendingCarCard => ({
  id: toStringValue(data.id, `car-${index}`),
  title: toStringValue(data.title || data.name, `Car ${index + 1}`),
  image: resolveImage(data, "cars"),
  route: data.__fallback ? all_routes.carDetails : `${all_routes.carDetails}?id=${encodeURIComponent(toStringValue(data.id, ""))}`,
  badge: toStringValue(data.badge || (data.featured ? "Trending" : ""), data.featured ? "Trending" : ""),
  featured: resolveFeatured(data),
  published: resolvePublished(data),
  type: toStringValue(data.type || data.vehicleType || data.body, "Sedan"),
  location: toStringValue(data.location || data.city || data.country, "Unknown location"),
  fuel: toStringValue(data.fuel || data.fuelType, "Fuel"),
  gear: toStringValue(data.gear || data.transmission, "Auto"),
  travelled: toStringValue(data.travelled || data.mileage, "0 KM"),
  price: formatCurrency(data.price, 0),
  priceSuffix: "/ day",
  rating: toStringValue(data.rating ?? 0, "0"),
  reviewsLabel: `(${toNumberValue(data.reviewsCount, 0)} Reviews)`,
});

const mapTourCard = (data: Record<string, any>, index: number): TrendingTourCard => ({
  id: toStringValue(data.id, `tour-${index}`),
  title: toStringValue(data.title || data.name, `Tour ${index + 1}`),
  image: resolveImage(data, "tours"),
  route: data.__fallback ? all_routes.tourDetails : `${all_routes.tourDetails}?id=${encodeURIComponent(toStringValue(data.id, ""))}`,
  badge: toStringValue(data.badge || (data.featured ? "Trending" : ""), data.featured ? "Trending" : ""),
  featured: resolveFeatured(data),
  published: resolvePublished(data),
  category: toStringValue(data.category || data.type || data.listingCategory, "Tour"),
  rating: toStringValue(data.rating ?? 0, "0"),
  reviewsLabel: `(${toNumberValue(data.reviewsCount, 0)} Reviews)`,
  location: toStringValue(data.location || data.city || data.country, "Unknown location"),
  price: formatCurrency(data.price, 0),
  oldPrice: data.oldPrice ? formatCurrency(data.oldPrice, 0) : "",
  duration: toStringValue(data.duration, ""),
  guestsLabel: `${toNumberValue(data.guests, 0)} Guests`,
  guestAvatar: toStringValue(data.guestAvatar || "assets/img/users/user-08.jpg"),
});

const mapActivityCard = (data: Record<string, any>, index: number): TrendingActivityCard => ({
  id: toStringValue(data.id, `activity-${index}`),
  title: toStringValue(data.title || data.name, `Activity ${index + 1}`),
  image: resolveImage(data, "activities"),
  route: data.__fallback ? all_routes.activityDetails : `${all_routes.activityDetails}?id=${encodeURIComponent(toStringValue(data.id, ""))}`,
  badge: toStringValue(data.badge || (data.featured ? "Trending" : ""), data.featured ? "Trending" : ""),
  featured: resolveFeatured(data),
  published: resolvePublished(data),
  rating: toStringValue(data.rating ?? 0, "0"),
  reviewsLabel: `(${toNumberValue(data.reviewsCount, 0)} reviews)`,
  location: toStringValue(data.location || data.city || data.country, "Unknown location"),
  duration: toStringValue(data.duration, ""),
  price: formatCurrency(data.price, 0),
  oldPrice: data.oldPrice ? formatCurrency(data.oldPrice, 0) : "",
  hostAvatar: toStringValue(data.hostAvatar || "assets/img/users/user-08.jpg"),
});

const mapCruiseCard = (data: Record<string, any>, index: number): TrendingCruiseCard => ({
  id: toStringValue(data.id, `cruise-${index}`),
  title: toStringValue(data.title || data.name, `Cruise ${index + 1}`),
  image: resolveImage(data, "default"),
  route: buildCruiseDetailsRoute(toStringValue(data.id, "")),
  badge: toStringValue(data.badge || (data.featured ? "Trending" : ""), data.featured ? "Trending" : ""),
  featured: resolveFeatured(data),
  published: resolvePublished(data),
  hostName: toStringValue(data.hostName || data.ownerName || data.agentName, "Captain"),
  rating: toStringValue(data.rating ?? 0, "0"),
  reviewsLabel: `(${toNumberValue(data.reviewsCount, 0)})`,
  location: toStringValue(data.location || data.city || data.country, "Unknown location"),
  year: toStringValue(data.year || data.launchedOn, ""),
  guests: toStringValue(data.guests || data.capacity, ""),
  width: toStringValue(data.width || data.beam, ""),
  speed: toStringValue(data.speed || "", ""),
  price: formatCurrency(data.price, 0),
  priceSuffix: "/ day",
});

const mapVisaCard = (data: Record<string, any>, index: number): TrendingVisaCard => ({
  id: toStringValue(data.id, `visa-${index}`),
  title: toStringValue(data.title || data.name, `Visa ${index + 1}`),
  image: resolveImage(data, "default"),
  route: buildVisaDetailsRoute(toStringValue(data.id, "")),
  badge: toStringValue(data.badge || data.type || data.name, data.type || data.name || "Visa"),
  featured: resolveFeatured(data),
  published: resolvePublished(data),
  processingTime: toStringValue(data.processingTime || data.duration || data.time, ""),
  mode: toStringValue(data.mode || data.visaMode, ""),
  validity: toStringValue(data.validity || data.validityPeriod, ""),
  price: formatCurrency(data.price, 0),
  priceSuffix: "/ Person",
  location: toStringValue(data.location || data.country || data.city, "Unknown location"),
  details: toStringValue(data.details || data.description, ""),
});

export const TRENDING_FALLBACK_DATA: TrendingSectionCards = {
  flights: [],
  hotels: [],
  cars: [
    mapCarCard(
      {
        id: "fallback-car-1",
        title: "Ford Mustang 4.0 AT",
        type: "Sedan",
        location: "Oxford Street, London",
        fuel: "Hybrid",
        gear: "Manual",
        travelled: "14,000 KM",
        price: 500,
        rating: 5,
        reviewsCount: 400,
        image: "assets/img/cars/car-06.jpg",
        featured: true,
        published: true,
      },
      0
    ),
    mapCarCard(
      {
        id: "fallback-car-2",
        title: "Ford Mustang 4.0 AT",
        type: "Sedan",
        location: "Oxford Street, London",
        fuel: "Diesel",
        gear: "Manual",
        travelled: "10,300 KM",
        price: 600,
        rating: 4.7,
        reviewsCount: 300,
        image: "assets/img/cars/car-07.jpg",
        featured: true,
        published: true,
      },
      1
    ),
    mapCarCard(
      {
        id: "fallback-car-3",
        title: "Ferrari 458 MM Special",
        type: "Sedan",
        location: "Princes Street, Edinburgh",
        fuel: "Hybrid",
        gear: "Auto",
        travelled: "13,000 KM",
        price: 300,
        rating: 4,
        reviewsCount: 320,
        image: "assets/img/cars/car-08.jpg",
        featured: true,
        published: true,
      },
      2
    ),
    mapCarCard(
      {
        id: "fallback-car-4",
        title: "Mercedes-benz Convertible",
        type: "Sedan",
        location: "Princes Street, Edinburgh",
        fuel: "Hybrid",
        gear: "Auto",
        travelled: "10,000 KM",
        price: 400,
        rating: 4,
        reviewsCount: 380,
        image: "assets/img/cars/car-09.jpg",
        featured: true,
        published: true,
      },
      3
    ),
  ],
  cruise: [
    mapCruiseCard(
      {
        id: "fallback-cruise-1",
        title: "Super Aquamarine",
        hostName: "Beth Williams",
        location: "Ciutat Vella, Barcelona",
        year: "2021",
        guests: 4,
        width: "88.47 m",
        speed: "19 Knots",
        price: 500,
        rating: 4.9,
        reviewsCount: 400,
        image: "assets/img/cruise/cruise-05.jpg",
        featured: true,
        published: true,
      },
      0
    ),
    mapCruiseCard(
      {
        id: "fallback-cruise-2",
        title: "Bonnie Yacht",
        hostName: "Tom Andrews",
        location: "Oxford Street, London",
        year: "2020",
        guests: 3,
        width: "70.63 m",
        speed: "17 Knots",
        price: 600,
        rating: 4.7,
        reviewsCount: 300,
        image: "assets/img/cruise/cruise-12.jpg",
        featured: true,
        published: true,
      },
      1
    ),
    mapCruiseCard(
      {
        id: "fallback-cruise-3",
        title: "Coral Cruiser",
        hostName: "Robert Cogs",
        location: "Princes Street, Edinburgh",
        year: "2021",
        guests: 4,
        width: "88.47 m",
        speed: "19 Knots",
        price: 500,
        rating: 4.5,
        reviewsCount: 320,
        image: "assets/img/cruise/cruise-09.jpg",
        featured: true,
        published: true,
      },
      2
    ),
    mapCruiseCard(
      {
        id: "fallback-cruise-4",
        title: "Harbor Haven",
        hostName: "Kenneth Pal",
        location: "Princes Street, Edinburgh",
        year: "2016",
        guests: 6,
        width: "98.15 m",
        speed: "14 Knots",
        price: 300,
        rating: 4.3,
        reviewsCount: 380,
        image: "assets/img/cruise/cruise-09.jpg",
        featured: true,
        published: true,
      },
      3
    ),
  ],
  tour: [
    mapTourCard(
      {
        id: "fallback-tour-1",
        title: "Rainbow Mountain Valley",
        category: "Ecotourism",
        location: "Ciutat Vella, Barcelona",
        rating: 5,
        reviewsCount: 105,
        price: 500,
        oldPrice: 789,
        duration: "4 Day,3 Night",
        guests: 14,
        guestAvatar: "assets/img/users/user-08.jpg",
        image: "assets/img/tours/tours-07.jpg",
        featured: true,
        published: true,
      },
      0
    ),
    mapTourCard(
      {
        id: "fallback-tour-2",
        title: "Mystic Falls",
        category: "Adventure Tour",
        location: "Oxford Street, London",
        rating: 4.7,
        reviewsCount: 110,
        price: 600,
        oldPrice: 700,
        duration: "3 Day, 2 Night",
        guests: 12,
        guestAvatar: "assets/img/users/user-09.jpg",
        image: "assets/img/tours/tours-08.jpg",
        featured: true,
        published: true,
      },
      1
    ),
    mapTourCard(
      {
        id: "fallback-tour-3",
        title: "Crystal Lake",
        category: "Summer Trip",
        location: "Princes Street, Edinburgh",
        rating: 4.7,
        reviewsCount: 180,
        price: 300,
        oldPrice: 500,
        duration: "5 Day, 4 Night",
        guests: 16,
        guestAvatar: "assets/img/users/user-10.jpg",
        image: "assets/img/tours/tours-09.jpg",
        featured: true,
        published: true,
      },
      2
    ),
    mapTourCard(
      {
        id: "fallback-tour-4",
        title: "Majestic Peaks",
        category: "Adventure Tour",
        location: "Deansgate, Manchester",
        rating: 4.9,
        reviewsCount: 300,
        price: 400,
        oldPrice: 480,
        duration: "3 Day, 2 Night",
        guests: 10,
        guestAvatar: "assets/img/users/user-11.jpg",
        image: "assets/img/tours/tours-10.jpg",
        featured: true,
        published: true,
      },
      3
    ),
  ],
  activity: [
    mapActivityCard(
      {
        id: "fallback-activity-1",
        title: "Snorkeling Tour",
        location: "Phuket, Thailand",
        duration: "4 hrs",
        rating: 4.9,
        reviewsCount: 672,
        price: 400,
        oldPrice: 480,
        hostAvatar: "assets/img/users/user-08.jpg",
        image: "assets/img/activities/activity-01.jpg",
        featured: true,
        published: true,
      },
      0
    ),
    mapActivityCard(
      {
        id: "fallback-activity-2",
        title: "Alpine Snowboarding",
        location: "Zermatt, Switzerland",
        duration: "3 hrs",
        rating: 4.6,
        reviewsCount: 450,
        price: 150,
        oldPrice: 200,
        hostAvatar: "assets/img/users/user-09.jpg",
        image: "assets/img/activities/activity-02.jpg",
        featured: true,
        published: true,
      },
      1
    ),
    mapActivityCard(
      {
        id: "fallback-activity-3",
        title: "White Water Rafting",
        location: "Rotorua, New Zealand",
        duration: "5 hrs",
        rating: 4.5,
        reviewsCount: 320,
        price: 350,
        oldPrice: 400,
        hostAvatar: "assets/img/users/user-10.jpg",
        image: "assets/img/activities/activity-03.jpg",
        featured: true,
        published: true,
      },
      2
    ),
    mapActivityCard(
      {
        id: "fallback-activity-4",
        title: "Cliffside Paragliding",
        location: "Annecy, France",
        duration: "2 hrs",
        rating: 4.2,
        reviewsCount: 280,
        price: 300,
        oldPrice: 350,
        hostAvatar: "assets/img/users/user-11.jpg",
        image: "assets/img/activities/activity-04.jpg",
        featured: true,
        published: true,
      },
      3
    ),
  ],
  visa: [
    mapVisaCard(
      {
        id: "fallback-visa-1",
        title: "Electronic Visa for Tourism and Recreation",
        badge: "Business Visa",
        processingTime: "5-7 Working Days",
        mode: "Electronic",
        validity: "90 Days",
        location: "USA",
        price: 500,
        image: "assets/img/visa/visa-01.jpg",
        featured: true,
        published: true,
      },
      0
    ),
    mapVisaCard(
      {
        id: "fallback-visa-2",
        title: "Long term for Academic with Health Insurance",
        badge: "Student Visa",
        processingTime: "2-4 Weeks",
        mode: "Consular Visa",
        validity: "1 Year",
        location: "Egypt",
        price: 300,
        image: "assets/img/visa/visa-02.jpg",
        featured: true,
        published: true,
      },
      1
    ),
    mapVisaCard(
      {
        id: "fallback-visa-3",
        title: "Work Visa for Employment Opportunities",
        badge: "Work Visa",
        processingTime: "15-20 Working Days",
        mode: "Paper",
        validity: "2 Years",
        location: "Spain",
        price: 800,
        image: "assets/img/visa/visa-03.jpg",
        featured: true,
        published: true,
      },
      2
    ),
    mapVisaCard(
      {
        id: "fallback-visa-4",
        title: "Short term Visa for Travelers with Layovers",
        badge: "Transit Visa",
        processingTime: "3-5 Working Days",
        mode: "Electronic",
        validity: "72 Hours",
        location: "Qatar",
        price: 100,
        image: "assets/img/visa/visa-04.jpg",
        featured: true,
        published: true,
      },
      3
    ),
  ],
};

export async function fetchTrendingSectionCards(): Promise<TrendingSectionCards> {
  const [flights, hotels, cars, tours, activities] = await Promise.all([
    loadHomepageFlightCards().catch(() => []),
    loadHomepageHotels().catch(() => []),
    fetchCars().catch(() => []),
    fetchTours().catch(() => []),
    fetchActivities().catch(() => []),
  ]);

  return {
    flights,
    hotels,
    cars: takeTrendingItems(cars, TRENDING_FALLBACK_DATA.cars).map(mapCarCard),
    cruise: TRENDING_FALLBACK_DATA.cruise,
    tour: takeTrendingItems(tours, TRENDING_FALLBACK_DATA.tour).map(mapTourCard),
    activity: takeTrendingItems(activities, TRENDING_FALLBACK_DATA.activity).map(mapActivityCard),
    visa: TRENDING_FALLBACK_DATA.visa,
  };
}

export type { TrendingTabKey };
