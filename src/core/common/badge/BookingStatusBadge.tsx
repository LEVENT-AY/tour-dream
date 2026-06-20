import type { Booking } from '../../services/firebaseServices';

interface BookingStatusBadgeProps {
  status?: Booking['status'];
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-warning text-dark',
  confirmed: 'bg-success',
  cancelled: 'bg-danger',
};

const BookingStatusBadge = ({ status = 'pending' }: BookingStatusBadgeProps) => {
  const normalized = String(status).toLowerCase();
  return <span className={`badge rounded-pill ${STATUS_CLASS[normalized] || 'bg-secondary'}`}>{normalized}</span>;
};

export default BookingStatusBadge;
