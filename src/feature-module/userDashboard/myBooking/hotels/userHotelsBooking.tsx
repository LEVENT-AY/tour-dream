import CustomerBookingsPage from '../CustomerBookingsPage';

const UserHotelsBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Lodging"
    emptyMessage="No bookings yet"
    itemTypes={['hotel', 'chalet', 'resort']}
  />
);

export default UserHotelsBooking;
