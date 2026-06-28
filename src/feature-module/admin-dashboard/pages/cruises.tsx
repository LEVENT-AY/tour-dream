import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';
import { DEFAULT_CURRENCY } from '../../../core/constants/tunisia';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'price', label: `Price (${DEFAULT_CURRENCY})`, type: 'number' },
  { name: 'rating', label: 'Rating', type: 'number' },
  { name: 'reviewsCount', label: 'Reviews Count', type: 'number' },
  { name: 'year', label: 'Year', type: 'text' },
  { name: 'guests', label: 'Guests', type: 'number' },
  { name: 'width', label: 'Width', type: 'text' },
  { name: 'speed', label: 'Speed', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'image', label: 'Main Image', type: 'image' },
  { name: 'gallery', label: 'Gallery Images', type: 'gallery' },
  { name: 'featured', label: 'Featured', type: 'checkbox' },
  { name: 'published', label: 'Published', type: 'checkbox' },
];

const defaultItem = {
  title: '',
  location: '',
  price: 0,
  rating: 0,
  reviewsCount: 0,
  year: '',
  guests: 0,
  width: '',
  speed: '',
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

const normalizeCruiseItem = (item: Record<string, any>): Record<string, any> => {
  return {
    ...item,
    title: String(item.title || '').trim(),
    location: String(item.location || '').trim(),
    price: parseSafeNumber(item.price, 0),
    rating: parseSafeNumber(item.rating, 0),
    reviewsCount: parseSafeInt(item.reviewsCount, 0),
    year: String(item.year || '').trim(),
    guests: parseSafeInt(item.guests, 0),
    width: String(item.width || '').trim(),
    speed: String(item.speed || '').trim(),
    description: String(item.description || '').trim(),
    image: String(item.image || '').trim(),
    gallery: Array.isArray(item.gallery) ? item.gallery.map((g: any) => String(g || '').trim()).filter(Boolean) : [],
  };
};

const validateCruiseItem = (item: Record<string, any>): string | null => {
  if (!item.title) return 'Title is required.';
  if (item.published !== false) {
    if (typeof item.price !== 'number' || Number.isNaN(item.price) || item.price <= 0) {
      return 'Price must be greater than 0 for published records.';
    }
    if (!item.location) {
      return 'Location is required for published records.';
    }
  }
  if (typeof item.rating === 'number' && !Number.isNaN(item.rating) && (item.rating < 0 || item.rating > 5)) {
    return 'Rating must be between 0 and 5.';
  }
  if (typeof item.reviewsCount === 'number' && !Number.isNaN(item.reviewsCount) && item.reviewsCount < 0) {
    return 'Reviews Count must be a non-negative number.';
  }
  return null;
};

const AdminCruises = () => (
  <AdminCatalogManager
    title="Cruises Management"
    collectionName="cruises"
    fields={fields}
    defaultItem={defaultItem}
    normalizeItem={normalizeCruiseItem}
    validateItem={validateCruiseItem}
  />
);

export default AdminCruises;
