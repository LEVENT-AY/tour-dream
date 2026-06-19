import CustomerBookingsPage from '../CustomerBookingsPage';

const UserBusBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Bus"
    emptyMessage="No bookings yet"
    itemTypes={['bus']}
  />
);

export default UserBusBooking;
