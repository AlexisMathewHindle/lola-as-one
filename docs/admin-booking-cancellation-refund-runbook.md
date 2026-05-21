# Admin Booking Cancellation And Refund Runbook

Status: current
Last updated: 2026-05-19
Parent workstream: [Admin Booking Operations](./admin-booking-operations-readiness.md)

## Purpose

This runbook defines the launch process for customer booking changes, cancellations, refunds, no-shows, and support reconciliation.

Important launch constraint: cancelling a booking in admin restores Supabase capacity, but it does not automatically refund Stripe. Refunds remain a manual Stripe operation until refund automation is built.

## Roles

| Role | Responsibility |
| --- | --- |
| Studio/admin staff | Find booking, confirm event/customer details, cancel booking where required, communicate with customer. |
| Payment owner | Process Stripe refund or partial refund where policy requires it. |
| Launch owner | Resolve capacity mismatches, duplicate bookings, failed webhook/email cases, and policy exceptions. |

## Customer Cancellation Before Event

1. Open `/admin/events/bookings`.
2. Search by customer name, customer email, event date, or status.
3. Open the booking detail page.
4. Confirm event title, event date/time, customer email, attendee count, allergy notes, and linked order.
5. Open the linked order and confirm payment status and Stripe payment intent.
6. Check the event cancellation/refund policy and decide whether refund, partial refund, transfer, credit, or no refund applies.
7. If money must be returned, open the Stripe payment from the order detail page and process the refund in Stripe.
8. Return to the booking detail page and click `Cancel Booking`.
9. Enter a short cancellation reason, including whether refund was processed manually in Stripe.
10. Confirm the event detail page capacity is restored by the attendee count.
11. Email the customer with the outcome and any refund timing.

## Staff-Initiated Cancellation

Use this when the studio cancels or changes an event.

1. Open the event detail page from `/admin/events/bookings` or `/admin/events/:id`.
2. Export or copy the affected customer list if needed.
3. For each paid booking, process the correct Stripe refund or transfer manually.
4. Cancel each booking in admin with a consistent reason.
5. Confirm event capacity after cancellations.
6. Send customer communication with replacement/refund details.
7. Record any special cases outside the app until a dedicated operational notes field exists.

## Refund-Only Adjustment

Use this when the booking remains active but a partial payment correction is needed.

1. Open the booking and linked order.
2. Confirm the customer, event, amount paid, and reason for adjustment.
3. Process the partial refund in Stripe.
4. Do not cancel the booking in admin if the customer is still attending.
5. Record the customer communication manually.

## No-Show

The current admin UI has a `no_show` status in filters, but no first-class no-show action on booking detail.

Launch process:

1. Use check-in to determine who attended.
2. Do not cancel no-shows, because cancellation restores capacity and changes booking state.
3. Record no-show notes manually outside the app if needed.
4. Add a dedicated no-show action as a post-launch improvement if staff need structured no-show reporting.

## Capacity Reconciliation

After any cancellation:

1. Open the event detail page.
2. Confirm `Capacity` has restored by the cancelled attendee count.
3. Confirm `Bookings` and attendee rows still match the expected operational state.
4. If capacity appears wrong, stop public booking for that event if needed and rerun `node scripts/audit-admin-booking-operations-readiness.mjs`.

## Failed Payment Or Missing Booking

If a customer paid but cannot be found in admin:

1. Search `/admin/orders` by order number, customer email, and Stripe payment ID if available.
2. Check Stripe for the Checkout Session and payment intent.
3. Check Supabase function/webhook logs for `stripe-webhook`.
4. Do not manually create capacity changes without confirming whether the webhook later completed.
5. Escalate to the launch owner.

## Duplicate Booking

If a customer has duplicate bookings:

1. Confirm whether both bookings have separate paid Stripe payments.
2. If one is accidental and refund-eligible, refund that payment in Stripe.
3. Cancel only the duplicate booking in admin.
4. Confirm capacity is correct after cancellation.

## Post-Launch Improvements

- Add an automated refund action tied to Stripe payment intent.
- Add structured operational notes on bookings and orders.
- Add a first-class no-show action.
- Add cancellation email templates once production email operations are green.
