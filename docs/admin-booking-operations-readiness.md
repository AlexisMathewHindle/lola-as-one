# Admin Booking Operations Readiness

Status: current
Last updated: 2026-05-19
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Evidence pack: [Admin Booking Operations Readiness Evidence](./admin-booking-operations-readiness-evidence.md)
Backfill evidence: [Admin Booking Attendee Backfill Evidence](./admin-booking-attendee-backfill-evidence.md)
Staff browser proof: [Admin Booking Staff Browser Proof](./admin-booking-staff-browser-proof.md)
Runbook: [Admin Booking Cancellation And Refund Runbook](./admin-booking-cancellation-refund-runbook.md)

## Purpose

This workstream proves that staff can operate event bookings from the admin app without opening Supabase directly.

The launch bar is that a paid event booking can be found, reconciled to its Stripe/order record, checked in on event day, cancelled where needed, and understood against live capacity.

## Scope

- Confirm `/admin/events/bookings` lists event bookings with useful category, status, date, and customer search filters.
- Confirm `/admin/bookings/:id` shows customer, event, attendee, booking, order, and cancellation information.
- Confirm booking detail links directly to the order detail route for payment reconciliation.
- Confirm `/admin/events/:id` shows event capacity, bookings, attendee rows, waitlist state, and a check-in route.
- Confirm `/admin/events/:id/checkin` can mark confirmed bookings checked in and undo check-in.
- Confirm `/admin/orders` includes event orders, not only product orders.
- Confirm `/admin/orders/:id` exposes payment status and a Stripe Dashboard link when Stripe payment data exists.
- Confirm the production Supabase schema contains all fields the admin booking UI writes, especially `bookings.checked_in` and `bookings.checked_in_at`.
- Confirm confirmed future bookings have linked order, event, capacity, and attendee records.
- Confirm capacity remains consistent between confirmed booking attendee totals, `event_capacity.spaces_booked`, and `offering_events.current_bookings`.

## Acceptance Criteria

- Staff can find a booking by customer, status, event date, or event category.
- Staff can open a booking and view attendee details, event details, booking status, and linked order/payment context.
- Staff can reconcile an event booking to the Supabase order and Stripe payment without SQL.
- Staff can check in attendees on event day from the admin UI.
- Staff can cancel a booking from admin, with capacity restored by the booking cancellation trigger.
- Any refund step that remains manual is documented as a Stripe/admin operational process.
- Admin order screens include event orders.
- Production Supabase has the booking check-in columns required by the UI.
- No future confirmed booking is missing an order, event, capacity row, or expected attendee rows.
- No capacity drift exists for launch/future events with confirmed bookings.

## Current Findings

- Automated production audit is green as of 2026-05-19: 0 P0 failures and 0 P1 failures.
- Source checks are green: the admin booking route set exists, booking list filters are present, booking detail/event detail/order detail are linked, check-in source exists, and event orders are no longer filtered out of the admin orders list.
- Production schema is now aligned for the audited admin workflow. `bookings.checked_in`, `bookings.checked_in_at`, and `booking_attendees.allergies` are selectable in production.
- The seven future confirmed bookings under `ORD-20260411-000810` that were missing attendee rows have been backfilled. The audit now confirms 8 future confirmed bookings have linked event, order, capacity, and attendee counts.
- Future capacity consistency is green: the audit found no future event capacity drift.
- Historical capacity drift exists on 44 past event records. This is documented as P2 cleanup unless any affected historical record is still public/bookable.
- Automated staff browser proof is green as of 2026-05-19 across mobile-sized `390x844` and desktop/tablet `1024x768` viewports. It proves staff can log in, search bookings, open booking detail, open/dismiss cancellation, inspect event detail, inspect check-in, search orders, open order detail, and reach the Stripe reconciliation link without opening Supabase.
- Admin cancellation updates `bookings.status`, `cancelled_at`, and `cancel_reason`. Capacity restoration is expected to be handled by the booking cancellation trigger.
- Refunds are not automated by the admin booking cancellation UI. The launch runbook documents the manual process: confirm policy/payment, refund in Stripe where required, cancel in admin, confirm capacity, and send customer communication.

## Required Next Steps

1. Run a short final smoke check on the actual venue device/browser before the first live event, using the same routes covered by the automated staff browser proof.
2. Decide whether to reconcile the 44 historical capacity drift records now or leave them as P2 cleanup because they do not affect future launch events.
3. Assign an owner for manual Stripe refunds until refund automation exists.

## Automation

Run the read-only audit:

```bash
node scripts/audit-admin-booking-operations-readiness.mjs
```

The audit writes:

- `docs/admin-booking-operations-readiness-evidence.md`
- `docs/admin-booking-attendee-backfill-evidence.md`

The audit checks:

- Admin source routes and workflow links.
- Production table column reachability.
- Future confirmed booking integrity.
- Capacity drift.
- Duplicate confirmed booking business keys.
- Event order visibility in sampled production order data.

Run the non-destructive staff browser proof:

```bash
ADMIN_STAFF_TEST_APP_URL=http://127.0.0.1:5173 \
ADMIN_STAFF_TEST_EMAIL=staff@example.com \
ADMIN_STAFF_TEST_PASSWORD=... \
node scripts/audit-admin-booking-staff-browser-proof.mjs
```

The proof writes:

- `docs/admin-booking-staff-browser-proof.md`

The proof does not confirm cancellation, does not toggle check-in, and does not capture screenshots because admin pages contain customer data.

## Open Launch Decisions

- Decide whether staff need a first-class no-show action before public launch or whether check-in reporting is enough for v1.
- Decide whether refund automation is required before launch. Current recommendation: manual Stripe refund is acceptable because the runbook now documents it, as long as an owner is named.
- Confirm who owns the final venue-device smoke check before the first live event.
- Confirm which staff roles will have admin access and how access is granted/revoked before launch.
