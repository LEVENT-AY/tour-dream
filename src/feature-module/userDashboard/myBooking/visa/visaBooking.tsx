import CustomerBookingsPage from '../CustomerBookingsPage';

const UserVisaBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Visa"
    emptyMessage="No bookings yet"
    itemTypes={['visa']}
  />
);

export default UserVisaBooking;
