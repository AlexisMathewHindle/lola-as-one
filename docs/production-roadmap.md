# Lola As One Production Roadmap

Status: current
Last updated: 2026-05-19

## Purpose

This roadmap turns the platform inventory into delivery epics for getting Lola As One to production.

Current production focus: launch events and workshops first. Use [Events Production Launch Epic](./events-production-launch-epic.md) as the immediate execution plan for event discovery, bookings, Stripe, email confirmations, notifications, admin operations, waitlists, reminders, deployment, and go/no-go checks. Events Data And CMS Readiness and Public Discovery And Event Detail Flow are green as of 2026-05-14. Event Cart And Checkout has a green non-live automated audit. Stripe Payment And Webhook Proof is sandbox payment-proof green as of 2026-05-19 for order, booking, attendee, capacity, success-page, Stripe event, and email confirmation logs. Replay/idempotency proof is next. Stripe remains in sandbox/test mode; live Stripe cutover and live-mode proof are required before production launch.

It is based on these confirmed launch decisions:

- `app/` is the production launch application.
- `lola-workshops/` is not required after the new app launches.
- Supabase is the final live source of truth.
- Stripe is currently sandbox/test mode for proof work; live Stripe keys, webhook endpoint, production return URL, and a `cs_live_...` booking proof are required before go-live.
- Firebase is not part of the final production platform.
- Customer access should be magic-link/passwordless oriented rather than password-first.
- Subscriptions are part of launch scope.
- About, Contact, FAQs, and policy pages should be CMS-driven.
- All project docs should live under `docs/` and be marked `current` or `stale`.

Completion language in this file is deliberately strict:

- `Completed` means the code path, migration, or admin/public surface exists in the repo.
- `Launch epic` means work still needed before production, ordered by dependency and risk.
- A completed epic may still have production-hardening work captured in a launch epic.

## Section 1: Completed Epics

These epics are backed by shipped code paths, migrations, or documented implementation already present in the repository.

### Completed Epic 1: Platform Foundation

Status: completed

What shipped:

- Vue 3/Vite app scaffold in `app/`.
- Vue Router, Pinia, Tailwind, Font Awesome, and Supabase client setup.
- Admin route shell and public route shell.
- Legacy Vue CLI app retained under `lola-workshops/` as a migration source.

Evidence:

- `app/package.json`
- `app/src/main.js`
- `app/src/router/index.js`
- `app/src/lib/supabase.js`
- `app/src/stores/auth.js`
- `app/src/stores/cart.js`
- `lola-workshops/package.json`

Production caveat:

- The production launch target is now only `app/`; legacy app parity and retirement are captured in Launch Epic 3.

### Completed Epic 2: Unified Supabase Domain Model

Status: completed

What shipped:

- Unified data model for customers, offerings, events, products, subscriptions, orders, bookings, inventory, content, redirects, and downloads.
- RLS foundation across major tables.
- Supporting migrations for inventory decrement, booking fixes, subscriptions, CMS foundation, coupons, category images, footer settings, and holiday pages.

Evidence:

- `docs/migrations/schema.sql`
- `supabase/migrations/20260208_fix_bookings_and_functions.sql`
- `supabase/migrations/20260208_fix_customers_id.sql`
- `supabase/migrations/20260209_add_decrement_inventory_function.sql`
- `supabase/migrations/20260213_subscription_fulfillment.sql`
- `supabase/migrations/20260409_create_site_cms_foundation.sql`
- `supabase/migrations/20260514_add_policy_info_pages.sql`
- `supabase/migrations/20260514_harden_event_capacity_rpcs.sql`
- `supabase/migrations/20260504_create_coupons.sql`
- `supabase/migrations/20260506_add_order_coupon_columns.sql`

Production caveat:

- Production still needs migration application verification, RLS audit, row counts, duplicate checks, and data-source cutover validation.

### Completed Epic 3: Public Storefront and Workshop Browsing

Status: completed

What shipped:

- Public routes for home, workshops, adult workshops, holiday programmes, boxes, subscriptions, shop, products, blog, about, contact, cart, checkout, and order success.
- Workshop calendar/listing and workshop detail flow.
- Box/product listing and detail flow.
- Subscription detail page with curated box selection.
- Waitlist modal components for events and products.

Evidence:

- `app/src/router/index.js`
- `app/src/views/Home.vue`
- `app/src/views/Workshops.vue`
- `app/src/views/AdultWorkshops.vue`
- `app/src/views/HolidayProgramPage.vue`
- `app/src/views/WorkshopDetail.vue`
- `app/src/views/Boxes.vue`
- `app/src/views/BoxDetail.vue`
- `app/src/views/SubscriptionDetail.vue`
- `app/src/views/Shop.vue`
- `app/src/views/ProductDetail.vue`
- `app/src/components/JoinEventWaitlistModal.vue`
- `app/src/components/JoinProductWaitlistModal.vue`

Production caveat:

- CMS-driven editorial pages, final subscription journey, and browser smoke tests are launch work.

### Completed Epic 4: Cart and Guest Checkout Foundation

Status: completed

What shipped:

- Pinia cart store with LocalStorage persistence.
- Mixed cart support for products, events, and subscription items.
- Checkout form for guest customer details, event attendees, shipping details, and discount code.
- Supabase Edge Function call to create Stripe Checkout sessions.
- Order success page that fetches order details by Stripe session ID and retries while webhook processing catches up.

Evidence:

- `app/src/stores/cart.js`
- `app/src/views/Cart.vue`
- `app/src/views/Checkout.vue`
- `app/src/views/OrderSuccess.vue`
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/get-order-by-session/index.ts`

Production caveat:

- One-time checkout exists, but production launch needs full webhook/idempotency/capacity/coupon regression tests and a resolved recurring-subscription path.

### Completed Epic 5: Stripe Webhook and Order Processing Foundation

Status: completed

What shipped:

- Stripe webhook handler for checkout completion.
- Order and order item creation.
- Booking creation and booking attendee creation for event purchases.
- Inventory and event capacity decrement integration.
- Coupon redemption persistence and usage incrementing.
- Subscription event handling foundation for create/update/delete/payment events.
- `stripe_events` idempotency table from subscription fulfillment migration.

Evidence:

- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/stripe-webhook/README.md`
- `supabase/migrations/20260209_add_decrement_inventory_function.sql`
- `supabase/migrations/20260213_subscription_fulfillment.sql`
- `supabase/migrations/20260504_create_coupons.sql`

Production caveat:

- This is the highest-risk launch path and needs explicit Stripe retry/idempotency, capacity, inventory, coupon, and subscription tests.

### Completed Epic 6: Admin CMS and Commerce Back Office Foundation

Status: completed

What shipped:

- Admin layout and protected admin route tree.
- Offerings, blog, homepage content, navigation, settings, waitlists, bookings, orders, coupons, subscriptions, customers, inventory, analytics, and reviews screens.
- Shared rich text and image upload components.
- Component fields for event, product, digital product, and subscription offering types.

Evidence:

- `app/src/layouts/AdminLayout.vue`
- `app/src/views/admin/OfferingsList.vue`
- `app/src/views/admin/OfferingsForm.vue`
- `app/src/views/admin/BlogList.vue`
- `app/src/views/admin/BlogForm.vue`
- `app/src/views/admin/HomepageContent.vue`
- `app/src/views/admin/Navigation.vue`
- `app/src/views/admin/Settings.vue`
- `app/src/views/admin/OrdersList.vue`
- `app/src/views/admin/CouponsList.vue`
- `app/src/views/admin/SubscriptionsList.vue`
- `app/src/views/admin/CustomersList.vue`
- `app/src/views/admin/InventoryList.vue`
- `app/src/components/shared/RichTextEditor.vue`
- `app/src/components/shared/ImageUploader.vue`

Production caveat:

- Admin screens need production data QA, admin role assignment process, and route-level smoke tests.

### Completed Epic 7: CMS Foundation for Homepage, Menus, and Settings

Status: completed

What shipped:

- Page registry, typed page sections, site menus, menu items, site settings, and site image storage.
- Public CMS read helpers.
- Admin CMS helpers.
- Homepage rendering from CMS sections.
- Header and footer reading from CMS menus/settings with Vue fallbacks.

Evidence:

- `supabase/migrations/20260409_create_site_cms_foundation.sql`
- `supabase/migrations/20260410_add_footer_contact_site_settings.sql`
- `supabase/migrations/20260411_update_homepage_sections_for_sliders.sql`
- `supabase/migrations/20260501_add_footer_opening_times_setting.sql`
- `supabase/migrations/20260514_add_policy_info_pages.sql`
- `supabase/migrations/20260514_harden_event_capacity_rpcs.sql`
- `app/src/lib/cms.js`
- `app/src/views/Home.vue`
- `app/src/views/CmsInfoPage.vue`
- `app/src/components/home/HomeSectionRenderer.vue`
- `app/src/components/Navigation.vue`
- `app/src/components/Footer.vue`

Production caveat:

- FAQs, Privacy Policy, and Terms and Conditions now have CMS-backed routes and production records. About and Contact still use app routes backed by the page registry, and Behaviour Policy/final policy list still needs business confirmation.

### Completed Epic 8: Coupons Foundation

Status: completed

What shipped:

- Supabase coupon schema and coupon redemptions.
- Order-level coupon fields.
- Admin coupon management UI.
- Checkout-time coupon validation in the Edge Function.
- Stripe discount creation and coupon metadata persistence.
- Webhook coupon redemption recording.

Evidence:

- `supabase/migrations/20260504_create_coupons.sql`
- `supabase/migrations/20260506_add_order_coupon_columns.sql`
- `app/src/views/admin/CouponsList.vue`
- `app/src/views/Checkout.vue`
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

Production caveat:

- Legacy Firebase coupon admin must be frozen/removed, and coupon limits/scopes need regression tests.

### Completed Epic 9: Email Notification Foundation

Status: completed

What shipped:

- Supabase `send-email` function.
- Transactional templates for orders, admin orders, event bookings, reminders, waitlists, subscriptions, digital downloads, contact forms, and password reset.
- Email log table and email test scripts.

Evidence:

- `supabase/functions/send-email/index.ts`
- `supabase/functions/send-email/templates/`
- `supabase/functions/send-email/README.md`
- `supabase/migrations/20260206_email_logs.sql`
- `tests/email/`

Production caveat:

- Contact form is not fully wired to the email function, and subscription renewal/payment-failed email paths still need production verification.

### Completed Epic 10: Legacy Migration Groundwork

Status: completed

What shipped:

- Legacy app has Supabase client and event transformation helpers.
- Legacy event/calendar/category/detail flows have partial Supabase support.
- Legacy checkout path has started moving toward Supabase Edge Functions and Stripe Checkout.
- Migration scripts and guides exist for Firebase, bookings, term data, themes, WooCommerce products, inventory, and Supabase setup.

Evidence:

- `lola-workshops/src/lib/supabase.ts`
- `lola-workshops/src/views/PaymentView.vue`
- `lola-workshops/src/views/BasketView.vue`
- `lola-workshops/src/views/RegistrationView.vue`
- `scripts/migration/`
- `docs/LEGACY_WEBSITE_MIGRATION_EPIC.md`
- `docs/LOLAWORKSHOPS_INTEGRATION_AUDIT.md`
- `docs/woocommerce-migration-guide.md`
- `docs/woocommerce-migration-mapping.md`

Production caveat:

- This is not a launch-complete legacy migration. The confirmed launch direction is to retire `lola-workshops/` and remove Firebase dependencies.

## Section 2: Launch Epics

These launch epics are ordered by dependency and risk. Items earlier in the list unblock or de-risk later items.

### Launch Epic 1: Launch Shape, Cutover, and Roadmap Governance

Risk: critical
Depends on: none

Goal:

Lock the production shape around `app/`, Supabase, no Firebase, and a single current roadmap.

Scope:

- Confirm production domain and hosting target for `app/`.
- Confirm that `lola-workshops/` will not be a production dependency after launch.
- Define legacy URL redirect strategy. Event/workshop legacy route handling is implemented in `app/` and passed browser audit on 2026-05-14.
- Define launch-critical public/admin flows.
- Create a single roadmap status view.
- Keep this roadmap current as epics move from launch to completed.

Acceptance criteria:

- Production architecture is documented as `app/` only.
- Launch-critical flows are listed and owned.
- Legacy URL redirect ownership is documented.
- A release checklist and rollback outline exist.
- Docs identify this roadmap as current.

### Launch Epic 2: Supabase Source of Truth and Data Integrity

Risk: critical
Depends on: Launch Epic 1

Goal:

Prove Supabase is the complete and correct live data source before cutover.

Scope:

- Apply and verify all required Supabase migrations in production.
- Import or reconcile live product, workshop, booking, coupon, customer, subscription, content, and image data.
- Validate WooCommerce and Firebase exports against Supabase row counts.
- Check duplicate customers/bookings/orders/coupons by normalized keys.
- Validate event category, term grouping, holiday programme, inventory, and capacity records.
- Produce a data sign-off report.

Acceptance criteria:

- Supabase contains all launch-critical live data.
- Production migrations are verified.
- Row counts and key spot checks are documented.
- Duplicate and orphan-record reports are resolved or explicitly accepted.
- Firebase/WooCommerce are no longer required as runtime data sources.

### Launch Epic 3: Legacy App Retirement and Firebase Removal

Risk: critical
Depends on: Launch Epic 1, Launch Epic 2

Goal:

Retire `lola-workshops/` from production and remove Firebase from the final platform.

Scope:

- Audit remaining Firebase reads/writes in `lola-workshops/`.
- Identify any launch-critical legacy-only workflows.
- Port required workflows into `app/` and Supabase.
- Freeze legacy admin writes during cutover.
- Remove Firebase from production secrets, deploy docs, and runbooks.
- Archive or mark legacy Firebase docs as stale.

Acceptance criteria:

- No production flow requires Firebase.
- No production admin task requires `lola-workshops/`.
- Required legacy functionality has an `app/` equivalent or is explicitly retired.
- Firebase Functions are no longer part of launch operations.
- Stale Firebase/legacy docs are clearly marked.

### Launch Epic 4: CMS Editorial Pages and Site Information Architecture

Risk: high
Depends on: Launch Epic 2

Goal:

Make launch-critical editorial pages and navigation CMS-driven.

Progress:

- `/faqs`, `/privacy-policy`, and `/terms-and-conditions` now exist as CMS-backed app routes with published production `site_pages` records, enabled `page_sections`, footer links, and checkout links.
- Final policy wording still needs business/legal approval before production booking launch.

Scope:

- Convert About, Contact, FAQs, Terms, Privacy, Behaviour Policy, and other required policy pages to CMS-managed pages.
- Decide final policy page list.
- Seed CMS records for all launch editorial pages.
- Ensure header/footer menus point to CMS/app-route records correctly.
- Wire contact form to a verified table and/or email function.
- Add SEO metadata rendering for CMS-managed pages.
- Remove dependence on hard-coded editorial content where launch requires admin control.

Acceptance criteria:

- About, Contact, FAQs, and policy pages can be updated from admin/CMS data.
- Draft/published/hidden navigation behavior works.
- Header and footer menu content is manageable from admin.
- Contact submissions are stored and/or emailed reliably.
- SEO title/description are rendered for CMS pages.

### Launch Epic 5: Core Commerce and Webhook Hardening

Risk: critical
Depends on: Launch Epic 2

Goal:

Make one-time checkout, event bookings, coupons, inventory, capacity, order creation, and email side effects production-safe.

Progress:

- Event Cart And Checkout non-live audit is green on 2026-05-14: 19/19 checks passed for event add-to-cart from `/workshops/:slug`, `/adult-workshops`, and `/half-term`, checkout payload interception, capacity-before-Stripe checks, webhook order/booking/attendee/capacity paths, order success recovery, and production table reachability.
- Stripe Payment And Webhook Proof is sandbox payment-proof green on 2026-05-19. Order, order item, booking, attendee, success-page recovery, capacity consistency, Stripe event log, and order-linked `order-confirmation`, `event-booking-confirmation`, and `new-order-admin` sent logs pass after fixing the webhook/booking-trigger capacity double-count and protected `send-email` gateway auth.
- Replay/idempotency proof remains outstanding before the sandbox workstream is fully complete. Live Stripe cutover plus live-mode webhook proof are still required before this launch epic can be marked complete.

Scope:

- Test `create-checkout-session` for products, events, mixed carts, shipping, coupons, invalid carts, sold-out events, and out-of-stock products.
- Test `stripe-webhook` for successful payment, Stripe retries, duplicate events, failed DB writes, email failures, capacity decrement, inventory decrement, coupon redemption, and attendee creation.
- Cut over from Stripe sandbox/test mode to live mode before launch, including live secrets, live webhook endpoint signing secret, production app return URL, and live-mode proof evidence.
- Confirm order success retry behavior under delayed webhook processing.
- Confirm admin order details reflect discounts, shipping, attendees, fulfillment status, and customer data.
- Remove debug-level secrets/logging risk from production functions.
- Add operational troubleshooting guidance for failed webhooks or emails.

Acceptance criteria:

- A production-like test checkout creates the expected order, items, booking attendees, coupon redemption, inventory movement, capacity decrement, and emails.
- Duplicate Stripe webhook deliveries do not create duplicate business records.
- Sold-out and out-of-stock states are blocked before payment.
- Coupon usage limits and per-customer limits are enforced.
- Admin can inspect and support completed orders.

### Launch Epic 6: Magic-Link Customer Accounts and History

Risk: high
Depends on: Launch Epic 2, Launch Epic 5

Goal:

Let customers access orders, bookings, subscriptions, addresses, and downloads without password-first authentication.

Scope:

- Choose exact passwordless mechanism: Supabase magic link, email OTP, or custom signed-link flow.
- Audit customer uniqueness by normalized email.
- Link `customers.auth_user_id` after magic-link verification.
- Build customer account dashboard tabs for profile, orders, bookings, subscriptions, addresses, and downloads.
- Add claim/access CTAs from order success and transactional emails.
- Handle duplicate customer rows and already-claimed customers safely.
- Define support path for account-claim conflicts.

Acceptance criteria:

- Customer can request a magic link and access their account.
- Existing guest history appears after verified access.
- Orders, bookings, subscriptions, addresses, and downloads resolve through the customer record.
- Claim flow does not expose another customer's data.
- Duplicate/claimed-email edge cases are handled safely.

### Launch Epic 7: Subscription Launch and Fulfillment

Risk: critical
Depends on: Launch Epic 2, Launch Epic 5, Launch Epic 6

Goal:

Launch subscriptions as a recurring commerce flow with operational fulfillment.

Scope:

- Resolve the subscription purchase path so recurring subscriptions do not go through one-time payment-mode checkout.
- Validate direct subscription checkout and curated subscription selection behavior.
- Ensure selected box configuration is persisted through Stripe metadata, subscription records, and fulfillment records.
- Validate subscription webhook events for create, update, cancel, renewal payment success, and payment failure.
- Complete renewal success and payment-failed emails.
- Validate `stripe_events` idempotency for subscription events.
- Implement or verify default address selection for subscription fulfillment.
- Build/admin-verify packing, shipped, delivered, and tracking workflow for subscription renewal orders.
- Test cycle key and cutoff-day behavior.

Acceptance criteria:

- Customer can start a subscription in Stripe subscription mode.
- Subscription record and initial/renewal orders are created correctly.
- Selected boxes/configuration are visible to admin fulfillment.
- Renewal payments create exactly one fulfillment order per cycle.
- Failed payments update status and trigger customer communication.
- Admin can pack, mark shipped, add tracking, and complete subscription orders.

### Launch Epic 8: Production Deployment and Operations

Risk: high
Depends on: Launch Epics 1-7

Goal:

Make launch repeatable, observable, and reversible.

Scope:

- Finalize Netlify deployment configuration for `app/`.
- Finalize Supabase Edge Function deployment scripts.
- Inventory production secrets for app, Supabase, Stripe, Resend, and Netlify.
- Remove Firebase from production deployment and operations docs.
- Define smoke tests for browse, CMS pages, cart, checkout, webhook, email, admin login, account magic link, subscription, and order lookup.
- Define log review process for Supabase functions, Stripe webhooks, Resend, and Netlify.
- Create rollback and incident response guidance.

Acceptance criteria:

- A deploy can be run from documented steps.
- All required secrets are known and set in the right environments.
- Post-deploy smoke tests are documented and executable.
- Support/debug logs are known for checkout, webhook, email, and account access failures.
- Rollback path is documented before cutover.

### Launch Epic 9: Testing, RLS, and Quality Gate

Risk: high
Depends on: Launch Epics 2-8

Goal:

Create enough automated and manual coverage to launch without relying on ad hoc QA.

Scope:

- Add unit tests for shared helpers where practical.
- Add integration tests or scripted checks for Edge Functions.
- Add RLS verification scripts for public, authenticated customer, and admin access.
- Add browser smoke tests for launch-critical public flows.
- Add admin smoke tests for content, offerings, orders, subscriptions, and settings.
- Create a final manual QA checklist for cross-browser/mobile.

Acceptance criteria:

- RLS checks pass for anonymous, customer, and admin access patterns.
- Checkout/webhook/coupon/subscription scripts cover critical success and failure cases.
- Public and admin smoke tests pass before launch.
- Manual QA checklist is completed and signed off.

### Launch Epic 10: Documentation Consolidation

Risk: medium
Depends on: Launch Epic 1

Goal:

Make `docs/` the trusted project memory before production handover.

Scope:

- Move root-level Markdown planning files into `docs/`.
- Mark every doc as `current` or `stale`.
- Add stale warnings to docs that conflict with current launch decisions.
- Update `docs/README.md` into a current/stale index.
- Review production-sensitive docs for exact dashboard URLs, project references, and secret-handling guidance.

Acceptance criteria:

- No important project docs remain only at repo root.
- Every doc has visible status.
- Current docs agree with this production roadmap.
- Historical/stale docs remain available but are clearly labelled.

## Non-Launch / Post-Launch Backlog

These are valuable but should not block production unless scope changes:

- Basket recommendations from co-purchase data.
- Advanced customer service tooling.
- Richer page templates and visual CMS flexibility.
- Manual merchandising and featured collections.
- Advanced subscription swaps and pause/resume UX beyond launch minimum.
- Ingredient-level stock control.
- Loyalty, gift cards, and advanced promotions.

## Recommended Delivery Order

1. Launch shape and governance.
2. Supabase data integrity.
3. Legacy/Firebase retirement.
4. CMS editorial pages.
5. Core commerce and webhook hardening.
6. Magic-link accounts and customer history.
7. Subscription launch and fulfillment.
8. Production deployment and operations.
9. Testing, RLS, and quality gate.
10. Documentation consolidation.

The order is not meant to force serial execution. Several epics can run in parallel, but later epics should not be signed off before their listed dependencies are resolved.
