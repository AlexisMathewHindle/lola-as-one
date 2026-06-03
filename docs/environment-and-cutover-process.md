# Environment And Cutover Process

Status: draft
Last updated: 2026-06-03
Scope: unified Lola site in `app/`, deployed on Netlify, with Supabase, Stripe, Resend, and event booking operations.

## Current Domain Situation

There are currently two active public websites:

- `https://www.lotsoflovelyart.com` is the existing ecommerce website.
- `https://lolacreativespace.com` is the existing events booking website.

The target is one unified website that handles events, workshops, content, and eventually ecommerce. The first production cutover should point `lolacreativespace.com` to the new Netlify app while `www.lotsoflovelyart.com` continues to run the existing ecommerce site. The later consolidation step can move the canonical customer domain to `www.lotsoflovelyart.com`.

DNS changes should happen near the end of the process, after staging validation and production configuration are ready.

## Target Environments

| Environment | Purpose | URL | Data | Stripe | Email | Search indexing |
| --- | --- | --- | --- | --- | --- | --- |
| Local dev | Developer work and fast iteration. | `http://localhost:5173` | Local Supabase or staging Supabase. | Test mode only. | Disabled or test recipients only. | No indexing. |
| Staging | Production-like testing before DNS cutover. | `https://staging--lola-as-one.netlify.app` or staging custom domain. | Separate staging Supabase preferred. | Test mode only. | Restricted recipients only. | `noindex`. |
| Production phase 1 | New app live for events/booking. | `https://lolacreativespace.com` | Production Supabase. | Live mode. | Production sender domain. | Indexable, once approved. |
| Production phase 2 | Final unified brand/site domain. | `https://www.lotsoflovelyart.com` | Production Supabase. | Live mode. | Production sender domain. | Indexable. |

## Phase 1 - Repo And Netlify Environment Structure

1. Keep `main` as production.
2. Keep or create a `staging` branch for staging deploys.
3. Keep Netlify deploy previews enabled for pull requests and other branches.
4. Configure Netlify build settings for all contexts:
   - Base directory: `app`
   - Build command: `npm run build`
   - Publish directory: `app/dist`
   - Node version: `20`
5. Use Netlify environment variables instead of hardcoded production URLs:
   - `VITE_APP_ENV`
   - `VITE_APP_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GA_MEASUREMENT_ID`
   - `VITE_ENABLE_ANALYTICS`
6. Set environment values by Netlify context:
   - Local: `VITE_APP_ENV=development`, `VITE_APP_URL=http://localhost:5173`
   - Staging: `VITE_APP_ENV=staging`, `VITE_APP_URL=https://staging--lola-as-one.netlify.app`
   - Production phase 1: `VITE_APP_ENV=production`, `VITE_APP_URL=https://lolacreativespace.com`
   - Production phase 2: `VITE_APP_ENV=production`, `VITE_APP_URL=https://www.lotsoflovelyart.com`

## Phase 2 - Supabase Environment Structure

1. Prefer a separate staging Supabase project.
2. If a separate staging project is not available yet, staging may temporarily point to production Supabase, but only with clearly marked test data and no live Stripe or broad customer email sending.
3. Configure Supabase Edge Function secrets per environment:
   - `ENVIRONMENT`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_URL`
   - `CHECKOUT_APP_URL`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `EMAIL_REPLY_TO`
   - `SUPPORT_EMAIL`
   - `ADMIN_EMAILS`
   - `FUNCTIONS_GATEWAY_JWT`
   - `SITE_URL`
   - `EVENT_FEEDBACK_URL`
   - `EVENT_EMAIL_TIME_ZONE`
   - `EVENT_EMAIL_CRON_SECRET`
4. Use these URL values:
   - Local: `APP_URL=http://localhost:5173`, `CHECKOUT_APP_URL=http://localhost:5173`
   - Staging: `APP_URL=https://staging--lola-as-one.netlify.app`, `CHECKOUT_APP_URL=https://staging--lola-as-one.netlify.app`
   - Production phase 1: `APP_URL=https://lolacreativespace.com`, `CHECKOUT_APP_URL=https://lolacreativespace.com`, `SITE_URL=https://lolacreativespace.com`
   - Production phase 2: `APP_URL=https://www.lotsoflovelyart.com`, `CHECKOUT_APP_URL=https://www.lotsoflovelyart.com`, `SITE_URL=https://www.lotsoflovelyart.com`
5. Redeploy Edge Functions after any secret change:
   - `create-checkout-session`
   - `stripe-webhook`
   - `send-email`
   - `send-event-emails`, if reminder/feedback automation launches
   - `get-order-by-session`

## Phase 3 - Safety Guards To Implement

Add code/config guards before using the production domain.

1. App environment guard:
   - Add `VITE_APP_ENV`.
   - Show a visible staging/deploy-preview banner when `VITE_APP_ENV` is not `production`.
   - Add `noindex` metadata for staging and deploy previews.
2. Checkout URL guard:
   - In production, fail checkout if `CHECKOUT_APP_URL` or `APP_URL` is missing.
   - In production, fail checkout if `CHECKOUT_APP_URL` points to localhost, staging, or a Netlify deploy-preview URL.
   - In staging, warn or fail if `CHECKOUT_APP_URL` points to a production customer domain.
3. Stripe mode guard:
   - In production, fail checkout/webhook startup if `STRIPE_SECRET_KEY` is not a live key.
   - In staging/local, fail or warn if a live Stripe key is configured.
   - Keep staging Stripe webhooks separate from production Stripe webhooks.
4. Email guard:
   - In staging/local, restrict email recipients to internal test addresses.
   - In production, require `EMAIL_FROM` to use the verified sender domain.
   - Never fall back to `onboarding@resend.dev` in production.
5. Analytics guard:
   - Disable analytics unless `VITE_ENABLE_ANALYTICS=true`.
   - In staging, either disable analytics or send to a separate GA4 property.
   - Never send attendee names, email addresses, phone numbers, allergy notes, or addresses to GA4.
6. Admin guard:
   - Keep admin routes behind Supabase auth.
   - Confirm admin users use `app_metadata.role=admin`.
   - Remove or downgrade unused admin accounts before launch.

## Phase 4 - Staging Setup And Validation

1. Deploy the `staging` branch to Netlify.
2. Confirm staging has:
   - `VITE_APP_ENV=staging`
   - staging `VITE_APP_URL`
   - staging or approved test Supabase keys
   - no live Stripe keys
   - no production-wide email sending
   - noindex enabled
3. Run the production build locally with Node 20:
   - `PATH=/Users/alexishindle/.nvm/versions/node/v20.20.1/bin:$PATH npm --prefix app run build`
4. Run staging smoke tests:
   - Home page loads.
   - `/workshops`, `/adult-workshops`, `/half-term`, `/summer-holiday` load.
   - Representative event detail pages load.
   - Cart and checkout forms work.
   - Over-capacity checkout is blocked before Stripe.
   - Test-mode Stripe checkout returns to the staging success page.
   - Webhook creates one order, booking, attendees, capacity update, Stripe event log, and email logs.
   - Webhook replay does not duplicate business rows.
   - Admin booking list, booking detail, order detail, event detail, and check-in work.
5. Run or accept the existing evidence checks:
   - `scripts/audit-events-data-readiness.mjs`
   - `scripts/audit-public-event-detail-flow.mjs`
   - `scripts/audit-event-cart-checkout-readiness.mjs`
   - `scripts/audit-admin-booking-operations-readiness.mjs`
   - `scripts/audit-admin-booking-staff-browser-proof.mjs`
   - Stripe payment/webhook proof scripts in test mode.

## Phase 5 - Production Phase 1 Preparation For `lolacreativespace.com`

Do this before touching DNS.

1. Add `lolacreativespace.com` to the Netlify production site.
2. Prepare Netlify production variables:
   - `VITE_APP_ENV=production`
   - `VITE_APP_URL=https://lolacreativespace.com`
   - production `VITE_SUPABASE_URL`
   - production `VITE_SUPABASE_ANON_KEY`
   - analytics variables if analytics launches
3. Prepare Supabase production secrets:
   - `ENVIRONMENT=production`
   - `APP_URL=https://lolacreativespace.com`
   - `CHECKOUT_APP_URL=https://lolacreativespace.com`
   - `SITE_URL=https://lolacreativespace.com`
   - live `STRIPE_SECRET_KEY`
   - live `STRIPE_WEBHOOK_SECRET`
   - production Resend and email secrets
4. Create the live Stripe webhook endpoint for production:
   - URL: `https://<production-supabase-project>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`
5. Verify Stripe account production settings:
   - Business details
   - Bank/payout details
   - Statement descriptor
   - Customer receipts
   - Apple Pay/Google Pay domain readiness if wallet payments are expected
6. Verify Resend production sender domain.
7. Confirm admin users and production support recipients.
8. Confirm rollback owner and rollback steps.

## Phase 6 - DNS Cutover To `lolacreativespace.com`

Run this during the agreed launch window.

1. Deploy the intended production commit to Netlify.
2. Update DNS for `lolacreativespace.com` to point to Netlify.
3. Wait for Netlify HTTPS to issue.
4. Confirm these URLs load over HTTPS:
   - `https://lolacreativespace.com`
   - `https://lolacreativespace.com/workshops`
   - `https://lolacreativespace.com/checkout`
   - `https://lolacreativespace.com/order/success`
5. Confirm Supabase production URL secrets point to `https://lolacreativespace.com`.
6. Redeploy production Edge Functions after final URL/secret changes.
7. Run one low-risk live Stripe payment proof.
8. Confirm the live proof creates exactly one:
   - order
   - order item set
   - booking
   - attendee set
   - capacity update
   - Stripe event log
   - success-page recovery
   - customer confirmation email
   - event booking confirmation email
   - admin new-order email
9. Run live webhook replay/idempotency proof.
10. Refund or operationally clean up the live proof payment.
11. Run admin support smoke test against `https://lolacreativespace.com`.
12. Confirm monitoring:
   - Netlify deploy/runtime
   - Supabase Edge Function logs
   - Supabase database
   - Stripe payments/webhooks
   - Resend delivery
   - GA4, if enabled

## Phase 7 - Production Phase 2 Consolidation To `www.lotsoflovelyart.com`

Do this only when the existing ecommerce website can be retired or migrated.

1. Confirm all ecommerce-critical flows are available in the unified app or intentionally deferred.
2. Add `www.lotsoflovelyart.com` and `lotsoflovelyart.com` to Netlify.
3. Prepare Netlify production variable change:
   - `VITE_APP_URL=https://www.lotsoflovelyart.com`
4. Prepare Supabase production secret changes:
   - `APP_URL=https://www.lotsoflovelyart.com`
   - `CHECKOUT_APP_URL=https://www.lotsoflovelyart.com`
   - `SITE_URL=https://www.lotsoflovelyart.com`
   - `EVENT_FEEDBACK_URL=https://www.lotsoflovelyart.com/contact`
5. Update Stripe Dashboard domain/payment method settings if wallet payments or customer URLs depend on the canonical domain.
6. Update Resend sender/domain settings if needed.
7. Update GA4 property/domain settings if needed.
8. Cut DNS for `www.lotsoflovelyart.com`.
9. Redirect `lotsoflovelyart.com` to `www.lotsoflovelyart.com`.
10. Decide whether `lolacreativespace.com` redirects to the new canonical domain or remains as an alias.
11. Repeat live smoke tests and one low-risk payment proof after final domain cutover.

## Go/No-Go Criteria

Do not cut over DNS until these are true or explicitly signed off as deferred:

- Staging build and smoke tests pass.
- Production env vars are prepared and reviewed.
- Stripe live keys and webhook endpoint are ready.
- Resend production sender domain is verified.
- Admin users and support recipients are confirmed.
- Launch event catalogue and policy copy are approved.
- Rollback owner and process are documented.
- Monitoring owners are named.

Do not publicly accept live bookings until these are true:

- Production domain loads over HTTPS.
- Checkout success/cancel URLs return to the production domain.
- Live Stripe payment proof passes.
- Live replay/idempotency proof passes.
- Customer and admin production emails deliver.
- Staff can find and manage the live proof booking in admin.

