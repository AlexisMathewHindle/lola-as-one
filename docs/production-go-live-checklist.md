# Production Go-Live Checklist

Status: current
Last updated: 2026-05-20
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Pre-launch checklist: [Events Pre-Launch Checklist](./events-pre-launch-checklist.md)
Production URL target: `https://www.lotsoflovelyart.com`
Current hosting target: Netlify site currently serving `lola-as-one`

## Purpose

This is the production cutover checklist for taking the new `app/` live on `www.lotsoflovelyart.com`.

The legacy app is not required once the new app launches. The production source of truth for data is Supabase. Firebase is not part of the launch target.

## Current Known State

| Area | State |
| --- | --- |
| Production URL | Target is `https://www.lotsoflovelyart.com`. |
| Hosting | New app is hosted on Netlify as `lola-as-one`. |
| App source | New production app is `app/`. |
| Data source | Supabase is the final source of truth. |
| Stripe | Sandbox/test proof is green; live Stripe cutover is still required. |
| Events data | Event Data And CMS Readiness is green, with final launch spot checks still required. |
| Public event UX | Public Discovery And Event Detail Flow is green. |
| Checkout | Event Cart And Checkout non-live audit is green. |
| Stripe proof | Sandbox payment, webhook, replay/idempotency, and cleanup proofs are green. |
| Email | Sandbox email logs are proven; production sender/domain variables remain deferred. |
| Admin | Admin booking operations audit and staff browser proof are green. |
| Analytics | GA4 is not wired in `app/` yet. |

## P0 Go-Live Blockers

These must be green before public launch.

### 1. Domain And Netlify Cutover

- Add `www.lotsoflovelyart.com` to the Netlify site serving `app/`.
- Decide the canonical domain: use `www.lotsoflovelyart.com` as canonical and redirect `lotsoflovelyart.com` to `www`.
- Update DNS for `www.lotsoflovelyart.com` to point to Netlify.
- Configure the apex/root domain `lotsoflovelyart.com` in DNS so it redirects or aliases correctly to the Netlify site.
- Verify Netlify has issued and renewed HTTPS for both `www.lotsoflovelyart.com` and `lotsoflovelyart.com`.
- Force HTTPS in Netlify.
- Update Netlify production environment/config so `VITE_APP_URL`, any public app URL setting, and all app-facing URLs use `https://www.lotsoflovelyart.com`, not `https://lola-as-one.netlify.app`.
- Keep the Netlify subdomain available for diagnostics, but do not use it as the customer-facing canonical URL.
- Deploy from the intended production branch and confirm the production deploy is the exact commit being launched.

Evidence required:

- Netlify domain settings screenshot or deployment note.
- DNS records recorded.
- `https://www.lotsoflovelyart.com` loads the app over HTTPS.
- `https://lotsoflovelyart.com` redirects or resolves as intended.
- `https://www.lotsoflovelyart.com/order/success` loads without a Netlify 404.

### 2. Stripe Live Cutover

- Switch Stripe from sandbox/test to live mode for production checkout.
- Set Netlify production `VITE_STRIPE_PUBLISHABLE_KEY` to the live publishable key.
- Set Supabase Edge Function `STRIPE_SECRET_KEY` to the live secret key.
- Create a live Stripe webhook endpoint pointing at the deployed Supabase `stripe-webhook` function.
- Set Supabase Edge Function `STRIPE_WEBHOOK_SECRET` to the live endpoint signing secret.
- Confirm `CHECKOUT_APP_URL` or `APP_URL` in Supabase secrets is `https://www.lotsoflovelyart.com`.
- Confirm Stripe Checkout success URL resolves to `https://www.lotsoflovelyart.com/order/success?session_id=...`.
- Confirm Stripe Checkout cancel URL resolves to `https://www.lotsoflovelyart.com/checkout`.
- Confirm Stripe account business details, bank payout details, statement descriptor, and customer receipt settings are production-ready.
- Complete a deliberate low-risk live payment proof.
- Run the live Stripe payment/webhook evidence audit with the `cs_live_...` Checkout Session ID.
- Run the live replay/idempotency proof.
- Refund or operationally clean up the live proof payment after evidence is captured.

Evidence required:

- `cs_live_...` proof creates exactly one order, order item, booking, attendee set, capacity decrement, Stripe event log, success-page recovery, and order-linked email logs.
- Replay proof creates no duplicate orders, bookings, attendees, capacity decrements, or email sends.
- Stripe Dashboard shows the live payment and refund/cleanup decision.

### 3. Supabase Production Configuration

- Confirm all production migrations are applied.
- Confirm Supabase project is the production data source for the deployed app.
- Confirm public read and admin write RLS policies for launch tables.
- Confirm storage buckets and image URLs are public/readable where required by the public app.
- Set or confirm Supabase Edge Function secrets:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `CHECKOUT_APP_URL` or `APP_URL`
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `EMAIL_REPLY_TO`
  - `SUPPORT_EMAIL`
  - `ADMIN_EMAILS`
  - `FUNCTIONS_GATEWAY_JWT`
- Redeploy Supabase Edge Functions after secret changes:
  - `create-checkout-session`
  - `stripe-webhook`
  - `send-email`
  - `get-order-by-session`
- If magic-link customer accounts are enabled for launch, configure Supabase Auth Site URL and redirect allowlist for `https://www.lotsoflovelyart.com`.

Evidence required:

- Supabase secrets list checked without exposing secret values.
- Edge Functions deployed after production secret changes.
- RLS verification rerun.
- Event data readiness audit rerun or spot-checked immediately before launch.

### 4. Netlify Environment And Build

- Confirm production deploy uses `app/` as the build base.
- Confirm production build command is `npm run build`.
- Confirm production publish directory is `app/dist`.
- Confirm Node version is `20`.
- Confirm production env vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `VITE_APP_URL`
  - `VITE_GA_MEASUREMENT_ID` if GA4 is enabled
  - `VITE_ENABLE_ANALYTICS` if an analytics guard is used
- Confirm SPA fallback redirects still work after domain cutover.
- Confirm legacy workshop redirects still work on the production domain.
- Confirm `lola-as-one.netlify.app` is not indexed or presented as the canonical customer URL.

Evidence required:

- Netlify production deploy is green.
- `npm run build` passes.
- Key routes load directly on hard refresh:
  - `/`
  - `/workshops`
  - `/adult-workshops`
  - `/half-term`
  - `/summer-holiday`
  - `/cart`
  - `/checkout`
  - `/order/success`
  - `/faqs`
  - `/privacy-policy`
  - `/terms-and-conditions`

### 5. Event Data And CMS

- Confirm launch catalogue in Supabase.
- Confirm public pages show only launch-approved events.
- Confirm every bookable event has date, start time, price, capacity, location, booking copy, cancellation copy, image, slug, status, and category layout.
- Confirm stale/test/draft/duplicate records are hidden from public surfaces.
- Confirm `event_capacity.spaces_booked` matches `offering_events.current_bookings`.
- Confirm CMS pages are live and linked:
  - `/about`
  - `/contact`
  - `/faqs`
  - `/privacy-policy`
  - `/terms-and-conditions`
- Confirm policy copy is approved for cancellation, refund, privacy, and terms.

Evidence required:

- Event Data And CMS readiness evidence refreshed or accepted.
- Business/legal sign-off for customer-facing policy copy.

### 6. Public UX And URL Handling

- Verify event category pages on desktop and mobile:
  - `/workshops`
  - `/adult-workshops`
  - `/half-term`
  - `/summer-holiday`
- Verify representative event detail pages on desktop and mobile.
- Verify sold-out states and waitlist states for any launch event where they apply.
- Verify booking CTAs, date selectors, event copy, images, and policy links.
- Verify old workshop/event URLs redirect or fall back cleanly.
- Decide whether product/shop URLs from the old Lots of Lovely Art site need launch redirects now or can wait until product launch.
- Confirm metadata, page titles, social preview images, favicon, robots, and sitemap strategy.

Evidence required:

- Browser/mobile spot checks on `https://www.lotsoflovelyart.com`.
- Redirect spot checks for old customer-facing URLs.

### 7. Event Cart, Checkout, And Capacity

- Verify add-to-cart from event detail and category surfaces.
- Verify attendee quantity, attendee names, allergies, and consent fields.
- Verify cart line has the correct event, date, time, price, and quantity.
- Verify over-capacity bookings are blocked before Stripe.
- Verify checkout payload sent to `create-checkout-session`.
- Verify order success route can recover by Stripe session ID.
- Verify webhook creates order, order item, booking, attendee rows, email logs, and capacity decrement.
- Verify capacity cannot decrement twice from duplicate webhook delivery.

Evidence required:

- Event Cart And Checkout audit rerun or accepted.
- Live Stripe proof and replay proof complete.

### 8. Email Confirmations And Notifications

- Verify Resend production domain for `lotsoflovelyart.com` or the approved sending domain.
- Configure DNS records for email sending: SPF, DKIM, and DMARC as required by the provider.
- Set production `RESEND_API_KEY` in Supabase secrets.
- Confirm from address and reply-to address.
- Set Supabase Edge Function `EMAIL_FROM` to a sender on the verified domain.
- Set Supabase Edge Function `EMAIL_REPLY_TO` to the launch support inbox.
- Set Supabase Edge Function `SUPPORT_EMAIL` to the customer support inbox used inside templates.
- Confirm `ADMIN_EMAILS` launch recipients.
- Confirm customer order confirmation sends in production.
- Confirm event booking confirmation sends in production.
- Confirm admin new-order notification sends in production.
- Confirm reminder and waitlist email ownership:
  - build/schedule now, or
  - explicitly defer with manual process and owner.

Evidence required:

- Live proof order has sent `order-confirmation`, `event-booking-confirmation`, and `new-order-admin` logs.
- Real inbox delivery checked for customer and admin recipients.

### 9. Admin Operations

- Confirm admin users have the correct `app_metadata.role=admin`.
- Confirm old/unneeded admin accounts are removed or downgraded.
- Run the admin booking operations audit.
- Run the staff browser proof against the production domain.
- Run a final smoke check on the actual venue device/browser.
- Confirm staff can:
  - find bookings,
  - open booking detail,
  - reconcile order/payment,
  - open event detail,
  - use check-in,
  - understand cancellation/refund steps.
- Confirm manual Stripe refund owner until refund automation exists.

Evidence required:

- Admin Booking Operations evidence current.
- Staff Browser Proof current.
- Cancellation/refund runbook current and accepted.

### 10. Google Analytics And Privacy

- Create or confirm GA4 property for `www.lotsoflovelyart.com`.
- Add app runtime wiring for GA4 or GTM.
- Set production analytics env vars in Netlify.
- Track SPA route changes.
- Track booking funnel events:
  - event view,
  - add to cart,
  - begin checkout,
  - checkout success or purchase.
- Confirm analytics consent/privacy decision.
- Confirm privacy policy mentions analytics usage.
- Verify GA4 DebugView or Realtime on the production domain.

Evidence required:

- GA4 realtime/debug proof on `www.lotsoflovelyart.com`.
- Privacy/cookie decision recorded.

### 11. Security, Secrets, And Compliance

- Confirm no live secrets are committed to the repo.
- Rotate any secrets that were ever exposed in docs, scripts, screenshots, or terminal output.
- Confirm `.env.local` and `.env.*.local` remain ignored.
- Confirm Supabase service role key is only used server-side/scripts, never in browser env.
- Confirm Stripe webhook signature verification rejects invalid signatures.
- Confirm admin routes require admin role.
- Confirm RLS blocks public writes to admin-only tables.
- Confirm policy pages are visible and linked in checkout.
- Confirm Firebase is removed from the production launch path and no Firebase env vars are required.

Evidence required:

- Secret inventory reviewed.
- Invalid Stripe signature probe passes.
- RLS/admin checks pass.

### 12. Monitoring, Rollback, And Support

- Name launch owner and support owner.
- Define launch window.
- Confirm rollback path:
  - restore previous Netlify deploy,
  - revert domain/DNS if needed,
  - pause public booking CTAs if needed.
- Confirm monitoring owners for:
  - Netlify deploy/runtime,
  - Supabase Edge Functions,
  - Supabase database,
  - Stripe payments/webhooks,
  - Resend email delivery,
  - GA4 analytics.
- Confirm support runbooks:
  - failed payment,
  - missing booking,
  - missing email,
  - duplicate booking,
  - cancellation/refund,
  - capacity mismatch.

Evidence required:

- Rollback steps documented.
- Support owner knows where to check Netlify, Supabase, Stripe, and Resend.

## Launch-Day Smoke Test

Run these on `https://www.lotsoflovelyart.com` after DNS, Netlify, Supabase secrets, Stripe live mode, and email sender configuration are complete.

| Scenario | Expected result |
| --- | --- |
| Open home page | App loads over HTTPS on the production domain. |
| Open event category pages | Launch-approved events only. |
| Open event detail | Correct copy, date, time, image, location, price, capacity, and CTA. |
| Open CMS pages | About, Contact, FAQs, Privacy Policy, and Terms pages render. |
| Add event to cart | Cart line has correct event, date, price, quantity, attendee fields. |
| Attempt over-capacity booking | Checkout is blocked before Stripe. |
| Complete live Stripe payment | Customer returns to `/order/success` on the production domain. |
| Webhook completes | Order, booking, attendees, capacity, Stripe event, and email logs are correct. |
| Replay webhook proof | No duplicate business rows or duplicate capacity decrement. |
| Customer email | Customer receives order and event confirmation emails. |
| Admin email | Launch admin recipients receive new order email. |
| Admin booking support | Staff can find and support the booking without Supabase direct access. |
| Check-in page | Venue device can load and use check-in. |
| GA4 | Realtime or DebugView sees page views and booking funnel events. |

## Go/No-Go Rule

Do not publicly launch while Stripe remains in sandbox/test mode.

Do not publicly launch until `www.lotsoflovelyart.com`, Stripe live keys/webhook, Supabase production secrets, production email sender, admin operations, policy pages, and rollback ownership are all either green or explicitly signed off as launch deferrals.
