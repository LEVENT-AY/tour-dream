import { bookingStatusClass, formatBookingStatus } from '../bookingDisplay';

export type BadgeStatus = 'pending' | 'contacted' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';

interface BookingStatusBadgeProps {
  status?: BadgeStatus;
}

const BookingStatusBadge = ({ status = 'pending' }: BookingStatusBadgeProps) => {
  return <span className={`badge rounded-pill ${bookingStatusClass(status)}`}>{formatBookingStatus(status)}</span>;
};

export default BookingStatusBadge;
