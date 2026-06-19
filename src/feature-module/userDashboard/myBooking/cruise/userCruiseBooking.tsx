import CustomerBookingsPage from '../CustomerBookingsPage';

const UserCruiseBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Cruise"
    emptyMessage="No bookings yet"
    itemTypes={['cruise']}
  />
);

export default UserCruiseBooking;
