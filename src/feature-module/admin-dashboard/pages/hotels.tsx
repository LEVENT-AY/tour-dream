import AdminCatalogManager, { type FieldConfig } from '../components/AdminCatalogManager';

const hasMojibake = (value: string) => /[ÃÂâ�]/.test(value);

const repairMojibake = (value: unknown) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text || !hasMojibake(text)) return text;
  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder('utf-8').decode(bytes).replace(/\u0000/g, '').trim();
  } catch {
    return text;
  }
};

const fields: FieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'type', label: 'Room Type', type: 'text' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'country', label: 'Country', type: 'text' },
  { name: 'address', label: 'Address', type: 'text' },
  { name: 'price', label: 'Price per Night (USD)', type: 'number' },
  { name: 'priceNote', label: 'Price Note', type: 'text' },
  { name: 'rating', label: 'Rating', type: 'number' },
  { name: 'reviewsCount', label: 'Reviews Count', type: 'number' },
  { name: 'badge', label: 'Badge', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'amenities', label: 'Amenities', type: 'tags' },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'whatsapp', label: 'WhatsApp', type: 'text' },
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
  city: '',
  country: 'Tunisia',
  address: '',
  price: 0,
  priceNote: '',
  rating: 0,
  reviewsCount: 0,
  badge: 'Trending',
  description: '',
  amenities: [],
  phone: '',
  whatsapp: '',
  image: '',
  gallery: [],
  trending: false,
  featured: false,
  published: true,
};

const AdminHotels = () => (
  <AdminCatalogManager
    title="Hotels Management"
    collectionName="hotels"
    fields={fields}
    defaultItem={defaultItem}
    normalizeItem={(item) => ({
      ...item,
      title: repairMojibake(item.title || item.name || ''),
      location: repairMojibake(item.location || ''),
      city: repairMojibake(item.city || ''),
      address: repairMojibake(item.address || ''),
      country: repairMojibake(item.country || 'Tunisia'),
      badge: repairMojibake(item.badge || ''),
      priceNote: repairMojibake(item.priceNote || ''),
      description: repairMojibake(item.description || ''),
      amenities: Array.isArray(item.amenities)
        ? item.amenities.filter(Boolean)
        : typeof item.amenities === 'string' && item.amenities.trim()
          ? item.amenities.split(',').map((value: string) => value.trim()).filter(Boolean)
          : [],
    })}
  />
);

export default AdminHotels;
