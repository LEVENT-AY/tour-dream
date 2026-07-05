import { startTransition, useEffect, useMemo, useState } from "react";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import { useSearchParams } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import StickyContent from "./stickyContent";
import { formatHotelPrice } from "../../../core/common/hotelPricing";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
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

type TextCandidate = {
  field: string;
  value: unknown;
};

type SelectedText = {
  field: string;
  value: string;
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
  descriptionSourceField: string;
  image: string;
  gallery: string[];
  amenities: string[];
  roomTypes: string[];
  highlights: string[];
  highlightChips: string[];
  services: string[];
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

const selectPreferredText = (...candidates: TextCandidate[]): SelectedText => {
  for (const candidate of candidates) {
    const raw = normalizeText(candidate.value);
    if (!raw) continue;

    const repaired = cleanText(raw);
    if (repaired && !hasReplacementCharacter(repaired)) {
      return { field: candidate.field, value: repaired };
    }
  }

  return { field: "", value: "" };
};

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

  return [data?.image, data?.mainImage, data?.thumbnail]
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
      const [rawTitle, remainder = ""] = entry.split(/:\s*/, 2);
      const parsedItems = remainder
        .split(/\s*(?=\d+\.)/)
        .map((item) => item.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);

      return {
        title: rawTitle.replace(/\.$/, ""),
        items: parsedItems.length > 0 ? parsedItems : [entry],
      };
    });

const buildDescriptionLead = (data: Record<string, any>, title: string) => {
  const starRating = Number(data?.starRating);
  const region = cleanText(data?.region || "");
  const city = cleanText(data?.city || "");
  const normalizedCity = city.replace(/\bDjerba\b/i, "").replace(/\s+/g, " ").trim();

  if (!title || !Number.isFinite(starRating) || starRating <= 0) return "";
  if (!region && !normalizedCity) return "";

  const regionLabel = region ? `sur l'île de ${region.charAt(0).toUpperCase()}${region.slice(1)}` : "";
  const cityLabel = normalizedCity ? `dans la région de ${normalizedCity}` : "";
  const locationLabel = [regionLabel, cityLabel].filter(Boolean).join(", ");

  return locationLabel ? `Le ${title} est un hôtel ${starRating} étoiles situé ${locationLabel}.` : "";
};

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

  const descriptionSelection = selectPreferredText(
    { field: "description", value: data?.description },
    { field: "longDescription", value: data?.longDescription },
    { field: "details", value: data?.details },
    { field: "rawSource.detail.descriptionExtended", value: data?.rawSource?.detail?.descriptionExtended },
    { field: "rawSource.detail.description", value: data?.rawSource?.detail?.description },
  );

  const gallery = normalizeGallery(data);
  const image = firstTextValue(gallery[0]) || "";
  const title = cleanText(firstTextValue(data?.title, data?.name, data?.hotelName, data?.propertyName) || "");
  const descriptionLead = buildDescriptionLead(data, title);
  const description =
    descriptionLead &&
    descriptionSelection.value &&
    !/hôtel\s+\d+\s+étoiles/i.test(descriptionSelection.value)
      ? `${descriptionLead} ${descriptionSelection.value}`.trim()
      : descriptionSelection.value;
  const locationParts = normalizeUniqueStrings(data?.city, data?.location, data?.address);
  const location = locationParts[0] || cleanText(firstTextValue(data?.country) || "");
  const ratingValue = typeof data?.ratingValue === "number" ? data.ratingValue : Number(data?.ratingValue ?? data?.rating);
  const reviews = normalizeReviews(data?.reviews, data?.rawSource?.detail?.reviews);
  const reviewsCountValue = typeof data?.reviewsCount === "number" ? data.reviewsCount : Number(data?.reviewsCount);
  const highlights = normalizeUniqueStrings(data?.highlights);
  const nearbyLandmarks = normalizeUniqueStrings(
    data?.nearbyAttractions,
    data?.nearbyLandmarks,
    data?.landmarks,
    data?.rawSource?.detail?.nearbyAttractions,
  );
  const providerMessage = "DreamsTour will confirm availability and price after request.";

  return {
    id: typeof data?.id === "string" && data.id.trim() ? data.id : "",
    title,
    location,
    rating: Number.isFinite(ratingValue) && ratingValue > 0 ? String(ratingValue) : "",
    reviewsCount: Number.isFinite(reviewsCountValue) && reviewsCountValue > 0 ? reviewsCountValue : reviews.length,
    reviewsLabel:
      Number.isFinite(reviewsCountValue) && reviewsCountValue > 0
        ? `${reviewsCountValue} Reviews`
        : reviews.length > 0
          ? `${reviews.length} Reviews`
          : "",
    reviewSummary: cleanText(data?.reviewSummary || ""),
    description,
    descriptionSourceField: descriptionSelection.field,
    image,
    gallery,
    amenities: normalizeUniqueStrings(data?.amenities),
    roomTypes: normalizeUniqueStrings(data?.roomTypes, data?.rawSource?.detail?.roomTypes),
    highlights,
    highlightChips: buildHighlightChips(highlights),
    services: normalizeUniqueStrings(data?.services, data?.amenities, data?.rawSource?.detail?.services),
    nearbyLandmarks,
    nearbySections: formatNearbySections(nearbyLandmarks),
    faq: normalizeFaq(data?.faq, data?.rawSource?.detail?.faq),
    reviews,
    checkInTime: cleanText(data?.checkInTime || ""),
    checkOutTime: cleanText(data?.checkOutTime || ""),
    providerMessage,
    roomInventoryText: formatRoomInventoryText(cleanText(data?.roomInventoryText || ""), data?.roomCount),
    bookingMode: cleanText(data?.bookingMode || ""),
    bookingEnabled: data?.bookingEnabled === true,
    published: data?.published === true,
    latitude: Number.isFinite(Number(data?.latitude)) ? Number(data?.latitude) : null,
    longitude: Number.isFinite(Number(data?.longitude)) ? Number(data?.longitude) : null,
    priceFrom: Number.isFinite(Number(data?.priceFrom)) ? Number(data?.priceFrom) : null,
    priceCurrency: cleanText(data?.priceCurrency || ""),
    priceUnit: cleanText(data?.priceUnit || "night"),
    priceNote: cleanText(data?.priceNote || ""),
    priceStatus: cleanText(data?.priceStatus || ""),
    sourceName: cleanText(data?.sourceName || ""),
    sourceUrl: cleanText(data?.sourceUrl || ""),
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
  }, [displayHotel?.id]);

  useEffect(() => {
    if (!displayHotel) return;

    setActiveImageIndex((currentIndex) => Math.min(currentIndex, Math.max(displayHotel.gallery.length - 1, 0)));
    setThumbnailStartIndex((currentStartIndex) => {
      const maxStartIndex = Math.max(displayHotel.gallery.length - thumbnailWindow, 0);
      return Math.min(currentStartIndex, maxStartIndex);
    });
  }, [displayHotel, thumbnailWindow]);

  const availabilityPrice = isRenderableHotel && displayHotel
    ? formatHotelPrice(
        {
          priceFrom: displayHotel.priceFrom,
          priceCurrency: displayHotel.priceCurrency,
          priceUnit: displayHotel.priceUnit,
          priceNote: displayHotel.priceNote,
        },
        { prefix: "Starts From", fallbackLabel: "Price on request" },
      )
    : { headline: "Price on request", note: undefined, hasPrice: false };

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

  const mainImageCount = displayHotel?.gallery.length || 0;
  const canSlideMainImage = mainImageCount > 1;
  const canSlideThumbnails = mainImageCount > thumbnailWindow;
  const visibleThumbnails = displayHotel?.gallery.slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailWindow) || [];
  const descriptionPreview = displayHotel ? truncateText(displayHotel.description) : "";
  const hasLongDescription = Boolean(displayHotel && descriptionPreview !== displayHotel.description);

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

                  <div className="border-bottom pb-4 mb-4">
                    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-3">
                      <h5 className="mb-0 fs-18">Description</h5>
                      {displayHotel.descriptionSourceField ? (
                        <span className="hotel-source-note">Source field: {displayHotel.descriptionSourceField}</span>
                      ) : null}
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

                  <div className="border-bottom pb-2 mb-4">
                    <h5 className="mb-3 fs-18">Popular Amenities</h5>
                    <div className="row">
                      {displayHotel.amenities.slice(0, 9).map((amenity) => (
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

                  {displayHotel.roomTypes.length > 0 ? (
                    <div className="border-bottom pb-2 mb-4">
                      <h5 className="mb-3 fs-18">Room Types</h5>
                      <div className="row">
                        {displayHotel.roomTypes.map((roomType) => (
                          <div className="col-sm-6 col-lg-4" key={roomType}>
                            <div className="d-flex align-items-center mb-3">
                              <span className="avatar avatar-md bg-primary-transparent rounded-circle me-2">
                                <i className="isax isax-send-sqaure-2 fs-16"></i>
                              </span>
                              <p>{roomType}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="border-bottom pb-2 mb-4" id="availability">
                    <h5 className="mb-3 fs-18">Availability</h5>
                    <div className="card shadow-none border">
                      <div className="card-body">
                        <p className="fs-16 fw-medium mb-1">{availabilityPrice.headline}</p>
                        <p className="text-muted mb-2">
                          {availabilityPrice.note || "Final price and availability are confirmed after request"}
                        </p>
                        <p className="mb-0 text-muted">
                          This hotel is available by request only. We confirm room options and final pricing after you send your request.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-bottom pb-2 mb-4">
                    <h5 className="mb-3 fs-18">Services</h5>
                    <div className="row">
                      {displayHotel.services.map((service) => (
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
                  </div>

                  <div className="border-bottom pb-4 mb-4">
                    <h5 className="mb-3 fs-18">Hotel Rules</h5>
                    <div className="card shadow-none mb-3">
                      <div className="card-body p-3">
                        <h6 className="fw-medium mb-3">Check-In / Check-Out Policy</h6>
                        <div className="d-flex align-items-center flex-wrap">
                          <div className="d-flex align-items-center me-4 mb-3">
                            <i className="isax isax-clock fs-24 text-gray-9"></i>
                            <div className="ms-2">
                              <p className="mb-1">Check In</p>
                              <h6>{displayHotel.checkInTime || "Confirmed after request"}</h6>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-3">
                            <i className="isax isax-clock fs-24 text-gray-9"></i>
                            <div className="ms-2">
                              <p className="mb-1">Check Out</p>
                              <h6>{displayHotel.checkOutTime || "Confirmed after request"}</h6>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted mb-0">Detailed hotel policies are confirmed after request.</p>
                      </div>
                    </div>
                  </div>

                  {displayHotel.faq.length > 0 ? (
                    <div className="border-bottom pb-3 mb-4">
                      <h5 className="mb-3 fs-18">Frequently Asked Questions</h5>
                      <div className="accordion faq-accordion" id="accordionFaq">
                        {displayHotel.faq.map((item, index) => {
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
                                  {item.question}
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

                  <div className="border-bottom pb-3 mb-4" id="reviews" tabIndex={-1}>
                    <h5 className="mb-3 fs-18">Reviews</h5>
                    {displayHotel.reviews.length > 0 ? (
                      <>
                        {displayHotel.reviewSummary ? <p className="text-muted mb-3">{displayHotel.reviewSummary}</p> : null}
                        {displayHotel.reviews.slice(0, 6).map((review, index) => (
                          <div className="border rounded p-3 mb-3" key={`${review.date || "review"}-${index}`}>
                            <p className="mb-1">{review.text}</p>
                            {review.date ? <p className="text-muted fs-14 mb-0">{review.date}</p> : null}
                          </div>
                        ))}
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
