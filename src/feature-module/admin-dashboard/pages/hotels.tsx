import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'type', label: 'Room Type', type: 'text' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'price', label: 'Price per Night (USD)', type: 'number' },
  { name: 'rating', label: 'Rating', type: 'number' },
  { name: 'reviewsCount', label: 'Reviews Count', type: 'number' },
  { name: 'badge', label: 'Badge', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'image', label: 'Main Image', type: 'image' },
  { name: 'gallery', label: 'Gallery Images', type: 'gallery' },
  { name: 'trending', label: 'Trending', type: 'checkbox' },
  { name: 'featured', label: 'Featured', type: 'checkbox' },
  { name: 'published', label: 'Published', type: 'checkbox' },
];

const defaultItem = {
  title: '',
  type: '',
  location: '',
  price: 0,
  rating: 0,
  reviewsCount: 0,
  badge: 'Trending',
  description: '',
  image: '',
  gallery: [],
  trending: false,
  featured: false,
  published: true,
};

const AdminHotels = () => (
  <AdminCatalogManager title="Hotels Management" collectionName="hotels" fields={fields} defaultItem={defaultItem} />
);

export default AdminHotels;
