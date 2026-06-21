# Manual Demo Checklist

Live site: [https://tour-tunisi.web.app/](https://tour-tunisi.web.app/)

Demo credentials are kept local only if they are generated or ensured by script. Passwords are not included here.

## Admin

- [ ] Log in as Admin.
- [ ] Open the admin dashboard.
- [ ] Open bookings.
- [ ] Review booking types.
- [ ] Confirm a booking.
- [ ] Cancel a booking.
- [ ] Open notifications.

## Agent

- [ ] Log in as Agent.
- [ ] Open the agent dashboard.
- [ ] Verify there are no permission console errors.
- [ ] Open booking requests.
- [ ] Verify only assigned bookings are visible.
- [ ] Open notifications.

## Customer

- [ ] Log in as Customer.
- [ ] Open the customer dashboard.
- [ ] Open bookings.
- [ ] Open notifications.
- [ ] Create or verify a booking flow from at least one public listing type.

## Public Visitor

- [ ] Open the homepage.
- [ ] Browse hotels.
- [ ] Browse tours.
- [ ] Browse chalets.
- [ ] Browse resorts.
- [ ] Browse activities.
- [ ] Browse cars.
- [ ] Open detail pages.
- [ ] Verify booking requires login when not signed in.

## Smoke Commands

- `npm run smoke:demo-login`
- `npm run smoke:agent-dashboard`
- `npm run smoke:booking-request-v1`
- `npm run smoke:booking-mirror-consistency`
- `npm run smoke:booking-notifications`
- `npm run smoke:booking-surface-qa`
- `npm run build`

## Deferred Items

- Payments and checkout are not implemented in this phase.
- Villas and apartments are deferred as future `propertyType` support.
- There is no unified lodging collection.
- Booking is request-based, not a paid reservation.
- Remaining production caveats are tracked in `PROJECT_STATUS.md`.
