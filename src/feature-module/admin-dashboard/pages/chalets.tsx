import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';

const fields: FieldConfig[] = [
  { name: 'name', label: 'Chalet Name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'capacity', label: 'Capacity (guests)', type: 'number' },
  { name: 'bedrooms', label: 'Bedrooms', type: 'number' },
  { name: 'bathrooms', label: 'Bathrooms', type: 'number' },
  { name: 'pricePerNight', label: 'Price Per Night (USD)', type: 'number' },
  { name: 'seasonalPricing', label: 'Seasonal Pricing Notes', type: 'textarea' },
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
  capacity: 0,
  bedrooms: 0,
  bathrooms: 0,
  pricePerNight: 0,
  seasonalPricing: '',
  amenities: [],
  mainImage: '',
  gallery: [],
  featured: false,
  published: true,
  availability: true,
};

const AdminChalets = () => (
  <AdminCatalogManager title="Chalets Management" collectionName="chalets" fields={fields} defaultItem={defaultItem} chaletModeration />
);

export default AdminChalets;
