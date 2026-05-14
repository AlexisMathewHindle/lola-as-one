# Event Cart And Checkout Readiness Evidence

Status: current
Last updated: 2026-05-14
Parent workstream: [Event Cart And Checkout Readiness](./event-cart-checkout-readiness.md)
Audit source: production Supabase, headless Chrome against http://127.0.0.1:5175, and source code checks

## Run Summary

| Check | Result |
|-------|--------|
| Future published event rows considered | 117 |
| Browser checks | 5 |
| Browser checks passed | 5 |
| Static backend checks | 8 |
| Static backend checks passed | 8 |
| Production table checks | 6 |
| Production table checks passed | 6 |
| Failed checks | 0 |

## Event Targets

| Surface | Title | Slug | Date | Spaces available | Capacity consistent |
| --- | --- | --- | --- | --- | --- |
| Standard detail | Matisse and Drawing with Scissors | matisse-and-drawing-with-scissors-thurs-4-8 | 2026-05-14 | 6 | yes |
| Adult listing | Hand-painted Fabric Wall Hangings | hand-painted-fabric-wall-hangings | 2026-05-14 | 6 | yes |
| Half-term listing | Open Studio (All Ages) World Art | ht_os_tues930 | 2026-05-26 | 4 | yes |

## Browser Cart And Checkout Checks

| Result | Check | Target | Detail | Failure |
| --- | --- | --- | --- | --- |
| passed | Standard detail add-to-cart | matisse-and-drawing-with-scissors-thurs-4-8 | Matisse and Drawing with Scissors x 1; series plus control | - |
| passed | Adult listing add-to-cart | /adult-workshops | Hand-painted Fabric Wall Hangings x 1 | - |
| passed | Half-term add-to-cart | /half-term | Open Studio (All Ages) World Art x 1 | - |
| passed | Checkout session payload | /checkout | Matisse and Drawing with Scissors x 2; attendees=2 | - |
| passed | Order success route | /order/success?session_id=cs_checkout_audit_missing | Finalising Your Order | - |

## Static Capacity And Webhook Checks

| Result | Check | Detail |
| --- | --- | --- |
| passed | Capacity validation before Stripe session | create-checkout-session validates inventory/capacity before stripe.checkout.sessions.create |
| passed | Over-capacity checkout block | create-checkout-session rejects carts whose event quantity exceeds spaces_available |
| passed | Checkout event metadata | checkout metadata carries line items and attendee arrays for webhook reconstruction |
| passed | Webhook idempotency | webhook tracks Stripe events and skips existing checkout sessions |
| passed | Webhook order and booking persistence | webhook contains order, order item, booking, and attendee insert paths |
| passed | Webhook capacity decrement | webhook calls decrement_event_capacity with event ID and attendee quantity |
| passed | Order success booking display | order success page reads session_id while get-order-by-session returns workshop and attendee details |
| passed | Cart event attendee storage | cart store persists event IDs and attendee lists |

## Production Table Checks

| Result | Table | Columns checked | Failure |
| --- | --- | --- | --- |
| passed | orders | id,stripe_checkout_session_id,customer_email,status | - |
| passed | order_items | id,order_id,offering_id,item_type,quantity,event_date,event_start_time | - |
| passed | bookings | id,order_id,order_item_id,offering_event_id,number_of_attendees,status | - |
| passed | booking_attendees | id,booking_id,first_name,last_name | - |
| passed | event_capacity | id,offering_event_id,total_capacity,spaces_booked,spaces_available | - |
| passed | stripe_events | id,type,processed_at | - |

## Notes

- The checkout payload browser check intercepts the Supabase Function request and returns a fake Stripe URL, so it does not create a real Stripe Checkout session.
- This audit proves frontend cart behavior, checkout payload construction, source-level capacity blocking before Stripe, webhook persistence paths, and production table reachability.
- A live Stripe test payment is still required before this workstream can be marked fully green.
