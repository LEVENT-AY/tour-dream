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

const AdminCruises = () => (
  <AdminCatalogManager title="Cruises Management" collectionName="cruises" fields={fields} defaultItem={defaultItem} />
);

export default AdminCruises;
