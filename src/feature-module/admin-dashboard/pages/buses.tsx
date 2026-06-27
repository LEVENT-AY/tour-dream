import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';
import { DEFAULT_CURRENCY } from '../../../core/constants/tunisia';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Bus Title', type: 'text', required: true },
  { name: 'departureCity', label: 'Departure City', type: 'text' },
  { name: 'arrivalCity', label: 'Arrival City', type: 'text' },
  { name: 'departureDate', label: 'Departure Date', type: 'text' },
  { name: 'departureTime', label: 'Departure Time', type: 'text' },
  { name: 'arrivalDate', label: 'Arrival Date', type: 'text' },
  { name: 'arrivalTime', label: 'Arrival Time', type: 'text' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'seats', label: 'Seats / Capacity', type: 'number', min: 0 },
  { name: 'price', label: `Price (${DEFAULT_CURRENCY})`, type: 'number', min: 0 },
  { name: 'currency', label: 'Currency', type: 'text' },
  { name: 'rating', label: 'Rating (0-5)', type: 'number', min: 0, max: 5 },
  { name: 'reviewsCount', label: 'Reviews Count', type: 'number', min: 0 },
  { name: 'badge', label: 'Badge', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'image', label: 'Main Image', type: 'image' },
  { name: 'gallery', label: 'Gallery Images', type: 'gallery' },
  { name: 'featured', label: 'Featured', type: 'checkbox' },
  { name: 'published', label: 'Published', type: 'checkbox' },
];

const defaultItem = {
  title: '',
  departureCity: '',
  arrivalCity: '',
  departureDate: '',
  departureTime: '',
  arrivalDate: '',
  arrivalTime: '',
  location: '',
  seats: 0,
  price: 0,
  currency: 'TND',
  rating: 0,
  reviewsCount: 0,
  badge: '',
  description: '',
  image: '',
  gallery: [],
  featured: false,
  published: true,
};

const ARABIC_TO_LATIN_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

const normalizeArabicDigits = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value)
    .trim()
    .split('')
    .map((char) => ARABIC_TO_LATIN_DIGITS[char] ?? char)
    .join('');
};

const parseSafeNumber = (value: unknown, fallback = 0): number => {
  const normalized = normalizeArabicDigits(value);
  if (normalized === '' || normalized === '.') return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseSafeInt = (value: unknown, fallback = 0): number => {
  const num = parseSafeNumber(value, fallback);
  return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : fallback;
};

const normalizeBusItem = (item: Record<string, any>): Record<string, any> => {
  const departureCity = String(item.departureCity || '').trim();
  const arrivalCity = String(item.arrivalCity || '').trim();
  const location = String(item.location || '').trim();

  const normalized: Record<string, any> = {
    ...item,
    title: String(item.title || '').trim(),
    departureCity,
    arrivalCity,
    departureDate: String(item.departureDate || '').trim(),
    departureTime: String(item.departureTime || '').trim(),
    arrivalDate: String(item.arrivalDate || '').trim(),
    arrivalTime: String(item.arrivalTime || '').trim(),
    location:
      location ||
      (departureCity && arrivalCity ? `${departureCity} → ${arrivalCity}` : departureCity || arrivalCity || ''),
    currency: String(item.currency || DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY,
    price: parseSafeNumber(item.price, 0),
    rating: parseSafeNumber(item.rating, 0),
    reviewsCount: parseSafeInt(item.reviewsCount, 0),
    seats: parseSafeInt(item.seats, 0),
    capacity: parseSafeInt(item.seats, 0),
    category: 'bus',
  };

  if (normalized.published === true) {
    normalized.approvalStatus = 'approved';
    normalized.status = 'approved';
    normalized.rejectionReason = '';
    normalized.rejectedReason = '';
  }

  return normalized;
};

const validateBusItem = (item: Record<string, any>): string | null => {
  if (!item.title) return 'Bus Title is required.';
  if (typeof item.price !== 'number' || Number.isNaN(item.price) || item.price <= 0) {
    return 'Price must be a valid number greater than 0.';
  }
  if (typeof item.rating !== 'number' || Number.isNaN(item.rating) || item.rating < 0 || item.rating > 5) {
    return 'Rating must be a number between 0 and 5.';
  }
  if (!Number.isInteger(item.reviewsCount) || item.reviewsCount < 0) {
    return 'Reviews Count must be a non-negative integer.';
  }
  if (!Number.isInteger(item.seats) || item.seats < 0) {
    return 'Seats / Capacity must be a non-negative integer.';
  }
  return null;
};

const AdminBuses = () => (
  <AdminCatalogManager
    title="Buses Management"
    collectionName="buses"
    fields={fields}
    defaultItem={defaultItem}
    normalizeItem={normalizeBusItem}
    validateItem={validateBusItem}
  />
);

export default AdminBuses;
