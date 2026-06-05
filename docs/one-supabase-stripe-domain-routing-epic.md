# One Supabase Stripe Domain Routing Epic

Status: draft
Last updated: 2026-06-05
Scope: support staging Stripe test mode and production Stripe live mode from one Supabase project.

## Goal

Use one Supabase project while routing checkout and webhooks by environment:

- Staging Netlify URL uses Stripe test mode.
- Production customer domain uses Stripe live mode.
- Staging tests cannot accidentally behave like real customer bookings.
- Production cannot accidentally use test Stripe keys, staging URLs, or test-only records.

This is a pragmatic one-project strategy. It avoids creating a second Supabase project now, but it needs explicit routing and shared-database safeguards.

## Current Constraint

The current Edge Functions use a single set of Stripe secrets:

- `create-checkout-session` reads `STRIPE_SECRET_KEY`.
- `stripe-webhook` reads `STRIPE_WEBHOOK_SECRET`.
- Checkout URL resolution reads `CHECKOUT_APP_URL` or `APP_URL`.

That means the current project can only safely be in one Stripe mode at a time. To support staging and production together, the functions must route by domain/environment and must label records created by staging traffic.

## Ordered Work Plan

Do the work in this order.

1. Epic 1 - Define the environment contract.
2. Epic 2 - Add frontend environment identity.
3. Epic 3 - Add checkout domain routing.
4. Epic 4 - Add dual-mode Stripe webhook verification.
5. Epic 5 - Add shared-database staging safeguards.
6. Epic 6 - Add email and analytics safeguards.
7. Epic 7 - Add scripts and evidence checks.
8. Epic 8 - Configure providers.
9. Epic 9 - Run staging proof.
10. Epic 10 - Run production live proof.
11. Epic 11 - Cut over `lolacreativespace.com`.
12. Epic 12 - Later consolidate `www.lotsoflovelyart.com`.

## Epic 1 - Environment Contract

Purpose: create one explicit vocabulary for local, staging, and production before changing code.

Tasks:

1. Define allowed public origins:
   - Local: `http://localhost:5173`
   - Staging: `https://staging--lola-as-one.netlify.app`
   - Production phase 1: `https://lolacreativespace.com`
   - Production phase 2: `https://www.lotsoflovelyart.com`
2. Add the new Supabase secrets contract:
   - `ENVIRONMENT`
   - `ALLOWED_STAGING_ORIGINS`
   - `ALLOWED_PRODUCTION_ORIGINS`
   - `CHECKOUT_APP_URL_STAGING`
   - `CHECKOUT_APP_URL_PRODUCTION`
   - `STRIPE_SECRET_KEY_TEST`
   - `STRIPE_SECRET_KEY_LIVE`
   - `STRIPE_WEBHOOK_SECRET_TEST`
   - `STRIPE_WEBHOOK_SECRET_LIVE`
   - `STAGING_EMAIL_ALLOWLIST`
   - `EMAIL_FROM`
   - `EMAIL_REPLY_TO`
   - `SUPPORT_EMAIL`
   - `ADMIN_EMAILS`
3. Keep old secret names temporarily for compatibility:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `CHECKOUT_APP_URL`
   - `APP_URL`
4. Decide the default behavior for unknown origins:
   - Checkout must reject unknown origins.
   - Webhook must reject unknown or inconsistent Stripe mode.

Acceptance criteria:

- One documented list of expected origins and secrets exists.
- Staging and production values can be reviewed without exposing secret values.
- Unknown domains are treated as errors, not fallbacks.

## Epic 2 - Frontend Environment Identity

Purpose: make each Netlify deploy identify itself clearly to users and Edge Functions.

Tasks:

1. Add Netlify env vars:
   - `VITE_APP_ENV=staging` on staging.
   - `VITE_APP_ENV=production` on production.
   - `VITE_APP_URL` matching the active deploy URL.
2. Add a visible staging banner when `VITE_APP_ENV !== production`.
3. Add `noindex` for staging and deploy-preview builds.
4. Keep checkout calling `supabase.functions.invoke('create-checkout-session')`; the Edge Function will use `Origin` to choose environment.
5. Keep production UI free of staging labels.

Acceptance criteria:

- Staging is visually obvious.
- Staging and deploy previews are not indexable.
- Production has no staging banner.

## Epic 3 - Checkout Domain Routing

Purpose: make `create-checkout-session` choose the correct Stripe secret and return URL from the request origin.

Tasks:

1. Add a helper in `supabase/functions/create-checkout-session/index.ts` that reads:
   - `Origin`
   - fallback `Referer`, only if needed
2. Normalize and classify the origin as:
   - `local`
   - `staging`
   - `production`
3. Reject unknown origins.
4. Select Stripe key:
   - `staging` and `local` use `STRIPE_SECRET_KEY_TEST`.
   - `production` uses `STRIPE_SECRET_KEY_LIVE`.
5. Select checkout app URL:
   - `staging` uses `CHECKOUT_APP_URL_STAGING`.
   - `production` uses `CHECKOUT_APP_URL_PRODUCTION`.
   - `local` uses `http://localhost:5173` only when explicitly allowed.
6. Add Stripe Checkout metadata:
   - `checkout_environment`
   - `checkout_origin`
   - `checkout_app_url`
   - `stripe_livemode_expected`
7. Add key-mode validation:
   - staging/local must not use `sk_live_`.
   - production must not use `sk_test_`.
8. Remove production reliance on `DEFAULT_CHECKOUT_APP_URL`.

Acceptance criteria:

- Staging checkout creates a `cs_test_...` session and returns to staging.
- Production checkout creates a `cs_live_...` session and returns to production.
- Unknown origins cannot create checkout sessions.
- Production cannot silently fall back to a Netlify URL.

## Epic 4 - Dual-Mode Stripe Webhook Verification

Purpose: make `stripe-webhook` safely process both Stripe test and live webhook events in one function.

Tasks:

1. Replace single-secret verification with dual-secret verification:
   - Try `STRIPE_WEBHOOK_SECRET_TEST`.
   - Try `STRIPE_WEBHOOK_SECRET_LIVE`.
   - Record which one verified the event.
2. After verification, compare verified mode with Stripe event mode:
   - Test secret must verify `event.livemode === false`.
   - Live secret must verify `event.livemode === true`.
3. Read Checkout Session metadata:
   - `checkout_environment`
   - `checkout_origin`
   - `stripe_livemode_expected`
4. Reject mismatches:
   - Test event with production metadata.
   - Live event with staging metadata.
   - Missing environment metadata for new sessions.
5. Preserve idempotency through `stripe_events`.
6. Store enough mode metadata in `stripe_events` or related metadata fields to audit whether an event was test or live.

Acceptance criteria:

- Test Stripe webhook events verify with the test webhook secret only.
- Live Stripe webhook events verify with the live webhook secret only.
- A replay cannot create duplicate orders, bookings, attendees, capacity changes, or emails.
- Mismatched mode/environment events are rejected before database mutation.

## Epic 5 - Shared-Database Staging Safeguards

Purpose: prevent staging tests from polluting live operational data in the shared Supabase project.

Decision needed before implementation:

- Option A: staging can only book dedicated test events.
- Option B: staging can book real events but must auto-clean proof bookings.
- Option C: staging checkout is allowed only for a small internal allowlist and is manually cleaned.

Recommended choice: Option A for repeatable testing. It is the least risky in a one-project setup.

Tasks:

1. Add a way to identify staging/test records:
   - `checkout_environment=staging` in Stripe metadata.
   - order metadata or a new column if available.
   - booking notes/metadata or a new column if available.
2. Add staging event eligibility:
   - Dedicated test events only, or
   - a metadata flag such as `allow_staging_checkout=true`.
3. In staging checkout, reject events that are not allowed for staging.
4. Ensure staging orders/bookings are easy to filter in admin and cleanup scripts.
5. Create or update a cleanup script for staging proof bookings:
   - cancel staging proof orders/bookings.
   - restore capacity.
   - keep evidence rows where needed.
6. Confirm live production checkout cannot book staging-only events if they should be hidden from public production.

Acceptance criteria:

- Staging checkout cannot decrement capacity for launch events unless explicitly allowed.
- Staging proof data can be identified and cleaned.
- Production admin users can distinguish real bookings from staging proof records.

## Epic 6 - Email And Analytics Safeguards

Purpose: stop staging from emailing real customers or sending production analytics noise.

Tasks:

1. In `send-email`, add environment-aware recipient restrictions:
   - staging/local can only send to `STAGING_EMAIL_ALLOWLIST`.
   - production requires a verified sender domain.
2. Ensure production never falls back to `onboarding@resend.dev`.
3. In staging, either disable admin/customer emails or rewrite recipients to internal test inboxes.
4. Add analytics guard:
   - analytics only runs when `VITE_ENABLE_ANALYTICS=true`.
   - staging uses no analytics or a separate GA4 property.
5. Confirm no PII goes to analytics.

Acceptance criteria:

- Staging proof checkout cannot email a real customer unless they are allowlisted.
- Production checkout sends from the verified production sender.
- Staging traffic does not pollute production GA4.

## Epic 7 - Scripts And Evidence Checks

Purpose: make the routing strategy testable rather than relying on manual dashboard inspection.

Tasks:

1. Update checkout/webhook proof scripts to accept:
   - `CHECKOUT_PROOF_ENV=staging|production`
   - `PUBLIC_APP_URL`
   - expected `cs_test_` or `cs_live_` session prefix.
2. Add a source audit that checks:
   - no single `STRIPE_SECRET_KEY` path remains for new routing.
   - no production fallback to staging/Netlify checkout URL.
   - webhook has both test and live verification paths.
3. Add or update evidence docs after proof runs.
4. Add cleanup evidence for staging proof bookings.

Acceptance criteria:

- Staging proof fails if a live Stripe session is created.
- Production proof fails if a test Stripe session is created.
- Evidence clearly separates staging/test proof from production/live proof.

## Epic 8 - Provider Configuration

Purpose: configure Netlify, Supabase, Stripe, and Resend after code is ready.

Tasks:

1. Netlify staging:
   - `VITE_APP_ENV=staging`
   - `VITE_APP_URL=https://staging--lola-as-one.netlify.app`
   - Supabase URL and anon key for the shared project.
   - Stripe publishable test key, if needed by frontend.
2. Netlify production:
   - `VITE_APP_ENV=production`
   - `VITE_APP_URL=https://lolacreativespace.com`
   - Supabase URL and anon key for the shared project.
   - Stripe publishable live key, if needed by frontend.
3. Supabase shared project secrets:
   - both test and live Stripe secrets.
   - both staging and production checkout URLs.
   - origin allowlists.
   - staging email allowlist.
4. Stripe test webhook endpoint:
   - `https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook`
   - events: `checkout.session.completed`, `checkout.session.expired`
   - save secret as `STRIPE_WEBHOOK_SECRET_TEST`
5. Stripe live webhook endpoint:
   - same function URL.
   - events: `checkout.session.completed`, `checkout.session.expired`
   - save secret as `STRIPE_WEBHOOK_SECRET_LIVE`
6. Resend:
   - verify production sender domain before live launch.
   - set production sender/reply/support/admin recipients.

Acceptance criteria:

- Staging and production can both be configured at the same time.
- No launch requires swapping one global Stripe key from test to live.

## Epic 9 - Staging Proof

Purpose: prove the complete staging path before DNS or live payments.

Tasks:

1. Deploy staging branch.
2. Confirm staging banner and noindex.
3. Add a staging-eligible test event.
4. Complete a Stripe test checkout.
5. Confirm:
   - session starts with `cs_test_`.
   - success URL returns to staging.
   - webhook processes as `checkout_environment=staging`.
   - proof order/booking/attendees are labelled staging.
   - capacity behavior is correct for the staging-safe data model.
   - emails are blocked, rewritten, or allowlisted as intended.
6. Run replay/idempotency proof.
7. Run cleanup.

Acceptance criteria:

- Staging checkout is fully usable for internal testing.
- Staging test records are safe in the shared database.
- Staging cannot create live Stripe sessions.

## Epic 10 - Production Live Proof

Purpose: prove the live path before public booking traffic is sent to the new app.

Tasks:

1. Confirm production Netlify env points to `https://lolacreativespace.com`.
2. Confirm Supabase production checkout URL points to `https://lolacreativespace.com`.
3. Confirm live Stripe key and live webhook secret are set.
4. Confirm production Resend sender domain is verified.
5. Complete one low-risk live checkout.
6. Confirm:
   - session starts with `cs_live_`.
   - success URL returns to production domain.
   - webhook processes as `checkout_environment=production`.
   - one order, booking, attendee set, capacity update, Stripe event log, and email set are created.
   - admin can find and support the booking.
7. Run live replay/idempotency proof.
8. Refund or operationally clean up the live proof payment.

Acceptance criteria:

- Production can take a live event booking safely.
- Webhook replay does not duplicate business records.
- Customer and admin emails deliver in production.

## Epic 11 - DNS Cutover To `lolacreativespace.com`

Purpose: move the events domain to the new Netlify app after staging and live proof are ready.

Tasks:

1. Add `lolacreativespace.com` to Netlify production.
2. Prepare rollback steps.
3. During launch window, update DNS to Netlify.
4. Wait for HTTPS.
5. Smoke test:
   - `/`
   - `/workshops`
   - `/checkout`
   - `/order/success`
   - `/admin`
6. Run a final live checkout or accept the immediately preceding live proof if no config changed.
7. Monitor Netlify, Supabase functions, Stripe webhooks, Resend, and admin bookings.

Acceptance criteria:

- `lolacreativespace.com` runs the unified app.
- Customers can book events through the new production path.
- Existing `www.lotsoflovelyart.com` ecommerce site remains untouched.

## Epic 12 - Final Domain Consolidation

Purpose: move from the events-first production domain to the final unified customer domain.

Tasks:

1. Confirm ecommerce-critical functionality is ready in the unified app.
2. Add `www.lotsoflovelyart.com` and `lotsoflovelyart.com` to Netlify.
3. Change production environment URLs to `https://www.lotsoflovelyart.com`.
4. Update Stripe domain/wallet/customer-facing settings.
5. Update Resend/GA4/domain settings where needed.
6. Cut DNS for `www.lotsoflovelyart.com`.
7. Redirect apex and decide whether `lolacreativespace.com` redirects or remains an alias.
8. Repeat live proof.

Acceptance criteria:

- One public website handles both ecommerce and events.
- `www.lotsoflovelyart.com` is canonical.
- `lolacreativespace.com` has an intentional redirect or alias strategy.

## First Implementation Slice

Start here:

1. Implement Epic 1 environment contract in docs and `.env.example` files.
2. Implement Epic 2 frontend identity, staging banner, and noindex.
3. Implement Epic 3 checkout domain routing.
4. Implement Epic 4 webhook dual-mode verification.
5. Implement only the safest Epic 5 option: staging can book dedicated test events only.

Do not configure live Stripe secrets until Epics 3 and 4 are merged and tested in staging.

