import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';
import { DEFAULT_CURRENCY } from '../../../core/constants/tunisia';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Guide Title', type: 'text', required: true },
  { name: 'name', label: 'Guide Name', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'region', label: 'Region', type: 'text' },
  { name: 'country', label: 'Country', type: 'text' },
  { name: 'languages', label: 'Languages (comma separated)', type: 'text' },
  { name: 'specialties', label: 'Specialties (comma separated)', type: 'text' },
  { name: 'experienceYears', label: 'Experience Years', type: 'number', min: 0 },
  { name: 'availability', label: 'Availability', type: 'textarea' },
  { name: 'price', label: `Price (${DEFAULT_CURRENCY})`, type: 'number', min: 0 },
  { name: 'currency', label: 'Currency', type: 'text' },
  { name: 'rating', label: 'Rating (0-5)', type: 'number', min: 0, max: 5 },
  { name: 'reviewsCount', label: 'Reviews Count', type: 'number', min: 0 },
  { name: 'badge', label: 'Badge', type: 'text' },
  { name: 'image', label: 'Main Image', type: 'image' },
  { name: 'gallery', label: 'Gallery Images', type: 'gallery' },
  { name: 'featured', label: 'Featured', type: 'checkbox' },
  { name: 'published', label: 'Published', type: 'checkbox' },
];

const defaultItem = {
  title: '',
  name: '',
  description: '',
  location: '',
  city: '',
  region: '',
  country: '',
  languages: '',
  specialties: '',
  experienceYears: 0,
  availability: '',
  price: 0,
  currency: 'TND',
  rating: 0,
  reviewsCount: 0,
  badge: '',
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

const splitCommaList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const normalizeGuideItem = (item: Record<string, any>): Record<string, any> => {
  const normalized: Record<string, any> = {
    ...item,
    title: String(item.title || '').trim(),
    name: String(item.name || item.title || '').trim(),
    description: String(item.description || '').trim(),
    location: String(item.location || item.city || item.region || '').trim(),
    city: String(item.city || item.location || '').trim(),
    region: String(item.region || item.location || '').trim(),
    country: String(item.country || '').trim(),
    languages: splitCommaList(item.languages),
    specialties: splitCommaList(item.specialties),
    experienceYears: parseSafeInt(item.experienceYears, 0),
    availability: String(item.availability || '').trim(),
    currency: String(item.currency || DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY,
    price: parseSafeNumber(item.price, 0),
    rating: parseSafeNumber(item.rating, 0),
    reviewsCount: parseSafeInt(item.reviewsCount, 0),
    category: 'guide',
  };

  if (normalized.published === true) {
    normalized.approvalStatus = 'approved';
    normalized.status = 'approved';
    normalized.rejectionReason = '';
    normalized.rejectedReason = '';
  }

  return normalized;
};

const validateGuideItem = (item: Record<string, any>): string | null => {
  if (!item.title) return 'Guide Title is required.';
  if (typeof item.price !== 'number' || Number.isNaN(item.price) || item.price < 0) {
    return 'Price must be a valid non-negative number.';
  }
  if (typeof item.rating !== 'number' || Number.isNaN(item.rating) || item.rating < 0 || item.rating > 5) {
    return 'Rating must be a number between 0 and 5.';
  }
  if (!Number.isInteger(item.reviewsCount) || item.reviewsCount < 0) {
    return 'Reviews Count must be a non-negative integer.';
  }
  if (!Number.isInteger(item.experienceYears) || item.experienceYears < 0) {
    return 'Experience Years must be a non-negative integer.';
  }
  return null;
};

const AdminGuides = () => (
  <AdminCatalogManager
    title="Guides Management"
    collectionName="guides"
    fields={fields}
    defaultItem={defaultItem}
    normalizeItem={normalizeGuideItem}
    validateItem={validateGuideItem}
  />
);

export default AdminGuides;
