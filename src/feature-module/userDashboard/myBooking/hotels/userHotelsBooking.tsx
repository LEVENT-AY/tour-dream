import CustomerBookingsPage from '../CustomerBookingsPage';

const UserHotelsBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Hotels"
    emptyMessage="No bookings yet"
    itemTypes={['hotel']}
  />
);

export default UserHotelsBooking;
