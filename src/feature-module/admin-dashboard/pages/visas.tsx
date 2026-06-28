import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';
import { DEFAULT_CURRENCY } from '../../../core/constants/tunisia';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Visa Title', type: 'text', required: true },
  { name: 'visaType', label: 'Visa Type', type: 'text' },
  { name: 'destination', label: 'Destination / Country', type: 'text' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'processingTime', label: 'Processing Time', type: 'text' },
  { name: 'requiredDocuments', label: 'Required Documents', type: 'textarea' },
  { name: 'serviceFee', label: `Service Fee (${DEFAULT_CURRENCY})`, type: 'number', min: 0 },
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
  visaType: '',
  destination: '',
  location: '',
  processingTime: '',
  requiredDocuments: '',
  serviceFee: 0,
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

const normalizeVisaItem = (item: Record<string, any>): Record<string, any> => {
  const normalized: Record<string, any> = {
    ...item,
    title: String(item.title || '').trim(),
    visaType: String(item.visaType || '').trim(),
    destination: String(item.destination || '').trim(),
    location: String(item.location || item.destination || item.country || '').trim(),
    country: String(item.country || item.destination || '').trim(),
    processingTime: String(item.processingTime || '').trim(),
    requiredDocuments: String(item.requiredDocuments || '').trim(),
    currency: String(item.currency || DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY,
    price: parseSafeNumber(item.price, 0),
    serviceFee: parseSafeNumber(item.serviceFee, 0),
    rating: parseSafeNumber(item.rating, 0),
    reviewsCount: parseSafeInt(item.reviewsCount, 0),
    category: 'visa',
  };

  if (normalized.published === true) {
    normalized.approvalStatus = 'approved';
    normalized.status = 'approved';
    normalized.rejectionReason = '';
    normalized.rejectedReason = '';
  }

  return normalized;
};

const validateVisaItem = (item: Record<string, any>): string | null => {
  if (!item.title) return 'Visa Title is required.';
  if (typeof item.price !== 'number' || Number.isNaN(item.price) || item.price < 0) {
    return 'Price must be a valid non-negative number.';
  }
  if (item.published !== false) {
    if (item.price <= 0) {
      return 'Price must be greater than 0 for published records.';
    }
    if (!item.destination && !item.location && !item.country) {
      return 'Destination / Country is required for published records.';
    }
  }
  if (typeof item.rating !== 'number' || Number.isNaN(item.rating) || item.rating < 0 || item.rating > 5) {
    return 'Rating must be a number between 0 and 5.';
  }
  if (!Number.isInteger(item.reviewsCount) || item.reviewsCount < 0) {
    return 'Reviews Count must be a non-negative integer.';
  }
  return null;
};

const AdminVisas = () => (
  <AdminCatalogManager
    title="Visas Management"
    collectionName="visas"
    fields={fields}
    defaultItem={defaultItem}
    normalizeItem={normalizeVisaItem}
    validateItem={validateVisaItem}
  />
);

export default AdminVisas;
