import CustomerBookingsPage from '../CustomerBookingsPage';

const UserFlightBooking = () => (
  <CustomerBookingsPage
    title="My Bookings"
    sectionLabel="Flights"
    emptyMessage="No bookings yet"
    itemTypes={['flight']}
  />
);

export default UserFlightBooking;
