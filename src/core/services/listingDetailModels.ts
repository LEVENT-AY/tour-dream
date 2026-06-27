type AnyListing = Record<string, any>;
import { DEFAULT_CURRENCY } from '../constants/tunisia.ts';

const asString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
};

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asBoolean = (value: unknown): boolean => value === true;

export const isPublicListing = (data: AnyListing | null | undefined): boolean => {
  if (!data) return false;

  const published = asBoolean(data.published);
  const status = asString(data.approvalStatus || data.status, "").toLowerCase();

  if (!published) return false;
  if (!status) return true;

  return !["draft", "hidden", "rejected", "suspended", "unpublished", "inactive"].includes(status);
};

const normalizeGallery = (value: unknown, fallbackImage?: string): string[] => {
  const items = Array.isArray(value)
    ? value
        .map((item) => asString(item, ""))
        .filter(Boolean)
    : [];

  if (items.length > 0) {
    return Array.from(new Set(items));
  }

  return fallbackImage ? [fallbackImage] : [];
};

const resolveMainImage = (data: AnyListing, fallbackImage = ""): string => {
  return asString(
    data.mainImage || data.image || data.thumbnail || (Array.isArray(data.gallery) ? data.gallery[0] : ""),
    fallbackImage
  );
};

const resolveOwnerId = (data: AnyListing): string | null =>
  asString(data.ownerId || data.agentId || data.createdBy || data.userId || data.hostId || data.vendorId || "", "") || null;

const resolvePrice = (value: unknown, fallback = 0): number => asNumber(value, fallback);

const resolveReviews = (value: unknown, fallback = 0): number => asNumber(value, fallback);

export const normalizeTourDetails = (data: AnyListing) => {
  const image = resolveMainImage(data);
  const gallery = normalizeGallery(data.gallery, image);

  return {
    id: asString(data.id, ""),
    title: asString(data.title || data.name || data.tourName, "Tour Details"),
    name: asString(data.name || data.title || data.tourName, ""),
    image,
    mainImage: image,
    gallery,
    price: resolvePrice(data.price, 0),
    currency: asString(data.currency, DEFAULT_CURRENCY),
    rating: resolvePrice(data.rating, 0),
    reviewsCount: resolveReviews(data.reviewsCount, 0),
    location: asString(data.location || data.city || data.country, ""),
    duration: asString(data.duration || data.tripDuration, ""),
    category: asString(data.category || data.type || data.listingCategory, ""),
    badge: asString(data.badge || (data.featured ? "Trending" : ""), ""),
    description: asString(data.description, ""),
    dates: asString(data.dates || data.dateRange || "", ""),
    departure: asString(data.departure || data.departureCity || data.startLocation, ""),
    returnDate: asString(data.returnDate || data.endDate || "", ""),
    departureTime: asString(data.departureTime || "", ""),
    returnTime: asString(data.returnTime || "", ""),
    guests: asNumber(data.guests, 0),
    ownerId: resolveOwnerId(data),
    agentId: asString(data.agentId, ""),
    createdBy: asString(data.createdBy, ""),
    featured: data.featured === true,
    published: isPublicListing(data),
  };
};

export const normalizeCarDetails = (data: AnyListing) => {
  const image = resolveMainImage(data);
  const gallery = normalizeGallery(data.gallery, image);

  return {
    id: asString(data.id, ""),
    title: asString(data.title || data.name || data.carName, "Car Details"),
    name: asString(data.name || data.title || data.carName, ""),
    image,
    mainImage: image,
    gallery,
    price: resolvePrice(data.price, 0),
    currency: asString(data.currency, DEFAULT_CURRENCY),
    priceUnit: asString(data.priceUnit || data.billingUnit, "day"),
    rating: resolvePrice(data.rating, 0),
    reviewsCount: resolveReviews(data.reviewsCount, 0),
    location: asString(data.location || data.city || data.country, ""),
    type: asString(data.type || data.vehicleType || data.body, ""),
    fuel: asString(data.fuel || data.fuelType, ""),
    gear: asString(data.gear || data.transmission, ""),
    travelled: asString(data.travelled || data.mileage, ""),
    brand: asString(data.brand || data.make, ""),
    model: asString(data.model || "", ""),
    badge: asString(data.badge || (data.featured ? "Trending" : ""), ""),
    description: asString(data.description, ""),
    features: Array.isArray(data.features)
      ? data.features.map((item) => asString(item, "")).filter(Boolean)
      : [],
    ownerId: resolveOwnerId(data),
    agentId: asString(data.agentId, ""),
    createdBy: asString(data.createdBy, ""),
    featured: data.featured === true,
    published: isPublicListing(data),
  };
};

export const normalizeActivityDetails = (data: AnyListing) => {
  const image = resolveMainImage(data);
  const gallery = normalizeGallery(data.gallery, image);

  return {
    id: asString(data.id, ""),
    title: asString(data.title || data.name || data.activityName, "Activity Details"),
    name: asString(data.name || data.title || data.activityName, ""),
    image,
    mainImage: image,
    gallery,
    price: resolvePrice(data.price, 0),
    currency: asString(data.currency, DEFAULT_CURRENCY),
    rating: resolvePrice(data.rating, 0),
    reviewsCount: resolveReviews(data.reviewsCount, 0),
    location: asString(data.location || data.city || data.country, ""),
    duration: asString(data.duration || "", ""),
    category: asString(data.category || data.type || data.listingCategory, ""),
    badge: asString(data.badge || (data.featured ? "Trending" : ""), ""),
    description: asString(data.description, ""),
    ownerId: resolveOwnerId(data),
    agentId: asString(data.agentId, ""),
    createdBy: asString(data.createdBy, ""),
    featured: data.featured === true,
    published: isPublicListing(data),
  };
};

export const normalizeCruiseDetails = (data: AnyListing) => {
  const image = resolveMainImage(data);
  const gallery = normalizeGallery(data.gallery, image);

  return {
    id: asString(data.id, ""),
    title: asString(data.title || data.name || "Cruise Details", "Cruise Details"),
    name: asString(data.name || data.title || "", ""),
    image,
    mainImage: image,
    gallery,
    price: resolvePrice(data.price, 0),
    currency: asString(data.currency, DEFAULT_CURRENCY),
    rating: resolvePrice(data.rating, 0),
    reviewsCount: resolveReviews(data.reviewsCount, 0),
    location: asString(data.location || data.city || data.country, ""),
    duration: asString(data.duration || "", ""),
    category: asString(data.category || data.type || "cruise", "cruise"),
    badge: asString(data.badge || (data.featured ? "Trending" : ""), ""),
    description: asString(data.description, ""),
    ownerId: resolveOwnerId(data),
    agentId: asString(data.agentId, ""),
    createdBy: asString(data.createdBy, ""),
    featured: data.featured === true,
    published: isPublicListing(data),
  };
};


export const normalizeBusDetails = (data: AnyListing) => {
  const image = resolveMainImage(data);
  const gallery = normalizeGallery(data.gallery, image);

  return {
    id: asString(data.id, ""),
    title: asString(data.title || data.name || "Bus Details", "Bus Details"),
    name: asString(data.name || data.title || "", ""),
    image,
    mainImage: image,
    gallery,
    price: resolvePrice(data.price, 0),
    currency: asString(data.currency, DEFAULT_CURRENCY),
    rating: resolvePrice(data.rating, 0),
    reviewsCount: resolveReviews(data.reviewsCount, 0),
    location: asString(data.location || data.city || data.country, ""),
    departureCity: asString(data.departureCity || data.startLocation || data.from, ""),
    arrivalCity: asString(data.arrivalCity || data.endLocation || data.to, ""),
    departureDate: asString(data.departureDate || data.date || "", ""),
    departureTime: asString(data.departureTime || data.time || "", ""),
    arrivalDate: asString(data.arrivalDate || "", ""),
    arrivalTime: asString(data.arrivalTime || "", ""),
    seats: asNumber(data.seats || data.capacity, 0),
    capacity: asNumber(data.capacity || data.seats, 0),
    category: asString(data.category || data.type || "bus", "bus"),
    badge: asString(data.badge || (data.featured ? "Trending" : ""), ""),
    description: asString(data.description, ""),
    ownerId: resolveOwnerId(data),
    agentId: asString(data.agentId, ""),
    createdBy: asString(data.createdBy, ""),
    featured: data.featured === true,
    published: isPublicListing(data),
  };
};

export const normalizeVisaDetails = (data: AnyListing) => {
  const image = resolveMainImage(data);
  const gallery = normalizeGallery(data.gallery, image);

  return {
    id: asString(data.id, ""),
    title: asString(data.title || data.name || "Visa Details", "Visa Details"),
    name: asString(data.name || data.title || "", ""),
    image,
    mainImage: image,
    gallery,
    price: resolvePrice(data.price, 0),
    currency: asString(data.currency, DEFAULT_CURRENCY),
    rating: resolvePrice(data.rating, 0),
    reviewsCount: resolveReviews(data.reviewsCount, 0),
    location: asString(data.location || data.country || data.destination || "", ""),
    destination: asString(data.destination || data.country || data.location || "", ""),
    country: asString(data.country || data.destination || data.location || "", ""),
    visaType: asString(data.visaType || data.type || "", ""),
    processingTime: asString(data.processingTime || data.processing || "", ""),
    requiredDocuments: Array.isArray(data.requiredDocuments)
      ? data.requiredDocuments.map((item) => asString(item, "")).filter(Boolean)
      : typeof data.requiredDocuments === "string" && data.requiredDocuments.trim()
        ? [data.requiredDocuments.trim()]
        : [],
    serviceFee: asNumber(data.serviceFee, 0),
    category: asString(data.category || data.type || "visa", "visa"),
    badge: asString(data.badge || (data.featured ? "Trending" : ""), ""),
    description: asString(data.description, ""),
    ownerId: resolveOwnerId(data),
    agentId: asString(data.agentId, ""),
    createdBy: asString(data.createdBy, ""),
    featured: data.featured === true,
    published: isPublicListing(data),
  };
};

export const normalizeChaletDetails = (data: AnyListing) => {
  const image = resolveMainImage(data);
  const gallery = normalizeGallery(data.gallery, image);

  return {
    id: asString(data.id, ""),
    title: asString(data.title || data.name || "Chalet Details", "Chalet Details"),
    name: asString(data.name || data.title || "", ""),
    image,
    mainImage: image,
    gallery,
    price: resolvePrice(data.price || data.pricePerNight, 0),
    currency: asString(data.currency, DEFAULT_CURRENCY),
    rating: resolvePrice(data.rating, 0),
    reviewsCount: resolveReviews(data.reviewsCount, 0),
    location: asString(data.location || data.city || data.country, ""),
    description: asString(data.description, ""),
    propertyType: asString(data.propertyType || data.type || "chalet", "chalet"),
    amenities: Array.isArray(data.amenities)
      ? data.amenities.map((item) => asString(item, "")).filter(Boolean)
      : typeof data.amenities === "string" && data.amenities.trim()
        ? [data.amenities.trim()]
        : [],
    capacity: asNumber(data.capacity, 0),
    bedrooms: asNumber(data.bedrooms, 0),
    bathrooms: asNumber(data.bathrooms, 0),
    availability: data.availability,
    ownerId: resolveOwnerId(data),
    agentId: asString(data.agentId, ""),
    createdBy: asString(data.createdBy, ""),
    featured: data.featured === true,
    published: isPublicListing(data),
  };
};

export const normalizeResortDetails = (data: AnyListing) => {
  const image = resolveMainImage(data);
  const gallery = normalizeGallery(data.gallery, image);

  return {
    id: asString(data.id, ""),
    title: asString(data.title || data.name || "Resort Details", "Resort Details"),
    name: asString(data.name || data.title || "", ""),
    image,
    mainImage: image,
    gallery,
    price: resolvePrice(data.price || data.startingPrice, 0),
    currency: asString(data.currency, DEFAULT_CURRENCY),
    rating: resolvePrice(data.rating, 0),
    reviewsCount: resolveReviews(data.reviewsCount, 0),
    location: asString(data.location || data.city || data.country, ""),
    description: asString(data.description, ""),
    propertyType: asString(data.propertyType || data.type || "resort", "resort"),
    amenities: Array.isArray(data.amenities)
      ? data.amenities.map((item) => asString(item, "")).filter(Boolean)
      : typeof data.amenities === "string" && data.amenities.trim()
        ? [data.amenities.trim()]
        : [],
    availability: data.availability,
    ownerId: resolveOwnerId(data),
    agentId: asString(data.agentId, ""),
    createdBy: asString(data.createdBy, ""),
    featured: data.featured === true,
    published: isPublicListing(data),
  };
};

