import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';

const fields: FieldConfig[] = [
  { name: 'name', label: 'Resort Name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'lat', label: 'Latitude', type: 'number' },
  { name: 'lng', label: 'Longitude', type: 'number' },
  { name: 'startingPrice', label: 'Starting Price (USD)', type: 'number' },
  { name: 'rating', label: 'Rating', type: 'number' },
  { name: 'amenities', label: 'Amenities', type: 'tags' },
  { name: 'mainImage', label: 'Main Image', type: 'image' },
  { name: 'gallery', label: 'Gallery Images', type: 'gallery' },
  { name: 'featured', label: 'Featured', type: 'checkbox' },
  { name: 'published', label: 'Published', type: 'checkbox' },
  { name: 'availability', label: 'Available', type: 'checkbox' },
];

const defaultItem = {
  name: '',
  description: '',
  location: '',
  lat: 0,
  lng: 0,
  startingPrice: 0,
  rating: 0,
  amenities: [],
  mainImage: '',
  gallery: [],
  featured: false,
  published: true,
  availability: true,
};

const AdminResorts = () => (
  <AdminCatalogManager title="Resorts Management" collectionName="resorts" fields={fields} defaultItem={defaultItem} resortModeration />
);

export default AdminResorts;
