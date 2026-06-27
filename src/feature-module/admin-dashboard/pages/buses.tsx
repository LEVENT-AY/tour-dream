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
  { name: 'seats', label: 'Seats / Capacity', type: 'number' },
  { name: 'price', label: `Price (${DEFAULT_CURRENCY})`, type: 'number' },
  { name: 'currency', label: 'Currency', type: 'text' },
  { name: 'rating', label: 'Rating', type: 'number' },
  { name: 'reviewsCount', label: 'Reviews Count', type: 'number' },
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

const AdminBuses = () => (
  <AdminCatalogManager title="Buses Management" collectionName="buses" fields={fields} defaultItem={defaultItem} />
);

export default AdminBuses;
