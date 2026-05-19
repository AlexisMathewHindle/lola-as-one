# Stripe Payment And Webhook Proof Evidence

Status: current
Last updated: 2026-05-19
Parent workstream: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Audit source: source code, production Supabase table reachability, production Edge Function preflight, and checkout session cs_test_a1tK8xbzNzvW85xaecaK4Q4fgiz8yZXbnsXGYtsF7SnkB4RTs4izemO0rV

## Run Summary

| Check | Result |
|-------|--------|
| Overall status | green |
| Source checks | 12 |
| Source checks passed | 12 |
| Production table checks | 9 |
| Production table checks passed | 9 |
| Endpoint checks | 3 |
| Endpoint checks passed | 3 |
| Completed payment session checks | 8 |
| Completed payment session checks passed | 8 |
| Failed checks | 0 |
| Skipped checks | 0 |

## Source Hardening Checks

| Result | Check | Detail | Failure |
| --- | --- | --- | --- |
| passed | Webhook rejects invalid signatures | Stripe signatures are constructed and verification failures return 400. | - |
| passed | Webhook idempotency | Stripe event ID and checkout session ID duplicate guards are present. | - |
| passed | Subscription event isolation | Subscription checkout sessions do not create one-time event orders. | - |
| passed | Webhook persistence paths | Orders, order items, bookings, and attendee insert paths are present. | - |
| passed | Booking-trigger capacity decrement | Webhook creates bookings; the database trigger updates capacity once and mirrors current_bookings. | - |
| passed | Webhook email side effects | Customer receipt, admin notification, event confirmation email calls, gateway JWT invocation, fallback failure logging, and order-linked email metadata are present. | - |
| passed | Email failure logging | send-email writes failed email attempts to email_logs. | - |
| passed | Checkout return URLs | Checkout session uses app success and cancel URLs. | - |
| passed | Checkout event metadata | Line item and attendee metadata are available for webhook reconstruction. | - |
| passed | Capacity before Stripe | Capacity validation occurs before stripe.checkout.sessions.create. | - |
| passed | Order success recovery source | get-order-by-session returns order, booking, and attendee details. | - |
| passed | No secret-prefix logging | Stripe/webhook secret prefixes are not logged. | - |

## Production Table Checks

| Result | Check | Detail | Failure |
| --- | --- | --- | --- |
| passed | Production table: customers | id,email,stripe_customer_id | - |
| passed | Production table: orders | id,order_number,stripe_checkout_session_id,customer_email,status,total_gbp,created_at | - |
| passed | Production table: order_items | id,order_id,offering_id,item_type,quantity,total_price_gbp,event_date,event_start_time | - |
| passed | Production table: bookings | id,order_id,order_item_id,offering_event_id,number_of_attendees,status | - |
| passed | Production table: booking_attendees | id,booking_id,first_name,last_name | - |
| passed | Production table: event_capacity | id,offering_event_id,total_capacity,spaces_booked,spaces_available | - |
| passed | Production table: offering_events | id,current_bookings,max_capacity | - |
| passed | Production table: stripe_events | id,type,processed_at | - |
| passed | Production table: email_logs | id,template,recipient,status,sent_at,metadata | - |

## Endpoint Preflight Checks

| Result | Check | Detail | Failure |
| --- | --- | --- | --- |
| passed | Webhook rejects unsigned requests | Status 400 | - |
| passed | Webhook rejects invalid signatures | Status 400; no probe row written | - |
| passed | Checkout function preflight | Status 200 | - |

## Completed Payment Session Checks

| Result | Check | Detail | Failure |
| --- | --- | --- | --- |
| passed | Payment session order lookup | ORD-20260519-000833; paid; GBP 12 | - |
| passed | Payment session event order items | 1 event item(s) | - |
| passed | Payment session booking rows | 1 booking row(s) | - |
| passed | Payment session attendee rows | 1 attendee row(s) for 1 booked place(s) | - |
| passed | Payment session success-page recovery | ORD-20260519-000833; 1 booking row(s) | - |
| passed | Payment session capacity consistency | 1 event capacity row(s) consistent | - |
| passed | Payment session email logs | order-confirmation, event-booking-confirmation, new-order-admin sent | - |
| passed | Payment session stripe event log | 1 checkout.session.completed event(s) after order creation | - |

## Notes

- The safe preflight does not create a Stripe Checkout session and does not process a payment.
- A `cs_test_...` session is sandbox evidence only; it does not satisfy live Stripe launch proof.
- Email proof requires order-linked `email_logs` rows for the receipt, event booking confirmation, and admin notification with `status = 'sent'`.
- Live proof requires a deliberate completed live-mode Stripe checkout and rerun with `STRIPE_CHECKOUT_SESSION_ID=cs_live_...`.
- Sandbox replay/idempotency proof passed on 2026-05-19; live-mode replay/idempotency proof must be repeated after live Stripe cutover with a `cs_live_...` session.
