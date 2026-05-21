# Events Pre-Launch Checklist

Status: current
Last updated: 2026-05-20
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Production target: events and workshops first in `app/` on `https://www.lotsoflovelyart.com`
Go-live checklist: [Production Go-Live Checklist](./production-go-live-checklist.md)

## Purpose

This is the final pre-launch checklist for taking event bookings live. It consolidates the event data, public UX, checkout, Stripe, admin, deployment, analytics, and operational checks that must be signed off before public launch.

## Current Launch State

- Event Data And CMS Readiness: green, with business/legal copy approval still required where policy copy is seeded.
- Public Discovery And Event Detail Flow: green.
- Event Cart And Checkout: non-live automated audit green.
- Stripe Payment And Webhook Proof: sandbox-complete and cleaned up.
- Email Confirmations And Notifications: deferred until missing email variables and sender/domain configuration are available.
- Admin Booking Operations: automated audit green after applying production schema and backfilling seven future attendee rows; automated staff browser proof and cancellation/refund runbook are current. A short final smoke check on the actual venue device remains before the first live event.
- Stripe mode: sandbox/test. Live cutover and live-mode proof are still required before launch.
- Production URL: target is `https://www.lotsoflovelyart.com`; Netlify currently hosts the app under the `lola-as-one` site.
- Google Analytics: not yet wired in the `app/` codebase based on current source search. See [Google Analytics Readiness](./google-analytics-readiness.md).

## P0 Go-Live Blockers

These block the event launch.

- Launch event catalogue is approved in Supabase.
- Public event pages show only launch-approved events.
- Every bookable event has correct date, start time, price, capacity, location, booking copy, cancellation copy, image, slug, status, and category layout.
- `event_capacity.spaces_booked` matches `offering_events.current_bookings`.
- Public discovery, category pages, event detail pages, sold-out states, and booking CTAs are verified on desktop and mobile.
- Cart and checkout block invalid attendee data and over-capacity bookings before Stripe.
- Stripe live keys and live webhook endpoint signing secret are configured.
- Production app return URL is configured for Stripe Checkout.
- Live-mode event booking proof creates exactly one order, order item, booking, attendee set, capacity decrement, Stripe event log, and success-page record.
- Live-mode webhook replay/idempotency proof does not create duplicate business rows.
- Customer receipt and event booking confirmation emails are delivered from the production sender.
- Admin new-order email reaches all launch recipients.
- Admin staff can find and operate the booking without Supabase direct access.
- Deployment, rollback, redirects, RLS, and environment variables are checked.
- Google Analytics is configured or explicitly deferred with owner sign-off.

## P1 Before Public Announcement

These should be complete before announcing the launch unless explicitly accepted.

- Admin booking list, booking detail, event detail, and check-in flows have automated staff proof plus a final venue-device smoke check.
- Booking cancellation, no-show, refund, and support process is documented.
- Waitlist behavior is verified for sold-out events or explicitly deferred.
- Event reminder process is scheduled or explicitly manual/deferred.
- Resend sender domain and reply-to handling are confirmed.
- Google Analytics page views and booking funnel events are visible in GA4 DebugView or Realtime.
- Cookie/privacy copy covers analytics usage where required.
- Production monitoring owners are named for Stripe, Supabase Edge Functions, Resend, Netlify, and GA4.
- Launch rollback process is documented and known by the launch owner.

## P2 After Events Launch

These can follow after the events booking path is stable.

- Magic-link customer account access and booking history.
- Automated cancellation or customer self-service.
- Advanced event analytics and attendance reporting.
- Subscription checkout and fulfilment launch.
- Product catalogue and inventory launch beyond shared checkout risk.

## Data And CMS Checks

| Check | Required evidence | Status |
| --- | --- | --- |
| Launch catalogue | Row counts and spot checks in Supabase. | Done in Events Data And CMS Readiness |
| Event capacity | `spaces_booked` and `current_bookings` match. | Done; recheck before live launch |
| Stale/test records | Hidden from public surfaces. | Done; recheck before live launch |
| CMS policy pages | FAQs, privacy policy, terms, cancellation/refund links available. | Done; business/legal approval pending |
| Images | Featured images and category images load from storage. | Done; spot check before launch |
| Admin edit path | Admin can edit event/category/capacity data without direct SQL. | Done |

## Public UX Checks

| Check | Required evidence | Status |
| --- | --- | --- |
| Category pages | `/workshops`, `/adult-workshops`, `/half-term`, `/summer-holiday` render. | Done |
| Event detail pages | All published launch event slugs render. | Done |
| Mobile layout | No broken text, CTAs, date selectors, or card overflow. | Done; spot check before launch |
| Sold-out state | Booking disabled, waitlist shown when enabled. | Needs final launch spot check |
| Legacy URLs | Old workshop/event URLs redirect or fall back cleanly. | Done |

## Checkout And Stripe Checks

| Check | Required evidence | Status |
| --- | --- | --- |
| Add to cart | Correct event ID, title, date, time, price, quantity, attendees. | Done in non-live audit |
| Capacity before Stripe | Over-capacity requests blocked before Checkout Session creation. | Done in non-live audit |
| Sandbox payment proof | `cs_test_...` proof created order, booking, attendee, capacity, emails. | Done |
| Replay/idempotency proof | Duplicate delivery did not duplicate business rows. | Done |
| Sandbox cleanup | Proof bookings/orders cancelled, capacity restored. | Done |
| Live payment proof | `cs_live_...` proof creates correct production records. | Pending |
| Live replay proof | Duplicate live delivery does not duplicate business rows. | Pending |

## Email Checks

| Check | Required evidence | Status |
| --- | --- | --- |
| `RESEND_API_KEY` | Production secret exists and works. | Deferred |
| Sender domain | Production from address replaces `onboarding@resend.dev`. | Deferred |
| Admin recipients | `ADMIN_EMAILS` confirmed. | Deferred |
| Customer receipt | `order-confirmation` delivered and rendered. | Sandbox proven; production deferred |
| Event confirmation | `event-booking-confirmation` delivered and rendered. | Sandbox proven; production deferred |
| Admin notification | `new-order-admin` delivered to launch recipients. | Sandbox proven; production deferred |
| Reminders | 7-day and 24-hour scheduler or manual process documented. | Deferred |
| Waitlist emails | Trigger and owner confirmed if waitlists ship. | Deferred |

## Admin Operations Checks

| Check | Required evidence | Status |
| --- | --- | --- |
| Booking list | Staff can filter by event, date, status, and customer. | Automated staff browser proof green |
| Booking detail | Staff can see order, payment, attendee, customer, and event data. | Automated staff browser proof green |
| Event detail | Staff can see capacity, current bookings, waitlist state. | Automated staff browser proof green |
| Check-in | Staff can operate attendee check-in on venue device. | Automated proof confirms check-in UI; final venue-device smoke check pending |
| Cancellation/no-show | Staff process is tested and documented. | Runbook current; refunds remain manual in Stripe |
| Stripe/Supabase reconciliation | Staff can trace from Stripe session to order and booking. | Automated staff browser proof green |

## Google Analytics Checks

| Check | Required evidence | Status |
| --- | --- | --- |
| GA4 property | Measurement ID confirmed. | Pending |
| App config | `VITE_GA_MEASUREMENT_ID` or equivalent production env var set. | Pending |
| Runtime wiring | GA script or Google Tag Manager loaded in `app/`. | Pending |
| Route tracking | SPA route changes send page views. | Pending |
| Funnel events | Event view, add to cart, begin checkout, purchase/success tracked. | Pending |
| Privacy/cookies | Analytics consent/privacy approach approved. | Pending |
| Verification | GA4 DebugView or Realtime confirms events. | Pending |

## Deployment Checks

| Check | Required evidence | Status |
| --- | --- | --- |
| Production domain | `www.lotsoflovelyart.com` is connected to the Netlify `lola-as-one` site with HTTPS. | Pending |
| Canonical redirect | `lotsoflovelyart.com` redirects or aliases cleanly to `www.lotsoflovelyart.com`. | Pending |
| Netlify production env | App uses production Supabase and live Stripe return URL. | Pending live cutover |
| Checkout app URL | Supabase `CHECKOUT_APP_URL` or `APP_URL` is `https://www.lotsoflovelyart.com`. | Pending live cutover |
| Supabase secrets | Stripe, Resend, app URL, gateway auth, email vars verified. | Partially done |
| Supabase functions | `create-checkout-session`, `stripe-webhook`, `send-email`, `get-order-by-session` deployed. | Done for sandbox proof |
| RLS/security | Public reads and admin writes verified for event launch tables. | Done; recheck before launch |
| Redirects | Legacy workshop/event redirects verified. | Done |
| Rollback | Owner and rollback steps documented. | Pending |

## Launch Smoke Test

| Scenario | Expected result |
| --- | --- |
| Browse launch event categories | Only launch-approved events appear. |
| Open event detail | Event copy, date, time, capacity, location, price, and CTA are correct. |
| Add one attendee | Cart line has correct event and attendee data. |
| Attempt over-capacity booking | Checkout is blocked before Stripe. |
| Complete live Stripe payment | Order, booking, attendee, capacity, email logs, and success page are correct. |
| Replay live webhook | No duplicate business rows are created. |
| Admin open booking | Staff can support the booking from admin. |
| Check-in attendee | Staff can check in the attendee on venue device. |
| GA4 verification | Page view and booking funnel events appear in Realtime or DebugView. |

## Go/No-Go Sign-Off

| Area | Required owner sign-off |
| --- | --- |
| Event data and CMS | Launch catalogue and policy copy approved. |
| Public UX | Discovery, detail, mobile, sold-out, and waitlist states approved. |
| Checkout and Stripe | Live payment and webhook proof complete. |
| Email | Production sender and delivery proof complete, or explicit launch deferral accepted. |
| Admin operations | Staff can run event bookings from admin. |
| Analytics | GA4 implemented and verified, or explicit launch deferral accepted. |
| Security | RLS, admin roles, secrets, and webhook signatures checked. |
| Deployment | Production env, redirects, monitoring, and rollback checked. |
