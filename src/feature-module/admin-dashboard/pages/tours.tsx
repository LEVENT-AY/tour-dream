import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'type', label: 'Tour Type', type: 'text' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'price', label: 'Price (USD)', type: 'number' },
  { name: 'oldPrice', label: 'Old Price', type: 'number' },
  { name: 'rating', label: 'Rating', type: 'number' },
  { name: 'reviewsCount', label: 'Reviews Count', type: 'number' },
  { name: 'duration', label: 'Duration', type: 'text' },
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
  oldPrice: 0,
  rating: 0,
  reviewsCount: 0,
  duration: '',
  description: '',
  image: '',
  gallery: [],
  trending: false,
  featured: false,
  published: true,
};

const AdminTours = () => (
  <AdminCatalogManager title="Tours Management" collectionName="tours" fields={fields} defaultItem={defaultItem} />
);

export default AdminTours;
