import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Activity Title', type: 'text', required: true },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'duration', label: 'Duration', type: 'text' },
  { name: 'price', label: 'Price (USD)', type: 'number' },
  { name: 'oldPrice', label: 'Old Price', type: 'number' },
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
  location: '',
  duration: '',
  price: 0,
  oldPrice: 0,
  rating: 0,
  reviewsCount: 0,
  badge: 'Trending',
  description: '',
  image: '',
  gallery: [],
  featured: false,
  published: true,
};

const AdminActivities = () => (
  <AdminCatalogManager
    title="Activities Management"
    collectionName="activities"
    fields={fields}
    defaultItem={defaultItem}
  />
);

export default AdminActivities;
