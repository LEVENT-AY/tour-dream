import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Car Title', type: 'text', required: true },
  { name: 'type', label: 'Car Type', type: 'text' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'fuel', label: 'Fuel Type', type: 'text' },
  { name: 'gear', label: 'Gear Type', type: 'text' },
  { name: 'travelled', label: 'Travelled (KM)', type: 'text' },
  { name: 'price', label: 'Price (USD)', type: 'number' },
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
  type: '',
  location: '',
  fuel: '',
  gear: '',
  travelled: '',
  price: 0,
  rating: 0,
  reviewsCount: 0,
  badge: 'Trending',
  description: '',
  image: '',
  gallery: [],
  featured: false,
  published: true,
};

const AdminCars = () => (
  <AdminCatalogManager title="Cars Management" collectionName="cars" fields={fields} defaultItem={defaultItem} />
);

export default AdminCars;
