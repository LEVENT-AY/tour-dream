import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Flight Title', type: 'text', required: true },
  { name: 'departureCity', label: 'Departure City', type: 'text' },
  { name: 'arrivalCity', label: 'Arrival City', type: 'text' },
  { name: 'airline', label: 'Airline', type: 'text' },
  { name: 'stopInfo', label: 'Stop Info', type: 'text' },
  { name: 'dates', label: 'Dates', type: 'text' },
  { name: 'price', label: 'Price (USD)', type: 'number' },
  { name: 'seatsLeft', label: 'Seats Left', type: 'number' },
  { name: 'rating', label: 'Rating', type: 'number' },
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
  airline: '',
  stopInfo: '',
  dates: '',
  price: 0,
  seatsLeft: 0,
  rating: 0,
  badge: 'Cheapest',
  description: '',
  image: '',
  gallery: [],
  featured: false,
  published: true,
};

const AdminFlights = () => (
  <AdminCatalogManager title="Flights Management" collectionName="flights" fields={fields} defaultItem={defaultItem} />
);

export default AdminFlights;
