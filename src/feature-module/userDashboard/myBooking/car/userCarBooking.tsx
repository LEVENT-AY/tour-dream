import CustomerBookingsPage from '../CustomerBookingsPage';

const UserCarBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Cars"
    emptyMessage="No bookings yet"
    itemTypes={['car']}
  />
);

export default UserCarBooking;
