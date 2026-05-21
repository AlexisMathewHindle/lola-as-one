# Events Production Launch Epic

Status: current
Last updated: 2026-05-20
Production phase: events and workshops first on `https://www.lotsoflovelyart.com`

## Purpose

This epic defines the production-ready path for launching paid event and workshop bookings before the rest of the platform.

The launch goal is simple: a customer can find an event in `app/`, book the correct number of places, pay through Stripe Checkout, receive confirmation emails, and appear in the admin booking workflow with accurate capacity and attendee data.

This epic should be used as the first execution slice of the wider [Production Roadmap](./production-roadmap.md).

Final launch sign-off should use the [Events Pre-Launch Checklist](./events-pre-launch-checklist.md) and [Production Go-Live Checklist](./production-go-live-checklist.md). Google Analytics setup and verification is tracked in [Google Analytics Readiness](./google-analytics-readiness.md).

## Confirmed Direction

- `app/` is the production launch application.
- The customer-facing production domain is `https://www.lotsoflovelyart.com`.
- The app is currently hosted on the Netlify `lola-as-one` site and needs domain/DNS/HTTPS cutover before launch.
- `lola-workshops/` is not a production dependency after launch.
- Supabase is the final source of truth for events, bookings, customers, orders, capacity, and CMS data.
- Firebase is not required for the events production launch.
- Stripe Checkout is the payment path for paid event bookings.
- Event launch can remain guest-checkout first. Magic-link customer access can follow unless it becomes required for booking recovery or post-purchase self-service.
- About, Contact, FAQs, policy pages, and launch-critical event content should be CMS-driven where admin control is needed.
- Non-event products and subscriptions remain part of the wider launch roadmap, but they are not blockers for the first events production release unless shared checkout, Stripe, email, or data model code affects event bookings.
- Google Analytics should be implemented in the new `app/` before launch or explicitly deferred with owner sign-off. Current source search found no GA/GTM runtime wiring in `app/`.

## Shipped Foundations

These code paths and migrations already provide the foundation for the events-first launch.

Public event discovery and booking surfaces:

- `app/src/views/Workshops.vue`
- `app/src/views/AdultWorkshops.vue`
- `app/src/views/HolidayProgramPage.vue`
- `app/src/views/WorkshopDetail.vue`
- `app/src/components/workshops/WorkshopCalendar.vue`
- `app/src/components/JoinEventWaitlistModal.vue`
- `app/src/views/Cart.vue`
- `app/src/views/Checkout.vue`
- `app/src/views/OrderSuccess.vue`
- `app/src/views/CmsInfoPage.vue`

Admin operations:

- `app/src/views/admin/EventBookingsList.vue`
- `app/src/views/admin/EventDetails.vue`
- `app/src/views/admin/BookingDetails.vue`
- `app/src/views/admin/AttendeeCheckIn.vue`
- `app/src/views/admin/EventCategoriesList.vue`
- `app/src/views/admin/EventWaitlistList.vue`
- `app/src/views/admin/WaitlistDashboard.vue`
- `app/src/views/admin/WaitlistEntryDetails.vue`
- `app/src/views/admin/OrdersList.vue`

Backend and email:

- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/get-order-by-session/index.ts`
- `supabase/functions/send-email/index.ts`
- `supabase/functions/send-email/templates/order-confirmation.ts`
- `supabase/functions/send-email/templates/event-booking-confirmation.ts`
- `supabase/functions/send-email/templates/new-order-admin.ts`
- `supabase/functions/send-email/templates/event-reminder-7-days.ts`
- `supabase/functions/send-email/templates/event-reminder-24-hours.ts`
- `supabase/functions/send-email/templates/waitlist-event-available.ts`

Data and migrations:

- `docs/migrations/schema.sql`
- `supabase/migrations/20260208_fix_bookings_and_functions.sql`
- `supabase/migrations/20260408_sync_event_capacity_and_current_bookings.sql`
- `supabase/migrations/20260408_add_layout_key_to_event_categories.sql`
- `supabase/migrations/20260408_add_enquiry_only_layout_to_event_categories.sql`
- `supabase/migrations/20260409_create_site_cms_foundation.sql`
- `supabase/migrations/20260514_add_policy_info_pages.sql`
- `supabase/migrations/20260514_harden_event_capacity_rpcs.sql`
- `supabase/migrations/20260504_create_coupons.sql`
- `supabase/migrations/20260506_add_order_coupon_columns.sql`
- `scripts/audit-events-data-readiness.mjs`
- `scripts/fix-events-data-readiness-blockers.mjs`
- `scripts/upsert-cms-policy-pages.mjs`
- `scripts/verify-events-sql-rpc-readiness.mjs`

Email test coverage:

- `tests/email/test-event-booking.sh`
- `tests/email/test-event-reminders.sh`
- `tests/email/test-waitlist.sh`
- `tests/email/test-order-emails.sh`

## Epic Goal

Launch events to production with a complete booking operations loop:

1. Customers can browse published events by category and date.
2. Customers can view event details, remaining spaces, sold-out states, and waitlist availability.
3. Customers can add event places to cart with attendee information.
4. Stripe Checkout takes payment and returns customers to `app/`.
5. The Stripe webhook creates the order, order items, booking, booking attendees, and payment records.
6. Event capacity is decremented once per successful paid booking.
7. Customers receive a receipt and event booking confirmation.
8. Admins receive a new-order notification.
9. Admins can view, manage, and check in event bookings.
10. Waitlist and reminder notifications are either production-ready or explicitly deferred with owner sign-off.

## Non-Goals For This Phase

- Full product catalogue launch, except where product code shares checkout or webhook behavior that could break event bookings.
- Subscription checkout launch, except where Stripe webhook code paths share infrastructure.
- Full customer account launch, unless magic-link access becomes required for booking recovery, customer support, or booking history.
- Rebuilding or maintaining `lola-workshops/` as a production system.
- Firebase migration work beyond proving it is not required for the live events launch.

## Dependency Order

### 1. Event Data And CMS Readiness

Risk: critical
Depends on: none
Execution doc: [Events Data And CMS Readiness](./events-data-cms-readiness.md)
Current status: automated production audit, direct SQL/RPC verification, and automated admin UI edit proof are green on 2026-05-14 with 0 P0 blockers and 0 P1 blockers. Business/legal approval of seeded policy copy remains before this workstream is fully green.

Scope:

- Confirm the launch event catalogue in Supabase.
- Verify `offerings`, `offering_events`, `event_categories`, `event_capacity`, image storage records, slugs, status fields, and category layout settings.
- Confirm every launch event has date, start time, price, capacity, location, booking copy, cancellation policy, and published state.
- Remove or hide test, duplicate, draft, and stale event records from public surfaces.
- Confirm public read and admin write RLS policies work in the production Supabase project.
- Confirm CMS-managed copy for launch-critical event pages and policy links.

Acceptance criteria:

- Public pages only show events intended for launch.
- Every bookable event has an `offering_events` row and an `event_capacity` row.
- Capacity values are consistent between `event_capacity.spaces_booked` and `offering_events.current_bookings`.
- Admin can edit launch event content without direct database access.
- Supabase row counts and spot checks are documented before launch.

### 2. Public Discovery And Event Detail Flow

Risk: high
Depends on: Event Data And CMS Readiness
Execution doc: [Public Discovery And Event Detail Flow](./public-discovery-event-detail-flow.md)
Current status: green on 2026-05-14. Detail render audit, core category page spot checks, automated mobile/desktop screenshots, booking-state examples, and legacy route browser checks have passed.

Scope:

- Verify `/workshops`, `/adult-workshops`, holiday programme pages, and `/workshops/:slug`.
- Confirm category filters, date grouping, event cards, image loading, unavailable states, and empty states.
- Confirm event detail pages show accurate title, date, time, location, price, capacity, copy, and call to action.
- Confirm sold-out events do not allow checkout and route customers to waitlist where enabled.
- Confirm responsive behavior on mobile and desktop.
- Confirm legacy event URLs redirect to the correct `app/` route or a useful fallback.

Acceptance criteria:

- Customers can find all launch events from public navigation.
- No published launch event has a broken detail page, image, date, price, or booking action.
- Sold-out and enquiry-only events cannot be accidentally purchased.
- Legacy routes do not strand customers on the old app.

### 3. Event Cart And Checkout

Risk: critical
Depends on: Public Discovery And Event Detail Flow
Execution doc: [Event Cart And Checkout Readiness](./event-cart-checkout-readiness.md)
Current status: non-live automated audit is green on 2026-05-14. `scripts/audit-event-cart-checkout-readiness.mjs` passed 19/19 checks against production Supabase and a local `app/` build, covering public add-to-cart flows, checkout payload construction, capacity-before-Stripe checks, webhook persistence paths, order success recovery, and production table reachability. Live Stripe payment proof remains before this workstream is fully green.

Scope:

- Confirm event cart items include the correct `offering_event_id`, event title, date, time, quantity, unit price, and attendee payload.
- Confirm attendee details are collected and validated for every booked place.
- Confirm checkout validates customer name, email, attendee data, capacity, coupons, and totals before creating a Stripe session.
- Confirm event-only carts are production-ready.
- Decide whether mixed carts are allowed at events-first launch. If not, prevent mixed event/product checkout in the UI for launch.
- Confirm coupon behavior for event bookings, including event-only restrictions.
- Confirm failed validation gives customer-safe error messages.

Acceptance criteria:

- Customer cannot pay for an event without valid customer email and attendee details.
- Customer cannot start Stripe Checkout for more spaces than are available.
- Cart totals match Stripe Checkout totals.
- Stripe session metadata contains enough event and attendee data for the webhook to create bookings.
- Checkout returns to `/order/success?session_id={CHECKOUT_SESSION_ID}` in `app/`.

### 4. Stripe Payment And Webhook Booking Creation

Risk: critical
Depends on: Event Cart And Checkout
Execution doc: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Current status: sandbox-complete and cleaned up as of 2026-05-19. Hardened `create-checkout-session`, `stripe-webhook`, and `send-email` are deployed to Supabase project `hubbjhtjyubzczxengyo`. The completed `cs_test_...` proof created the order, order item, booking, attendee row, success-page recovery, capacity consistency, Stripe event log, and order-linked sent logs for `order-confirmation`, `event-booking-confirmation`, and `new-order-admin`. Earlier blockers were fixed: the webhook no longer double-counts capacity alongside the booking trigger, and protected `send-email` gateway auth now uses `FUNCTIONS_GATEWAY_JWT`, a neutral secret containing the anon JWT. Replay/idempotency proof passed on 2026-05-19: duplicate Stripe event delivery and duplicate Checkout Session delivery did not create duplicate business rows, capacity changes, or email sends. Sandbox proof cleanup passed on 2026-05-19: 9 proof bookings/orders were marked cancelled and 9 event spaces were restored across 3 event capacity rows with 0 capacity drift. Stripe is still in sandbox/test mode; before production go-live this must be repeated with live Stripe keys, live webhook endpoint signing secret, production app return URL, and a documented `cs_live_...` booking proof. Email Confirmations And Notifications operational readiness is deferred until missing email variables and sender/domain configuration are available. Admin Booking Operations automated audit and staff browser proof are green; the cancellation/refund runbook is current. A short venue-device smoke check remains before the first live event.

Scope:

- Confirm current Stripe environment is sandbox/test or live, and document the cutover state.
- Confirm production Stripe secrets in Supabase: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- Confirm `CHECKOUT_APP_URL` or `APP_URL` points to the production `app/` URL.
- Confirm the Stripe webhook endpoint is registered for `checkout.session.completed`.
- Confirm production webhook handling rejects invalid Stripe signatures.
- Confirm webhook idempotency using `stripe_events`.
- Confirm one successful event payment creates exactly one order, one order item per event line, one booking per event line, and the expected attendee rows.
- Confirm the confirmed-booking database trigger updates capacity exactly once per successful event booking.
- Confirm the active production capacity path does not double-count between webhook logic and database booking triggers.
- Confirm failed or replayed webhooks do not duplicate orders, bookings, attendees, or capacity changes.
- Confirm subscription webhook paths do not interfere with event order creation.

Acceptance criteria:

- A live-mode Stripe event booking can be tested end to end before launch.
- Sandbox/test-mode proof is clearly separated from live production proof.
- Invalid webhook signatures are rejected in production.
- Webhook retries are safe.
- Orders can be recovered from `get-order-by-session` on the success page.
- Payment failures, abandoned checkouts, and expired sessions do not create confirmed bookings.
- Operational logs are sufficient to trace a booking from Stripe session to Supabase order and admin screen.
- Customer/admin email logs are linked to the order number and Stripe Checkout Session ID and are `sent`.

### 5. Email Confirmations And Notifications

Risk: critical
Depends on: Stripe Payment And Webhook Booking Creation
Execution doc: [Email Confirmations And Notifications Readiness](./email-confirmations-notifications-readiness.md)
Current status: deferred. Sandbox order-linked sent email logs are proven, but production operational readiness is blocked until the missing email variables and sender/domain configuration are available.

Scope:

- Confirm production Resend secret: `RESEND_API_KEY`.
- Verify sender domain, from address, reply-to address, and deliverability setup.
- Confirm customer receives `order-confirmation` for the receipt.
- Confirm customer receives `event-booking-confirmation` for each booked event.
- Confirm admins receive `new-order-admin` with event details and attendee counts.
- Confirm notification failures are logged and do not cause duplicate booking creation.
- Confirm 7-day and 24-hour event reminders are either wired into a production scheduler or explicitly deferred.
- Confirm waitlist notification template `waitlist-event-available` is production-ready if waitlists are enabled.

Acceptance criteria:

- Customer receipt and event confirmation emails render correct event name, date, time, location, attendees, order number, and booking reference.
- Admin notification reaches all configured launch recipients.
- Email tests are run against the production-equivalent environment before launch.
- Reminder and waitlist notification ownership is documented before launch.

### 6. Admin Booking Operations

Risk: critical
Depends on: Stripe Payment And Webhook Booking Creation
Execution doc: [Admin Booking Operations Readiness](./admin-booking-operations-readiness.md)
Current status: automated audit and non-destructive staff browser proof are green as of 2026-05-19. Source/build checks are green after amending admin Orders to include event orders and adding order links from booking/event detail screens. The missing production check-in/allergy schema was applied, seven future confirmed bookings under `ORD-20260411-000810` were backfilled with attendee rows, and the production audit now has 0 P0/P1 failures. The staff browser proof covers booking search, booking detail, cancellation modal open/dismiss, event detail, check-in screen, order search, order detail, and Stripe reconciliation link across mobile and desktop/tablet viewports. Future capacity consistency is green; historical capacity drift is documented as P2 cleanup. The cancellation/refund runbook is current; refunds remain manual in Stripe until automation is built. A short smoke check on the actual venue device remains before the first live event.

Scope:

- Confirm admins can list event bookings by event, date, status, and customer.
- Confirm admins can open booking details and view customer, payment, attendee, and event data.
- Confirm check-in works for day-of-event operations.
- Confirm cancellation behavior is understood. If automated cancellation or refund is not complete, document the manual Stripe/admin process.
- Confirm event details show capacity, current bookings, and waitlist state accurately.
- Confirm staff can manage event categories and launch event presentation from admin.
- Confirm admin access is restricted to authorised roles.

Acceptance criteria:

- Staff can run a live event from admin without opening Supabase directly.
- Staff can reconcile Stripe payment, Supabase order, booking, and attendee records.
- Staff can handle booking support cases using documented admin steps.
- Admin booking screens work on the devices staff will use at the venue.

### 7. Waitlists, Sold-Out States, And Reminders

Risk: high
Depends on: Public Discovery And Event Detail Flow, Email Confirmations And Notifications

Scope:

- Confirm waitlist can be enabled per event where needed.
- Confirm sold-out events show a waitlist path rather than a booking path.
- Confirm waitlist entries are stored with enough customer and event context.
- Confirm admins can view and act on event waitlists.
- Confirm the trigger for notifying waitlisted customers when spaces become available.
- Confirm reminder timing, content, and scheduling ownership for 7-day and 24-hour reminders.

Acceptance criteria:

- Customers can join a waitlist for sold-out launch events when enabled.
- Waitlist entries are visible in admin.
- Waitlist emails are tested or explicitly deferred.
- Reminder emails are tested or explicitly deferred.

### 8. Production Deployment And Cutover

Risk: critical
Depends on: Event Data And CMS Readiness, Stripe Payment And Webhook Booking Creation, Email Confirmations And Notifications, Admin Booking Operations

Scope:

- Deploy `app/` as the production site.
- Confirm Netlify production environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_URL`.
- Confirm Supabase production secrets for Stripe, Resend, app URL, and service role access.
- Confirm all required Supabase migrations are applied to production.
- Confirm storage buckets and public image URLs work for event content.
- Confirm legacy app and Firebase are not runtime dependencies.
- Confirm redirects from legacy workshop/event URLs.
- Confirm rollback procedure for frontend deploy and Stripe webhook issues.

Acceptance criteria:

- Production build points only at production Supabase and production Stripe mode.
- No event launch flow depends on Firebase or `lola-workshops/`.
- Booking smoke test passes in production before public announcement.
- Rollback owner and procedure are documented.

## P0 Launch Blockers

These items block events going live:

- Production Supabase event data is incomplete or unverified.
- Public event detail pages show incorrect date, capacity, price, or booking state.
- Stripe Checkout cannot take a live event payment.
- Stripe webhook cannot create orders, bookings, attendees, and capacity updates reliably.
- Stripe webhook signature verification can be bypassed in production.
- Event capacity can be double-counted or skipped.
- Customer confirmation emails are not delivered.
- Admins cannot view or operate bookings.
- Production environment variables or Supabase secrets are missing.
- Firebase or `lola-workshops/` is still needed for any live booking workflow.

## P1 Before Public Announcement

These should be completed before announcing the event launch unless explicitly accepted:

- Legacy workshop/event redirects.
- Waitlist flow and waitlist emails for sold-out events.
- Event reminders or a documented manual reminder process.
- Venue staff check-in device QA.
- Customer support runbook for failed payment, missing email, cancellation, refund, duplicate booking, and capacity mismatch.
- Production monitoring checklist for Stripe, Supabase functions, Resend, and Netlify deploys.
- Google Analytics setup or explicit deferral with owner sign-off.

## P2 After Events Launch

These can follow after events are stable:

- Magic-link customer account access for booking history.
- Automated customer self-service for cancellations or booking changes.
- Advanced event analytics and attendance reporting.
- Deeper subscription and product launch work.
- Full platform launch polish beyond the event booking path.

## Production Smoke Test Matrix

| Scenario | Expected result |
|----------|-----------------|
| Browse launch workshops | Only published launch events appear with correct category, image, date, and price. |
| Open event detail | Event content, capacity, location, and booking CTA are correct. |
| Book one attendee | Stripe Checkout succeeds, order and booking are created, capacity decreases by 1. |
| Book multiple attendees | Booking attendee rows match the quantity and entered attendee details. |
| Attempt over-capacity booking | Checkout is blocked before Stripe session creation. |
| Sold-out event | Booking CTA is disabled and waitlist appears if enabled. |
| Coupon on event booking | Discount applies only when coupon rules allow events. |
| Stripe webhook replay | No duplicate order, booking, attendee, or capacity update is created. |
| Order success page | Customer sees the paid order and event booking details. |
| Customer emails | Receipt and event booking confirmation are delivered with correct details. |
| Admin email | New order notification is delivered to configured admin recipients. |
| Admin booking list | Booking appears with customer, event, status, and attendee count. |
| Admin booking detail | Booking detail shows order, payment, attendees, and event metadata. |
| Check-in | Staff can mark attendees checked in and see updated state. |
| Waitlist | Customer can join and admin can view the waitlist entry. |
| Legacy redirect | Old event/workshop URL lands on the correct `app/` route or useful fallback. |
| Google Analytics | GA4 page view and booking funnel events appear in Realtime or DebugView. |

## Go/No-Go Checklist

| Area | Required sign-off |
|------|-------------------|
| Event data | Launch event rows, dates, prices, capacity, slugs, images, and statuses are approved. |
| Public UX | Event discovery, event detail, cart, checkout, success, sold-out, and waitlist states are approved. |
| Stripe | Live-mode checkout and webhook booking creation are verified. |
| Email | Customer and admin emails are delivered and render correctly. |
| Admin | Booking list, booking detail, event detail, check-in, and waitlist screens are usable by staff. |
| Analytics | Google Analytics is implemented and verified, or explicitly deferred with owner sign-off. |
| Security | RLS and admin role access are checked for event, booking, attendee, order, and capacity tables. |
| Deployment | Netlify, Supabase, Stripe, Resend, storage, and redirects are configured for production. |
| Operations | Support runbook, rollback path, and monitoring checks exist. |

## Epic Definition Of Done

This epic is done when:

- A production smoke booking succeeds for a paid event.
- Supabase contains the correct order, order item, booking, attendee, payment, and capacity records.
- Customer receipt and event booking confirmation emails are delivered.
- Admin receives the booking notification.
- Staff can find and operate the booking in admin.
- Sold-out and waitlist behavior is verified.
- Google Analytics is verified or explicitly deferred.
- Production secrets, redirects, RLS, and rollback steps are documented.
- Any deferred event reminders, waitlist notifications, customer accounts, refunds, or subscriptions have explicit owner sign-off and are moved to the wider production roadmap.
