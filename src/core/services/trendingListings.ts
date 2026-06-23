import { all_routes } from "../../feature-module/router/all_routes";
import { getCategoryFallbackSrc } from "./firebaseStorage";
import {
  fetchActivities,
  fetchCars,
  fetchFlights,
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
  seatsLabel: string;
  airline: string;
  stopInfo: string;
  departureCity: string;
  arrivalCity: string;
  rating: string;
  reviewsLabel: string;
  price: string;
};

export type TrendingHotelCard = BaseCard & {
  rating: string;
  reviewsLabel: string;
  location: string;
  price: string;
  priceSuffix: string;
  facilitiesLabel: string;
  hostName: string;
  hostAvatar: string;
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

const resolveFeatured = (data: Record<string, any>) => data.featured === true;

const resolvePublished = (data: Record<string, any>) => data.published !== false && data.status !== "draft";

const buildFlightDetailsRoute = (itemId?: string) =>
  itemId ? `${all_routes.flightDetails}?id=${encodeURIComponent(itemId)}` : all_routes.flightDetails;

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

const mapFlightCard = (data: Record<string, any>, index: number): TrendingFlightCard => ({
  id: toStringValue(data.id, `flight-${index}`),
  title: toStringValue(data.title || data.flightName || data.airlineName || data.flightNumber, `Flight ${index + 1}`),
  image: resolveImage(data, "flights"),
  route: data.__fallback ? buildFlightDetailsRoute() : buildFlightDetailsRoute(toStringValue(data.id, "")),
  badge: toStringValue(data.badge || (data.featured ? "Trending" : ""), data.featured ? "Trending" : ""),
  featured: resolveFeatured(data),
  published: resolvePublished(data),
  seatsLabel: `${toNumberValue(data.seatsLeft ?? data.staffs, 0)} Seats Left`,
  airline: toStringValue(data.airline || data.airlineName, "Airline"),
  stopInfo: toStringValue(data.stopInfo || data.flightNumber || data.make, "Direct"),
  departureCity: toStringValue(data.departureCity || data.city || data.address, "Departure"),
  arrivalCity: toStringValue(data.arrivalCity || data.country, "Arrival"),
  rating: toStringValue(data.rating ?? 0, "0"),
  reviewsLabel: `${toNumberValue(data.reviewsCount, 0)} Reviews`,
  price: formatCurrency(data.price, 0),
});

const mapHotelCard = (data: Record<string, any>, index: number): TrendingHotelCard => ({
  id: toStringValue(data.id, `hotel-${index}`),
  title: toStringValue(data.title || data.name, `Hotel ${index + 1}`),
  image: resolveImage(data, "hotels"),
  route: data.__fallback ? all_routes.hotelDetails : `${all_routes.hotelDetails}?id=${encodeURIComponent(toStringValue(data.id, ""))}`,
  badge: toStringValue(data.badge || (data.featured ? "Trending" : ""), data.featured ? "Trending" : ""),
  featured: resolveFeatured(data),
  published: resolvePublished(data),
  rating: toStringValue(data.rating ?? data.starRating ?? 0, "0"),
  reviewsLabel: `(${toNumberValue(data.reviewsCount, 0)} Reviews)`,
  location: toStringValue(data.location || data.city || data.country, "Unknown location"),
  price: formatCurrency(data.price ?? data.pricePerNight, 0),
  priceSuffix: "/ Night",
  facilitiesLabel: toStringValue(data.facilitiesLabel, "Facilities"),
  hostName: toStringValue(data.hostName || data.ownerName || data.agentName, "Host"),
  hostAvatar: toStringValue(data.hostAvatar || "assets/img/users/user-08.jpg"),
});

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
  flights: [
    mapFlightCard(
      {
        id: "fallback-flight-1",
        title: "AstraFlight 215",
        airline: "Air Asia",
        departureCity: "Toronto",
        arrivalCity: "Bangkok",
        stopInfo: "1-stop at Frankfurt",
        seatsLeft: 214,
        rating: 5,
        reviewsCount: 21,
        price: 300,
        image: "assets/img/flight/flight-01.jpg",
        featured: true,
        published: true,
      },
      0
    ),
    mapFlightCard(
      {
        id: "fallback-flight-2",
        title: "Cloudrider 789",
        airline: "Indigo",
        departureCity: "Chicago",
        arrivalCity: "Melbourne",
        stopInfo: "1-stop at Frankfurt",
        seatsLeft: 45,
        rating: 5,
        reviewsCount: 21,
        price: 300,
        image: "assets/img/flight/flight-02.jpg",
        featured: true,
        published: true,
      },
      1
    ),
    mapFlightCard(
      {
        id: "fallback-flight-3",
        title: "Aether Express 901",
        airline: "Air India",
        departureCity: "Miami",
        arrivalCity: "Tokyo",
        stopInfo: "1-stop at Seoul",
        seatsLeft: 32,
        rating: 5,
        reviewsCount: 22,
        price: 450,
        image: "assets/img/flight/flight-03.jpg",
        featured: true,
        published: true,
      },
      2
    ),
    mapFlightCard(
      {
        id: "fallback-flight-4",
        title: "Silverwing 505",
        airline: "Emirates",
        departureCity: "Boston",
        arrivalCity: "Singapore",
        stopInfo: "1-stop at London",
        seatsLeft: 66,
        rating: 4.9,
        reviewsCount: 99,
        price: 700,
        image: "assets/img/flight/flight-04.jpg",
        featured: true,
        published: true,
      },
      3
    ),
  ],
  hotels: [
    mapHotelCard(
      {
        id: "fallback-hotel-1",
        title: "Hotel Plaza Athenee",
        location: "Ciutat Vella, Barcelona",
        rating: 5,
        reviewsCount: 400,
        price: 500,
        image: "assets/img/hotels/hotel-01.jpg",
        hostName: "Beth Will",
        hostAvatar: "assets/img/users/user-08.jpg",
        featured: true,
        published: true,
      },
      0
    ),
    mapHotelCard(
      {
        id: "fallback-hotel-2",
        title: "The Luxe Haven",
        location: "Oxford Street, London",
        rating: 4.7,
        reviewsCount: 360,
        price: 600,
        image: "assets/img/hotels/hotel-05.jpg",
        hostName: "Andrews",
        hostAvatar: "assets/img/users/user-09.jpg",
        featured: true,
        published: true,
      },
      1
    ),
    mapHotelCard(
      {
        id: "fallback-hotel-3",
        title: "The Urban Retreat",
        location: "Princes Street, Edinburgh",
        rating: 4.5,
        reviewsCount: 500,
        price: 500,
        image: "assets/img/hotels/hotel-06.jpg",
        hostName: "Robert",
        hostAvatar: "assets/img/users/user-10.jpg",
        featured: true,
        published: true,
      },
      2
    ),
    mapHotelCard(
      {
        id: "fallback-hotel-4",
        title: "Hotel Evergreen",
        location: "King's Road, Chelsea",
        rating: 4.3,
        reviewsCount: 380,
        price: 450,
        image: "assets/img/hotels/hotel-08.jpg",
        hostName: "Beth Williams",
        hostAvatar: "assets/img/users/user-11.jpg",
        featured: true,
        published: true,
      },
      3
    ),
  ],
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
  try {
    const [flights, hotels, cars, tours, activities] = await Promise.all([
      fetchFlights(),
      fetchHotels(),
      fetchCars(),
      fetchTours(),
      fetchActivities(),
    ]);

    return {
      flights: takeTrendingItems(flights, TRENDING_FALLBACK_DATA.flights).map(mapFlightCard),
      hotels: takeTrendingItems(hotels, TRENDING_FALLBACK_DATA.hotels).map(mapHotelCard),
      cars: takeTrendingItems(cars, TRENDING_FALLBACK_DATA.cars).map(mapCarCard),
      cruise: TRENDING_FALLBACK_DATA.cruise,
      tour: takeTrendingItems(tours, TRENDING_FALLBACK_DATA.tour).map(mapTourCard),
      activity: takeTrendingItems(activities, TRENDING_FALLBACK_DATA.activity).map(mapActivityCard),
      visa: TRENDING_FALLBACK_DATA.visa,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Trending listings fell back to static cards.", error);
    }
    return TRENDING_FALLBACK_DATA;
  }
}

export type { TrendingTabKey };
