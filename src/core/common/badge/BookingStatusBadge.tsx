import type { Booking } from '../../services/firebaseServices';
import { bookingStatusClass, formatBookingStatus } from '../bookingDisplay';

interface BookingStatusBadgeProps {
  status?: Booking['status'];
}

const BookingStatusBadge = ({ status = 'pending' }: BookingStatusBadgeProps) => {
  return <span className={`badge rounded-pill ${bookingStatusClass(status)}`}>{formatBookingStatus(status)}</span>;
};

export default BookingStatusBadge;
