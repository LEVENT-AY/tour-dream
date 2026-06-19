import CustomerBookingsPage from '../CustomerBookingsPage';

const UserTourBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Tour"
    emptyMessage="No bookings yet"
    itemTypes={['tour']}
  />
);

export default UserTourBooking;
