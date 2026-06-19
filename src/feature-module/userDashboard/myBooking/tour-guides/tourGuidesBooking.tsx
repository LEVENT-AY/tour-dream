import CustomerBookingsPage from '../CustomerBookingsPage';

const UserTourGuidesBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Tour Guides"
    emptyMessage="No bookings yet"
    forceEmpty
  />
);

export default UserTourGuidesBooking;
