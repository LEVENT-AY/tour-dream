const LISTING_LABELS: Record<string, string> = {
  hotel: 'Hotel',
  hotels: 'Hotel',
  tour: 'Tour',
  tours: 'Tour',
  chalet: 'Chalet',
  chalets: 'Chalet',
  resort: 'Resort',
  resorts: 'Resort',
  activity: 'Activity',
  activities: 'Activity',
  car: 'Car',
  cars: 'Car',
  flight: 'Flight',
  flights: 'Flight',
  cruise: 'Cruise',
  cruises: 'Cruise',
  bus: 'Bus',
  guide: 'Guide',
  visa: 'Visa',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  completed: 'Completed',
  rejected: 'Rejected',
};

export const formatListingType = (value?: string): string => {
  if (!value) return 'Booking';
  const normalized = String(value).toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (!normalized) return 'Booking';
  const direct = LISTING_LABELS[normalized] || LISTING_LABELS[normalized.replace(/\s+/g, '')];
  if (direct) return direct;
  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatBookingStatus = (value?: string): string => {
  if (!value) return 'Pending';
  const normalized = String(value).toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (!normalized) return 'Pending';
  return STATUS_LABELS[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const bookingStatusClass = (value?: string): string => {
  const normalized = String(value || 'pending').toLowerCase();
  if (normalized === 'pending') return 'bg-warning text-dark';
  if (normalized === 'contacted') return 'bg-info text-dark';
  if (normalized === 'confirmed') return 'bg-success';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'bg-danger';
  if (normalized === 'completed') return 'bg-primary';
  if (normalized === 'rejected') return 'bg-secondary';
  return 'bg-secondary';
};
