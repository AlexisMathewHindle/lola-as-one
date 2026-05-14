# Event Cart And Checkout Readiness

Status: current
Last updated: 2026-05-14
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Risk: critical
Depends on: [Public Discovery And Event Detail Flow](./public-discovery-event-detail-flow.md)

Current execution status: non-live automated audit is green on 2026-05-14. The audit passed 19/19 checks across browser cart flows, checkout payload interception, capacity-before-Stripe source checks, webhook persistence source checks, order success recovery, and production table reachability. A live Stripe payment remains the final proof before this workstream is fully green.

Current evidence:

- [Event Cart And Checkout Readiness Evidence](./event-cart-checkout-readiness-evidence.md)
- [Public Discovery And Event Detail Flow Evidence](./public-discovery-event-detail-flow-evidence.md)

## Purpose

This workstream proves that a customer can add launch events to cart, enter attendee details, proceed to Stripe Checkout with a correct event payload, and rely on the webhook to create durable order, booking, attendee, and capacity records after payment.

This is the first money-taking launch gate. It should stay separate from email delivery, because email depends on the booking/order records being correct first.

## Scope

- Verify event add-to-cart from `/workshops/:slug`.
- Verify event add-to-cart from `/adult-workshops`.
- Verify event add-to-cart from `/half-term`.
- Verify attendee quantity and cart line correctness.
- Verify checkout attendee fields match cart quantities.
- Verify checkout session payload includes event IDs, offering IDs, attendee details, customer details, totals, and policy-linked customer flow.
- Confirm capacity validation happens before Stripe session creation.
- Confirm over-capacity requests are blocked before payment.
- Confirm order success route exists and does not crash for a pending or missing session.
- Confirm webhook-created `orders`, `order_items`, `bookings`, and `booking_attendees` code paths.
- Confirm `decrement_event_capacity` is called by the webhook and capacity rows remain consistent after paid bookings.

## Acceptance Criteria

- A standard event can be added from `/workshops/:slug` with the selected attendee quantity.
- An adult workshop can be added from `/adult-workshops`.
- A half-term session can be added from `/half-term`.
- Event cart lines contain `type: event`, `event_id`, `offering_id`, title, price, date, time, quantity, and attendee data where collected.
- Checkout renders one attendee form per booked event place.
- Checkout blocks missing attendee/customer details before invoking Stripe.
- Checkout payload sent to `create-checkout-session` includes valid event line items and attendees.
- `create-checkout-session` validates event capacity before calling `stripe.checkout.sessions.create`.
- Over-capacity carts receive a clear error and do not create Stripe sessions.
- `stripe-webhook` idempotently creates order, order items, bookings, booking attendees, and decrements event capacity.
- Order success route can display paid event booking details after webhook processing.

## Shipped App And Backend Surfaces To Verify

Public app:

- `app/src/views/WorkshopDetail.vue`
- `app/src/views/AdultWorkshops.vue`
- `app/src/views/HolidayProgramPage.vue`
- `app/src/components/workshops/WorkshopContentSingleSeries.vue`
- `app/src/stores/cart.js`
- `app/src/views/Cart.vue`
- `app/src/views/Checkout.vue`
- `app/src/views/OrderSuccess.vue`

Backend:

- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `public.event_capacity`
- `public.orders`
- `public.order_items`
- `public.bookings`
- `public.booking_attendees`
- `public.stripe_events`
- `public.decrement_event_capacity`

Audit automation:

- `scripts/audit-event-cart-checkout-readiness.mjs`

## Delivery Stories

### Story 1: Add Events To Cart From Public Surfaces

Goal:

Customers can add every launch event type to cart from the public flow where it is presented.

Tasks:

- Add a standard event from `/workshops/:slug`.
- Add an adult workshop from `/adult-workshops`.
- Add a half-term event from `/half-term`.
- Verify local cart rows include event metadata and expected quantity.
- Verify cart UI labels event lines as workshops and directs customers to checkout.

Done when:

- Browser audit passes for all three add-to-cart surfaces.

### Story 2: Verify Attendees And Checkout Payload

Goal:

Checkout should collect the right attendee count and send the backend enough information to create bookings.

Tasks:

- Seed or add an event cart line with quantity greater than one.
- Verify checkout renders matching attendee inputs.
- Fill customer and attendee fields.
- Intercept the checkout function call in-browser without creating a real Stripe session.
- Verify payload includes event IDs, offering IDs, attendee names, customer details, and no unnecessary shipping for event-only carts.

Done when:

- Payload audit passes and no live Stripe session is created by the browser test.

### Story 3: Verify Capacity Blocking Before Stripe

Goal:

No over-capacity event cart should reach Stripe.

Tasks:

- Confirm `create-checkout-session` loads event capacity for each event line item.
- Confirm it rejects sold-out and over-capacity requests before calling `stripe.checkout.sessions.create`.
- Confirm public plus/select controls prevent obvious over-capacity selections where capacity is known.

Done when:

- Static code order and browser control checks pass.

### Story 4: Verify Paid Webhook Persistence

Goal:

After Stripe payment, the webhook must create the durable production records needed by customer service, admin, email, and capacity.

Tasks:

- Confirm webhook idempotency.
- Confirm order and order item inserts.
- Confirm event booking insert.
- Confirm attendee insert.
- Confirm `decrement_event_capacity` RPC call.
- Confirm relevant production tables are reachable.

Done when:

- Static webhook checks and production table checks pass.
- A later live Stripe test can be run without changing the audit criteria.

## Evidence Pack Template

| Evidence item | Required contents | Status |
|---------------|-------------------|--------|
| Browser cart audit | Standard detail, adult listing, half-term listing, checkout payload, order success route. | Done: 5/5 passed on 2026-05-14 |
| Capacity validation audit | Code-order proof that capacity blocks happen before Stripe session creation. | Done |
| Webhook persistence audit | Code proof for orders, order items, bookings, attendees, idempotency, and capacity decrement. | Done |
| Production table checks | Reachability checks for order, booking, attendee, capacity, and Stripe event tables. | Done: 6/6 passed |
| Live Stripe checkout proof | Test payment evidence including order, booking, attendee, capacity, success page, and webhook logs. | Pending |

## Go/No-Go Rule

This workstream is green only when browser cart/checkout tests pass, backend capacity/webhook checks pass, and a live Stripe test payment creates the expected Supabase records without capacity drift.
