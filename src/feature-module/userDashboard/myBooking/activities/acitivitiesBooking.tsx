import CustomerBookingsPage from '../CustomerBookingsPage';

const UserAcitivitiesBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Activities"
    emptyMessage="No bookings yet"
    itemTypes={['activities']}
  />
);

export default UserAcitivitiesBooking;
