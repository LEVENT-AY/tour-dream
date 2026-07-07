import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import { useSearchParams } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import StickyContent from "./stickyContent";
import { formatHotelPrice } from "../../../core/common/hotelPricing";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import dayjs from "dayjs";
import { all_routes } from "../../router/all_routes";
import { fetchHotelById, fetchHotels } from "../../../core/services/firebaseServices";
import { auth } from "../../../firebase";
import { useAuth } from "../../../core/contexts/AuthContext";

type FaqItem = {
  question: string;
  answer: string;
};

type ReviewItem = {
  text: string;
  date?: string;
};

type NearbySection = {
  title: string;
  items: string[];
};

type HotelDetailsView = {
  id: string;
  title: string;
  location: string;
  rating: string;
  reviewsCount: number;
  reviewsLabel: string;
  reviewSummary: string;
  description: string;
  image: string;
  gallery: string[];
  amenities: string[];
  roomTypes: string[];
  boardOptions: string[];
  highlights: string[];
  highlightChips: string[];
  services: string[];
  unavailableServiceNotes: string[];
  nearbyLandmarks: string[];
  nearbySections: NearbySection[];
  faq: FaqItem[];
  reviews: ReviewItem[];
  checkInTime: string;
  checkOutTime: string;
  providerMessage: string;
  roomInventoryText: string;
  bookingMode: string;
  bookingEnabled: boolean;
  published: boolean;
  latitude: number | null;
  longitude: number | null;
  priceFrom: number | null;
  priceCurrency: string;
  priceUnit: string;
  priceNote: string;
  priceStatus: string;
  sourceName: string;
  sourceUrl: string;
};

const REPLACEMENT_CHAR_PATTERN = /\uFFFD|ï¿½/;
const MOJIBAKE_PATTERN = /(?:Ã.|Â|â€|â€™|â€œ|â€\u009d|â€“|â€”)/;
const TEMPLATE_IMAGE_PATTERN = /assets\/img\/hotels|hotel-large-|hotel-thumb-|logo|favicon|preloader|loader|spinner|tracking|pixel|sprite|placeholder|facebook\.com\/tr/i;

const NEARBY_MARKERS = [
  /\bles\s+environs\b/i,
  /\brestaurants?\s+�\s+proximit�\b/i,
  /\bcaf�s?\s+aux\s+alentours\b/i,
  /\bh�tels?\s+�\s+proximit�\b/i,
  /\blieux\s+�\s+proximit�\b/i,
  /\bsites?\s+historiques\b/i,
  /\battractions?\s+�\s+proximit�\b/i,
  /\brestaurants?\s+nearby\b/i,
  /\bcafes?\s+nearby\b/i,
  /\bhotels?\s+nearby\b/i,
];

const DIRECT_BOOKING_PATTERNS = [
  /r�servez d�s maintenant[^.]*\.\s*/gi,
  /book now[^.]*\.\s*/gi,
  /instant booking[^.]*\.\s*/gi,
  /confirmed booking[^.]*\.\s*/gi,
  /pay now[^.]*\.\s*/gi,
  /guaranteed booking[^.]*\.\s*/gi,
  /book now/gi,
  /book online/gi,
  /reserve now/gi,
  /make a reservation/gi,
  /request this hotel/gi,
  /r�server maintenant/gi,
  /book your stay/gi,
];

const NEGATIVE_SERVICE_PATTERNS = [
  /\bnon disponible\b/i,
  /\bunavailable\b/i,
  /\bnot available\b/i,
  /\bnot provided\b/i,
  /\bsans\b/i,
];

const PREFERRED_AMENITY_PATTERNS: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /\b(pieds dans l eau|beachfront|bord de mer|plage)\b/i, score: 60 },
  { pattern: /\b(piscine|pool)\b/i, score: 50 },
  { pattern: /\b(wi-?fi|wifi)\b/i, score: 48 },
  { pattern: /\b(climatisation|air conditioning|air conditionn?ed)\b/i, score: 46 },
  { pattern: /\brestaurant\b/i, score: 44 },
  { pattern: /\bbar\b/i, score: 42 },
  { pattern: /\bparking\b/i, score: 40 },
  { pattern: /\bspa|bien-?être|wellness|massage\b/i, score: 38 },
  { pattern: /\bfamily|enfants|child|kids|bassin pour enfants\b/i, score: 36 },
  { pattern: /\banimation|sport|tennis|fitness|gym|jeux\b/i, score: 30 },
];

const SECTION_TITLE_PATTERNS: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /\brestaurants?\s+�\s+proximit�\b/i, title: 'Restaurants � proximit�' },
  { pattern: /\bcaf�s?\s+aux\s+alentours\b/i, title: 'Caf�s aux alentours' },
  { pattern: /\bh�tels?\s+�\s+proximit�\b/i, title: 'H�tels � proximit�' },
  { pattern: /\blieux\s+�\s+proximit�\b/i, title: 'Lieux � proximit�' },
  { pattern: /\bsites?\s+historiques\b/i, title: 'Sites historiques' },
  { pattern: /\battractions?\s+�\s+proximit�\b/i, title: 'Attractions � proximit�' },
  { pattern: /\brestaurants?\s+nearby\b/i, title: 'Restaurants nearby' },
  { pattern: /\bcafes?\s+nearby\b/i, title: 'Cafes nearby' },
  { pattern: /\bhotels?\s+nearby\b/i, title: 'Hotels nearby' },
];

const toStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        .map((item) => item.trim())
    : typeof value === "string" && value.trim()
      ? [value.trim()]
      : [];

const firstTextValue = (...values: unknown[]) =>
  values.find((value) => typeof value === "string" && value.trim()) as string | undefined;

const hasReplacementCharacter = (value: string) => REPLACEMENT_CHAR_PATTERN.test(value);

const hasMojibake = (value: string) => MOJIBAKE_PATTERN.test(value);

const repairMojibake = (value: string) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || !hasMojibake(text)) return text;

  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
    const repaired = new TextDecoder("utf-8").decode(bytes).replace(/\u0000/g, "").trim();
    if (!repaired) return text;
    if (!hasReplacementCharacter(text) && hasReplacementCharacter(repaired)) return text;
    return repaired;
  } catch {
    return text;
  }
};

const normalizeText = (value: unknown) => String(value || "").replace(/\s+/g, " ").trim();

const cleanText = (value: unknown) => repairMojibake(normalizeText(value));

const normalizeUniqueStrings = (...values: unknown[]) =>
  [
    ...new Set(
      values
        .flatMap((value) => toStringList(value).map((item) => cleanText(item)))
        .filter((item) => item && !hasReplacementCharacter(item)),
    ),
  ];

const trimAtNearbyMarkers = (value: string) => {
  const text = cleanText(value);
  if (!text) return "";

  let cutoff = text.length;
  for (const marker of NEARBY_MARKERS) {
    const match = text.match(marker);
    if (!match || match.index == null) continue;
    cutoff = Math.min(cutoff, match.index);
  }

  return cleanText(text.slice(0, cutoff).replace(/[\s,;:-]+$/, ""));
};

const buildDescriptionLead = (data: Record<string, any>, title: string) => {
  const starRating = Number(data?.starRating || data?.ratingValue || data?.rating);
  const region = cleanText(data?.region || "");
  const city = cleanText(data?.city || "");
  const normalizedCity = city.replace(/\bDjerba\b/i, "").replace(/\s+/g, " ").trim();
  const leadTitle = title || cleanText(firstTextValue(data?.hotelName, data?.name) || "");

  if (!leadTitle || !Number.isFinite(starRating) || starRating <= 0) return "";

  const regionLabel = region ? `sur l'île de ${region.charAt(0).toUpperCase()}${region.slice(1)}` : "sur l'île de Djerba";
  const cityLabel = normalizedCity ? `dans la région de ${normalizedCity}` : "dans la région de Midoun";
  return `Le ${leadTitle} est un hôtel ${Math.round(starRating)} étoiles situé ${regionLabel}, ${cityLabel}.`;
};

const sanitizeRequestOnlyCopy = (value: string) => {
  let text = cleanText(value);
  for (const pattern of DIRECT_BOOKING_PATTERNS) {
    text = text.replace(pattern, "");
  }
  return text.replace(/\s{2,}/g, " ").replace(/^[,;:-]+\s*/, "").trim();
};

const isNegativeService = (value: string) => {
  const text = cleanText(value);
  return Boolean(text) && NEGATIVE_SERVICE_PATTERNS.some((pattern) => pattern.test(text));
};

const toObjectText = (value: unknown) => {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return cleanText(firstTextValue(record.label, record.name, record.title, record.text, record.code, record.value) || "");
};

const normalizePositiveServices = (...values: unknown[]) =>
  normalizeUniqueStrings(...values)
    .filter((item) => item && !isNegativeService(item))
    .filter((item) => !/\b(non disponible|unavailable|not available)\b/i.test(item))
    .sort((a, b) => {
      const score = (value: string) =>
        PREFERRED_AMENITY_PATTERNS.reduce((total, entry) => total + (entry.pattern.test(value) ? entry.score : 0), 0);
      return score(b) - score(a);
    });

const normalizeBoardOptions = (...values: unknown[]) =>
  [
    ...new Set(
      values
        .flatMap((value) => {
          if (Array.isArray(value)) {
            return value.map((item) => (typeof item === "string" ? cleanText(item) : toObjectText(item)));
          }
          return typeof value === "string" ? [cleanText(value)] : [toObjectText(value)];
        })
        .filter(Boolean),
    ),
  ].slice(0, 8);

const buildDescriptionText = (data: Record<string, any>, title: string) => {
  const descriptionCandidates = [
    data?.description,
    data?.longDescription,
    data?.details,
    data?.rawSource?.detail?.descriptionExtended,
    data?.rawSource?.detail?.description,
  ];

  for (const candidate of descriptionCandidates) {
    const raw = cleanText(String(candidate || ""));
    if (!raw) continue;

    const sanitized = trimAtNearbyMarkers(
      sanitizeRequestOnlyCopy(raw)
        .replace(/^(réservez dès maintenant|book now|instant booking|confirmed booking|pay now|guaranteed booking)[^.]*\.\s*/i, "")
        .replace(/^(votre séjour\b[^.]*\.\s*)/i, "")
        .trim(),
    );
    if (!sanitized || hasReplacementCharacter(sanitized)) continue;
    if (/^(votre séjour|votre sejour)/i.test(sanitized) || sanitized.length < 60) {
      const fallback = buildDescriptionLead(data, title);
      if (fallback) return fallback;
    }
    if (!/^(Le|La|Les|L['’]|Ce|Cette|Cet|L’|The|Hotel|Hôtel)\b/.test(sanitized)) {
      const fallback = buildDescriptionLead(data, title);
      if (fallback) return fallback;
    }
    return sanitized;
  }

  return buildDescriptionLead(data, title);
};

const extractNearbyGroupText = (...values: unknown[]) =>
  values
    .flatMap((value) => {
      if (Array.isArray(value)) return value.map((item) => cleanText(typeof item === "string" ? item : toObjectText(item)));
      return typeof value === "string" ? [cleanText(value)] : [toObjectText(value)];
    })
    .filter(Boolean);

const normalizeFaq = (...values: unknown[]): FaqItem[] => {
  for (const value of values) {
    if (!Array.isArray(value)) continue;

    const normalized = value
      .map((item) => ({
        question: cleanText((item as Record<string, unknown>)?.question),
        answer: cleanText((item as Record<string, unknown>)?.answer),
      }))
      .filter((item) => item.question && item.answer)
      .filter((item) => !hasReplacementCharacter(item.question) && !hasReplacementCharacter(item.answer));

    if (normalized.length > 0) return normalized;
  }

  return [];
};

const normalizeReviews = (...values: unknown[]): ReviewItem[] => {
  for (const value of values) {
    if (!Array.isArray(value)) continue;

    const normalized = value
      .map((item) => ({
        text: cleanText((item as Record<string, unknown>)?.text),
        date: cleanText((item as Record<string, unknown>)?.date),
      }))
      .filter((item) => item.text)
      .filter((item) => !hasReplacementCharacter(item.text));

    if (normalized.length > 0) return normalized;
  }

  return [];
};

const normalizeImageUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim());
    parsed.hash = "";
    parsed.search = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return "";
  }
};

const normalizeGallery = (data?: Record<string, any> | null) => {
  const seen = new Set<string>();

  const images = [data?.image, data?.mainImage, data?.thumbnail]
    .flatMap((value) => toStringList(value))
    .concat(toStringList(data?.gallery), toStringList(data?.galleryImages), toStringList(data?.images))
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item) && !TEMPLATE_IMAGE_PATTERN.test(item))
    .filter((item) => {
      const normalized = normalizeImageUrl(item);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

  if (images.length <= 1) return images;

  const ordered = [images[0]];
  const remaining = images.slice(1);
  const preferredIndexes = [0, Math.floor(remaining.length * 0.25), Math.floor(remaining.length * 0.5), Math.floor(remaining.length * 0.75), remaining.length - 1];
  for (const index of preferredIndexes) {
    const item = remaining[index];
    if (item && !ordered.includes(item)) ordered.push(item);
  }
  for (const item of remaining) {
    if (!ordered.includes(item)) ordered.push(item);
  }

  return ordered;
};

const buildHighlightChips = (highlights: string[]) =>
  highlights
    .map((item) => cleanText(item.split(":")[0] || item))
    .map((item) => item.replace(/\.$/, ""))
    .filter(Boolean)
    .slice(0, 3);

const formatRoomInventoryText = (roomInventoryText: string, roomCount?: unknown) => {
  const normalized = cleanText(roomInventoryText);
  const match = normalized.match(/(\d+)\s*rooms?\s*\+\s*(\d+)\s*bungalows?/i);
  if (match) return `${match[1]} Rooms + ${match[2]} Bungalows`;

  const roomMatch = normalized.match(/(\d+)\s*rooms?/i);
  const bungalowMatch = normalized.match(/(\d+)\s*bungalows?/i);
  if (roomMatch && bungalowMatch) return `${roomMatch[1]} Rooms + ${bungalowMatch[1]} Bungalows`;
  if (roomMatch) return `${roomMatch[1]} Rooms`;

  const parsedRoomCount = Number(roomCount);
  if (Number.isFinite(parsedRoomCount) && parsedRoomCount > 0) {
    return `${parsedRoomCount} Rooms`;
  }

  return normalized;
};

const formatNearbySections = (items: string[]) =>
  items
    .map((item) => cleanText(item))
    .filter(Boolean)
    .map((entry) => {
      const matchedTitle = SECTION_TITLE_PATTERNS.find((candidate) => candidate.pattern.test(entry));
      const title = matchedTitle?.title || entry.split(/:\s*/, 1)[0].replace(/\.$/, "");
      const remainder = entry.replace(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:?\\s*`, "i"), "");
      const parsedItems = remainder
        .split(/\s*(?=\d+\.)/)
        .map((item) => item.replace(/^\d+\.\s*/, "").trim().replace(/[.;,]+$/, ""))
        .filter(Boolean)
        .map((item) => item.replace(/\s{2,}/g, " "));

      return {
        title,
        items: parsedItems.length > 0 ? parsedItems : [entry],
      };
    });

const truncateText = (value: string, maxLength = 420) => {
  if (value.length <= maxLength) return value;
  const slice = value.slice(0, maxLength);
  const lastSpaceIndex = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpaceIndex > 0 ? lastSpaceIndex : maxLength).trim()}...`;
};

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  if ("focus" in element) {
    (element as HTMLElement).focus({ preventScroll: true });
  }
};

const normalizeHotelDetails = (data?: Record<string, any> | null): HotelDetailsView | null => {
  if (!data) return null;

  const gallery = normalizeGallery(data);
  const image = firstTextValue(gallery[0]) || '';
  const title = cleanText(firstTextValue(data?.title, data?.name, data?.hotelName, data?.propertyName) || '');
  const description = buildDescriptionText(data, title);
  const locationParts = normalizeUniqueStrings(data?.city, data?.location, data?.address);
  const location = locationParts[0] || cleanText(firstTextValue(data?.country) || '');
  const ratingValue = typeof data?.ratingValue === 'number' ? data.ratingValue : Number(data?.ratingValue ?? data?.rating);
  const reviews = normalizeReviews(data?.reviews, data?.rawSource?.detail?.reviews);
  const reviewsCountValue = typeof data?.reviewsCount === 'number' ? data.reviewsCount : Number(data?.reviewsCount);
  const highlights = normalizeUniqueStrings(data?.highlights);
  const nearbyLandmarks = normalizeUniqueStrings(
    ...extractNearbyGroupText(
      data?.nearbyAttractions,
      data?.nearbyLandmarks,
      data?.landmarks,
      data?.rawSource?.detail?.nearbyAttractions,
      data?.rawSource?.detail?.nearbyLandmarks,
    ),
  );
  const amenities = normalizePositiveServices(data?.amenities, data?.rawSource?.detail?.amenities).slice(0, 9);
  const services = normalizePositiveServices(data?.services, data?.amenities, data?.rawSource?.detail?.services);
  const roomTypes = normalizeUniqueStrings(data?.roomTypes, data?.rawSource?.detail?.roomTypes);
  const boardOptions = normalizeBoardOptions(
    data?.boardOptions,
    data?.selectedBoardType,
    data?.rawSource?.detail?.boardOptions,
    data?.rawSource?.detail?.boardType,
  );
  const unavailableServiceNotes = normalizeUniqueStrings(
    data?.rawSource?.detail?.services,
    data?.services,
    data?.amenities,
  )
    .filter((item) => isNegativeService(item))
    .slice(0, 6);
  const providerMessage = 'DreamsTour will confirm availability and price after request.';

  return {
    id: typeof data?.id === 'string' && data.id.trim() ? data.id : '',
    title,
    location,
    rating: Number.isFinite(ratingValue) && ratingValue > 0 ? String(ratingValue) : '',
    reviewsCount: Number.isFinite(reviewsCountValue) && reviewsCountValue > 0 ? reviewsCountValue : reviews.length,
    reviewsLabel:
      Number.isFinite(reviewsCountValue) && reviewsCountValue > 0
        ? String(reviewsCountValue) + ' Reviews'
        : reviews.length > 0
          ? String(reviews.length) + ' Reviews'
          : '',
    reviewSummary: cleanText(data?.reviewSummary || ''),
    description,
    image,
    gallery,
    amenities,
    roomTypes,
    boardOptions,
    highlights,
    highlightChips: buildHighlightChips(highlights),
    services,
    unavailableServiceNotes,
    nearbyLandmarks,
    nearbySections: formatNearbySections(nearbyLandmarks),
    faq: normalizeFaq(data?.faq, data?.rawSource?.detail?.faq),
    reviews,
    checkInTime: cleanText(data?.checkInTime || ''),
    checkOutTime: cleanText(data?.checkOutTime || ''),
    providerMessage,
    roomInventoryText: formatRoomInventoryText(cleanText(data?.roomInventoryText || ''), data?.roomCount),
    bookingMode: cleanText(data?.bookingMode || ''),
    bookingEnabled: data?.bookingEnabled === true,
    published: data?.published === true,
    latitude: Number.isFinite(Number(data?.latitude)) ? Number(data?.latitude) : null,
    longitude: Number.isFinite(Number(data?.longitude)) ? Number(data?.longitude) : null,
    priceFrom: Number.isFinite(Number(data?.priceFrom)) ? Number(data?.priceFrom) : null,
    priceCurrency: cleanText(data?.priceCurrency || ''),
    priceUnit: cleanText(data?.priceUnit || 'night'),
    priceNote: cleanText(data?.priceNote || ''),
    priceStatus: cleanText(data?.priceStatus || ''),
    sourceName: cleanText(data?.sourceName || ''),
    sourceUrl: cleanText(data?.sourceUrl || ''),
  };
};

const isPublicHotelRecord = (data?: Record<string, any> | null) => {
  if (!data || data.published !== true) return false;
  const approvalStatus = String(data.approvalStatus || data.status || "approved").toLowerCase();
  return approvalStatus !== "rejected" && approvalStatus !== "suspended";
};

const HotelDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const [openGallery, setOpenGallery] = useState(false);
  const [hotelData, setHotelData] = useState<any>(null);
  const [hotelNotFound, setHotelNotFound] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [thumbnailWindow, setThumbnailWindow] = useState(5);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const sectionActivationLockRef = useRef<string | null>(null);
  const sectionActivationLockTimerRef = useRef<number | null>(null);
  const { loading: authLoading, isAdmin } = useAuth();

  const hotelId = searchParams.get("id");
  const source = searchParams.get("source");
  const initialCheckInDate = searchParams.get("checkInDate") || "";
  const initialCheckOutDate = searchParams.get("checkOutDate") || "";
  const initialAdults = Number(searchParams.get("adults") || 2);
  const initialRooms = Number(searchParams.get("rooms") || 1);
  const initialChildren = Number(searchParams.get("children") || 0);
  const initialChildAges = searchParams.get("childAges") || "";
  const allowDirectDraftPreview = source === "manual" && Boolean(hotelId) && isAdmin;
  const isManualDraftRoute = source === "manual" && Boolean(hotelId);
  const sectionTabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "amenities", label: "Amenities" },
      { id: "rooms", label: "Rooms" },
      { id: "policies", label: "Policies" },
      { id: "faq", label: "FAQ" },
      { id: "reviews", label: "Reviews" },
    ],
    [],
  );

  useEffect(() => {
    const updateThumbnailWindow = () => {
      if (window.innerWidth < 576) {
        setThumbnailWindow(2);
      } else if (window.innerWidth < 768) {
        setThumbnailWindow(3);
      } else if (window.innerWidth < 992) {
        setThumbnailWindow(4);
      } else {
        setThumbnailWindow(5);
      }
    };

    updateThumbnailWindow();
    window.addEventListener("resize", updateThumbnailWindow);
    return () => window.removeEventListener("resize", updateThumbnailWindow);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const canRenderHotelRecord = (record: Record<string, any> | null | undefined) =>
      Boolean(record && (isPublicHotelRecord(record) || allowDirectDraftPreview));

    const loadHotel = async () => {
      if (!hotelId) {
        if (isMounted) {
          setHotelData(null);
          setHotelNotFound(true);
        }
        return;
      }

      if (isManualDraftRoute && authLoading) {
        return;
      }

      if (isManualDraftRoute && !isAdmin) {
        if (isMounted) {
          setHotelData(null);
          setHotelNotFound(true);
        }
        return;
      }

      try {
        if (allowDirectDraftPreview && typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }
        const data = await fetchHotelById(hotelId);
        if (isMounted && canRenderHotelRecord(data)) {
          setHotelData(data);
          setHotelNotFound(false);
          return;
        }
      } catch {
        // Fall through to list fetch.
      }

      try {
        const hotels = await fetchHotels();
        const matchedHotel = hotels.find((hotel) => hotel.id === hotelId);
        if (isMounted && matchedHotel && isPublicHotelRecord(matchedHotel)) {
          setHotelData(matchedHotel);
          setHotelNotFound(false);
          return;
        }
      } catch {
        // Ignore and show unavailable state below.
      }

      if (isMounted) {
        setHotelData(null);
        setHotelNotFound(true);
      }
    };

    loadHotel();

    return () => {
      isMounted = false;
    };
  }, [allowDirectDraftPreview, authLoading, hotelId, isAdmin, isManualDraftRoute]);

  const displayHotel = useMemo(() => normalizeHotelDetails(hotelData), [hotelData]);
  const isRenderableHotel = Boolean(displayHotel && hotelData && (isPublicHotelRecord(hotelData) || allowDirectDraftPreview));

  useEffect(() => {
    setActiveImageIndex(0);
    setThumbnailStartIndex(0);
    setShowFullDescription(false);
    setShowAllServices(false);
    setShowAllReviews(false);
    setActiveSection("overview");
  }, [displayHotel?.id]);

  useEffect(() => {
    if (!displayHotel) return;

    setActiveImageIndex((currentIndex) => Math.min(currentIndex, Math.max(displayHotel.gallery.length - 1, 0)));
    setThumbnailStartIndex((currentStartIndex) => {
      const maxStartIndex = Math.max(displayHotel.gallery.length - thumbnailWindow, 0);
      return Math.min(currentStartIndex, maxStartIndex);
    });
  }, [displayHotel, thumbnailWindow]);

  useEffect(() => {
    return () => {
      if (sectionActivationLockTimerRef.current != null) {
        window.clearTimeout(sectionActivationLockTimerRef.current);
        sectionActivationLockTimerRef.current = null;
      }
      sectionActivationLockRef.current = null;
    };
  }, [displayHotel]);

  useEffect(() => {
    if (!displayHotel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio || a.boundingClientRect.top - b.boundingClientRect.top);

        const nextSectionId = visible[0]?.target?.id;
        const lockedSectionId = sectionActivationLockRef.current;

        if (!nextSectionId) return;
        if (lockedSectionId && nextSectionId !== lockedSectionId) return;

        setActiveSection(nextSectionId);

        if (lockedSectionId === nextSectionId && sectionActivationLockTimerRef.current == null) {
          sectionActivationLockRef.current = null;
        }
      },
      { rootMargin: "-22% 0px -62% 0px", threshold: [0.1, 0.25, 0.5, 0.75] },
    );

    sectionTabs.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [displayHotel, sectionTabs]);

  const isPayNowHotel = Boolean(displayHotel && displayHotel.bookingMode === "pay_now");
  const availabilityPrice = isRenderableHotel && displayHotel
    ? formatHotelPrice(
        {
          priceFrom: displayHotel.priceFrom,
          priceCurrency: displayHotel.priceCurrency,
          priceUnit: displayHotel.priceUnit,
          priceNote: displayHotel.priceNote,
        },
        { prefix: "Starts From", fallbackLabel: isPayNowHotel ? "Price not configured yet" : "Price on request", includeFinalNote: !isPayNowHotel },
      )
    : { headline: "Price on request", note: undefined, hasPrice: false };
  const canSubmitPayNow = Boolean(displayHotel && isPayNowHotel && displayHotel.bookingEnabled !== false && availabilityPrice.hasPrice && displayHotel.priceCurrency);

  const breadcrumbs = [
    {
      label: "Hotel Details",
      active: false,
      link: routes.home1,
    },
    {
      label: "Hotel",
      active: false,
    },
    {
      label: "Hotel Details",
      active: true,
    },
  ];

  const activateSection = (sectionId: string) => {
    sectionActivationLockRef.current = sectionId;
    if (sectionActivationLockTimerRef.current != null) {
      window.clearTimeout(sectionActivationLockTimerRef.current);
    }
    sectionActivationLockTimerRef.current = window.setTimeout(() => {
      if (sectionActivationLockRef.current === sectionId) {
        sectionActivationLockRef.current = null;
      }
      sectionActivationLockTimerRef.current = null;
    }, 900);
    startTransition(() => {
      setActiveSection(sectionId);
    });
    scrollToSection(sectionId);
  };

  const mainImageCount = displayHotel?.gallery.length || 0;
  const canSlideMainImage = mainImageCount > 1;
  const canSlideThumbnails = mainImageCount > thumbnailWindow;
  const visibleThumbnails = displayHotel?.gallery.slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailWindow) || [];
  const descriptionPreview = displayHotel ? truncateText(displayHotel.description) : "";
  const hasLongDescription = Boolean(displayHotel && descriptionPreview !== displayHotel.description);
  const visibleAmenities = displayHotel?.amenities.slice(0, 9) || [];
  const visibleServices = displayHotel
    ? displayHotel.services.slice(0, showAllServices ? displayHotel.services.length : 18)
    : [];
  const serviceHasMore = Boolean(displayHotel && displayHotel.services.length > 18);
  const visibleReviews = displayHotel?.reviews.slice(0, showAllReviews ? 5 : 4) || [];
  const reviewHasMore = Boolean(displayHotel && displayHotel.reviews.length > 4);
  const visibleFaqItems = displayHotel
    ? displayHotel.faq.filter((item) => !/(\bprice\b|\bprix\b|\btarif\b|\bnuitée\b|\bnight\b)/i.test(item.question))
    : [];
  const hiddenPriceFaqCount = displayHotel ? displayHotel.faq.length - visibleFaqItems.length : 0;
  const nightsValue = (() => {
    const start = dayjs(initialCheckInDate);
    const end = dayjs(initialCheckOutDate);
    const diff = end.diff(start, "day");
    return Number.isFinite(diff) && diff > 0 ? diff : 1;
  })();
  const requestSummary = displayHotel
    ? [
        `Check-in: ${initialCheckInDate || "Confirmed after request"}`,
        `Check-out: ${initialCheckOutDate || "Confirmed after request"}`,
        `Nights: ${nightsValue}`,
        `Rooms: ${Math.max(1, initialRooms || 1)}`,
        `Adults: ${Math.max(1, initialAdults || 1)}`,
        `Children: ${Math.max(0, initialChildren || 0)}`,
        `${isPayNowHotel ? "Payable amount" : "Price reference"}: ${availabilityPrice.headline}${availabilityPrice.note ? ` · ${availabilityPrice.note}` : ""}`,
      ]
    : [];

  const updateActiveImage = (nextIndex: number) => {
    if (!displayHotel || displayHotel.gallery.length === 0) return;

    const totalImages = displayHotel.gallery.length;
    const resolvedIndex = ((nextIndex % totalImages) + totalImages) % totalImages;
    const maxStartIndex = Math.max(totalImages - thumbnailWindow, 0);
    let nextThumbnailStart = thumbnailStartIndex;

    if (resolvedIndex < thumbnailStartIndex) {
      nextThumbnailStart = resolvedIndex;
    } else if (resolvedIndex >= thumbnailStartIndex + thumbnailWindow) {
      nextThumbnailStart = resolvedIndex - thumbnailWindow + 1;
    }

    startTransition(() => {
      setActiveImageIndex(resolvedIndex);
      setThumbnailStartIndex(Math.max(0, Math.min(nextThumbnailStart, maxStartIndex)));
    });
  };

  return (
    <>
      <Breadcrumb title="Hotel Details" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
      <div className="content">
        <div className="container">
          {!isRenderableHotel || !displayHotel ? (
            authLoading && isManualDraftRoute ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
            <div className="alert alert-warning mb-0" role="alert">
              {hotelNotFound
                ? "This hotel is not available for this preview route right now."
                : "Hotel details are not available right now."}
            </div>
            )
          ) : (
            <div className="row g-4">
              <div className="col-xl-8">
                <div className="hotel-details-shell">
                  <div className="hotel-header-card border-bottom pb-4 mb-4">
                    <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
                      <div>
                        <h4 className="mb-2">{displayHotel.title}</h4>
                        <div className="hotel-meta-row">
                          <span><i className="isax isax-buildings me-2" />Hotel</span>
                          <span><i className="isax isax-location5 me-2" />{displayHotel.location}</span>
                          <button type="button" className="hotel-meta-link" onClick={() => scrollToSection("location")}>
                            View Location
                          </button>
                          {displayHotel.rating ? (
                            <span className="hotel-rating-pill">{displayHotel.rating}</span>
                          ) : null}
                          <button type="button" className="hotel-meta-link" onClick={() => scrollToSection("reviews")}>
                            {displayHotel.reviewsLabel || "No reviews yet"}
                          </button>
                        </div>
                      </div>
                      {displayHotel.roomInventoryText ? (
                        <span className="hotel-inventory-badge">{displayHotel.roomInventoryText}</span>
                      ) : null}
                    </div>

                    {displayHotel.highlightChips.length > 0 ? (
                      <div className="hotel-highlight-row">
                        {displayHotel.highlightChips.map((item) => (
                          <span className="hotel-highlight-chip" key={item}>
                            <i className="isax isax-tick-circle5" />
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="service-wrap vincci-gallery border-bottom pb-4 mb-4">
                    <div className="vincci-gallery-main">
                      {displayHotel.gallery[activeImageIndex] ? (
                        <ImageWithBasePath
                          src={displayHotel.gallery[activeImageIndex]}
                          className="img-fluid vincci-gallery-main-image"
                          alt={displayHotel.title}
                        />
                      ) : null}

                      {canSlideMainImage ? (
                        <>
                          <button
                            type="button"
                            className="vincci-gallery-arrow vincci-gallery-arrow-prev"
                            onClick={() => updateActiveImage(activeImageIndex - 1)}
                            aria-label="Previous image"
                          >
                            <i className="isax isax-arrow-left-2" />
                          </button>
                          <button
                            type="button"
                            className="vincci-gallery-arrow vincci-gallery-arrow-next"
                            onClick={() => updateActiveImage(activeImageIndex + 1)}
                            aria-label="Next image"
                          >
                            <i className="isax isax-arrow-right-3" />
                          </button>
                        </>
                      ) : null}

                      <button
                        type="button"
                        className="btn btn-white btn-xs view-btn vincci-gallery-see-all"
                        onClick={() => setOpenGallery(true)}
                      >
                        <i className="isax isax-image me-1" />
                        See All
                      </button>
                    </div>

                    <Lightbox
                      open={openGallery}
                      close={() => setOpenGallery(false)}
                      slides={displayHotel.gallery.map((src) => ({ src }))}
                      index={activeImageIndex}
                    />

                    <div className="vincci-gallery-thumbnails">
                      {canSlideThumbnails ? (
                        <button
                          type="button"
                          className="vincci-gallery-thumb-arrow"
                          onClick={() => setThumbnailStartIndex((current) => Math.max(0, current - 1))}
                          aria-label="Show previous thumbnails"
                        >
                          <i className="isax isax-arrow-left-2" />
                        </button>
                      ) : null}

                      <div className="vincci-gallery-thumb-track">
                        {visibleThumbnails.map((img, index) => {
                          const imageIndex = thumbnailStartIndex + index;
                          const isActive = imageIndex === activeImageIndex;

                          return (
                            <button
                              type="button"
                              className={`vincci-gallery-thumb ${isActive ? "is-active" : ""}`}
                              key={img}
                              onClick={() => updateActiveImage(imageIndex)}
                              aria-label={`View gallery image ${imageIndex + 1}`}
                            >
                              <ImageWithBasePath src={img} className="img-fluid" alt={`${displayHotel.title} ${imageIndex + 1}`} />
                            </button>
                          );
                        })}
                      </div>

                      {canSlideThumbnails ? (
                        <button
                          type="button"
                          className="vincci-gallery-thumb-arrow"
                          onClick={() =>
                            setThumbnailStartIndex((current) =>
                              Math.min(Math.max(mainImageCount - thumbnailWindow, 0), current + 1),
                            )
                          }
                          aria-label="Show more thumbnails"
                        >
                          <i className="isax isax-arrow-right-3" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="hotel-section-nav" aria-label="Hotel detail sections">
                    {sectionTabs.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`hotel-section-tab ${activeSection === item.id ? "is-active" : ""}`}
                        onClick={() => {
                          activateSection(item.id);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="border-bottom pb-4 mb-4 hotel-section-anchor" id="overview" tabIndex={-1}>
                    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-3">
                      <h5 className="mb-0 fs-18">Overview</h5>
                    </div>

                    {displayHotel.description ? (
                      <>
                        <p className="hotel-description-copy mb-3">
                          {showFullDescription ? displayHotel.description : descriptionPreview}
                        </p>
                        {hasLongDescription ? (
                          <button
                            type="button"
                            className="btn btn-link hotel-toggle-btn p-0"
                            onClick={() => setShowFullDescription((current) => !current)}
                          >
                            {showFullDescription ? "Show Less" : "Show More"}
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-muted mb-0">Description not available from the source record.</p>
                    )}
                  </div>

                  {displayHotel.highlights.length > 0 ? (
                    <div className="border-bottom pb-4 mb-4">
                      <h5 className="mb-3 fs-18">Highlights</h5>
                      <div className="hotel-highlights-grid">
                        {displayHotel.highlights.map((highlight) => (
                          <div className="highlight-box" key={highlight}>
                            <p className="mb-0 d-flex align-items-start">
                              <i className="isax isax-star-1 text-orange mt-1" />
                              <span>{highlight}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="border-bottom pb-2 mb-4" id="amenities" tabIndex={-1}>
                    <h5 className="mb-3 fs-18">Popular Amenities</h5>
                    <div className="row">
                      {visibleAmenities.map((amenity) => (
                        <div className="col-sm-6 col-lg-4" key={amenity}>
                          <div className="d-flex align-items-center mb-3">
                            <span className="avatar avatar-md bg-primary-transparent rounded-circle me-2">
                              <i className="isax isax-wind-2 fs-16"></i>
                            </span>
                            <p>{amenity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-bottom pb-2 mb-4 hotel-section-anchor" id="rooms" tabIndex={-1}>
                    <h5 className="mb-3 fs-18">Rooms</h5>
                    {displayHotel.roomTypes.length > 0 ? (
                      <div className="hotel-chip-cloud mb-3">
                        {displayHotel.roomTypes.map((roomType) => (
                          <span className="hotel-room-chip" key={roomType}>
                            {roomType}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-3">Room details will be confirmed after request.</p>
                    )}

                    <div className="card shadow-none border mb-0">
                      <div className="card-body">
                        <h6 className="fw-medium mb-2">Board options</h6>
                        {displayHotel.boardOptions.length > 0 ? (
                          <>
                            <p className="text-muted mb-3 mb-lg-2">Meal-plan options confirmed after request.</p>
                            <div className="hotel-chip-cloud">
                              {displayHotel.boardOptions.map((option) => (
                                <span className="hotel-room-chip hotel-room-chip-soft" key={option}>
                                  {option}
                                </span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-muted mb-0">Room and meal-plan options are confirmed after request.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-bottom pb-2 mb-4 hotel-section-anchor" id="availability" tabIndex={-1}>
                    <h5 className="mb-3 fs-18">Availability</h5>
                    <div className="card shadow-none border hotel-availability-card">
                      <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
                          <div>
                            <p className="fs-16 fw-medium mb-1">{availabilityPrice.headline}</p>
                            <p className="text-muted mb-0">
                              {isPayNowHotel
                                ? (canSubmitPayNow
                                  ? "Manual payment. Booking is confirmed after payment verification."
                                  : "Admin must add a price before payment can be submitted.")
                                : (availabilityPrice.note || "Final price and availability are confirmed after request")}
                            </p>
                          </div>
                          <span className="hotel-request-pill">{isPayNowHotel ? "Pay Now" : "Request-only"}</span>
                        </div>
                        <div className="hotel-request-summary-grid">
                          {requestSummary.map((item) => (
                            <div className="hotel-request-summary-item" key={item}>
                              {item}
                            </div>
                          ))}
                        </div>
                        <p className="mb-0 text-muted">
                          {isPayNowHotel
                            ? (canSubmitPayNow
                              ? "Manual payment. Booking is confirmed after payment verification."
                              : "This hotel is configured for Pay Now, but the payment price has not been added yet.")
                            : "This hotel is available by request only. We confirm room options and final pricing after you send your request."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-bottom pb-2 mb-4 hotel-section-anchor" id="services" tabIndex={-1}>
                    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-3">
                      <h5 className="mb-0 fs-18">Services</h5>
                      {serviceHasMore ? (
                        <button type="button" className="btn btn-link hotel-toggle-btn p-0" onClick={() => setShowAllServices((current) => !current)}>
                          {showAllServices ? "Show Less" : "Show All"}
                        </button>
                      ) : null}
                    </div>
                    <div className="row">
                      {visibleServices.map((service) => (
                        <div className="col-md-6 col-lg-4" key={service}>
                          <div className="d-flex align-items-center mb-3">
                            <span className="avatar avatar-md bg-primary-transparent rounded-circle me-2">
                              <i className="isax isax-verify fs-16"></i>
                            </span>
                            <p>{service}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {displayHotel.unavailableServiceNotes.length > 0 ? (
                      <p className="text-muted mb-0 hotel-service-notes">
                        Not available according to source: {displayHotel.unavailableServiceNotes.join(", ")}.
                      </p>
                    ) : null}
                  </div>

                  <div className="border-bottom pb-4 mb-4" id="policies" tabIndex={-1}>
                    <h5 className="mb-3 fs-18">Policies</h5>
                    <div className="card shadow-none mb-3">
                      <div className="card-body p-3">
                        <div className="hotel-policy-grid">
                          <div className="hotel-policy-item">
                            <p className="mb-1">Check In</p>
                            <h6>{displayHotel.checkInTime || "Confirmed after request"}</h6>
                          </div>
                          <div className="hotel-policy-item">
                            <p className="mb-1">Check Out</p>
                            <h6>{displayHotel.checkOutTime || "Confirmed after request"}</h6>
                          </div>
                          <div className="hotel-policy-item">
                            <p className="mb-1">Cancellation</p>
                            <h6>Confirmed after request</h6>
                          </div>
                          <div className="hotel-policy-item">
                            <p className="mb-1">Children / Pets / Smoking</p>
                            <h6>Confirmed after request</h6>
                          </div>
                        </div>
                        <p className="text-muted mb-0 mt-3">Detailed hotel policies are confirmed after request.</p>
                      </div>
                    </div>
                  </div>

                  {visibleFaqItems.length > 0 ? (
                    <div className="border-bottom pb-3 mb-4 hotel-section-anchor" id="faq" tabIndex={-1}>
                      <h5 className="mb-3 fs-18">Frequently Asked Questions</h5>
                      {hiddenPriceFaqCount > 0 ? (
                        <p className="text-muted mb-3">Price questions are confirmed after request.</p>
                      ) : null}
                      <div className="accordion faq-accordion" id="accordionFaq">
                        {visibleFaqItems.map((item, index) => {
                          const collapseId = `faq-item-${index}`;
                          const isFirst = index === 0;

                          return (
                            <div className="accordion-item mb-2" key={collapseId}>
                              <h2 className="accordion-header">
                                <button
                                  className={`accordion-button fw-medium ${isFirst ? "" : "collapsed"}`}
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target={`#${collapseId}`}
                                  aria-controls={collapseId}
                                >
                                  <span className="faq-question">{item.question}</span>
                                  <i className="isax isax-arrow-down-2 faq-toggle-icon" aria-hidden="true" />
                                </button>
                              </h2>
                              <div
                                id={collapseId}
                                className={`accordion-collapse collapse ${isFirst ? "show" : ""}`}
                                data-bs-parent="#accordionFaq"
                              >
                                <div className="accordion-body">
                                  <p className="mb-0">{item.answer}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="border-bottom pb-3 mb-4 hotel-section-anchor" id="reviews" tabIndex={-1}>
                    <h5 className="mb-3 fs-18">Reviews</h5>
                    {displayHotel.reviews.length > 0 ? (
                      <>
                        {displayHotel.reviewSummary ? <p className="text-muted mb-3">{displayHotel.reviewSummary}</p> : null}
                        {visibleReviews.map((review, index) => (
                          <div className="hotel-review-card mb-3" key={`${review.date || "review"}-${index}`}>
                            <div className="d-flex align-items-start gap-3">
                              <span className="hotel-review-icon">
                                <i className="isax isax-message-text-1" />
                              </span>
                              <div className="flex-grow-1">
                                <p className="mb-2">{review.text}</p>
                                {review.date ? <p className="text-muted fs-14 mb-0">{review.date}</p> : null}
                              </div>
                            </div>
                          </div>
                        ))}
                        {reviewHasMore ? (
                          <button type="button" className="btn btn-link hotel-toggle-btn p-0" onClick={() => setShowAllReviews((current) => !current)}>
                            {showAllReviews ? "Show Less" : "Show More"}
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-muted mb-0">No source-backed review details are available yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-xl-4">
                <StickyContent
                  hotel={{
                    ...displayHotel,
                    providerPhone: "",
                    providerEmail: "",
                    viewsCount: hotelData?.viewsCount,
                  } as any}
                  initialCheckInDate={initialCheckInDate}
                  initialCheckOutDate={initialCheckOutDate}
                  initialAdults={initialAdults}
                  initialRooms={initialRooms}
                  initialChildren={initialChildren}
                  initialChildAges={initialChildAges}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HotelDetails;

