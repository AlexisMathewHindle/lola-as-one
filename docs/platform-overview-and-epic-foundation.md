# Lola As One Platform Overview and Epic Foundation

Last updated: 2026-05-10

## Purpose

This document is a working inventory of the whole Lola As One platform: the legacy Lola Workshops app, the new Lola As One app, the shared Supabase backend, and the migration/deployment tooling around them.

The goal is not to replace the detailed epic documents already in this repo. The goal is to create one planning baseline that can be turned into a clean set of epics for:

- work already completed
- work partly completed
- work still needed before production launch
- legacy functionality that must be migrated, retired, or deliberately kept

## Repository Map

| Area | Path | Role |
| --- | --- | --- |
| New customer/admin app | `app/` | Vue 3 + Vite storefront, admin CMS, commerce UI, account shell, Supabase client |
| Legacy workshop app | `lola-workshops/` | Vue CLI/Vuetify workshop site with Firebase heritage and partial Supabase migration |
| Supabase backend | `supabase/` | Edge Functions, database migrations, local config |
| Migration scripts | `scripts/migration/` | Firebase/Supabase migration utilities and SQL repair scripts |
| Operational scripts | `scripts/` | Stripe, email, inventory, deployment, diagnostic, and data repair helpers |
| Project docs | `docs/` | Target home for all current and historical docs, each marked current or stale |
| Root-level docs | root `*.md` files | Existing notes that should be moved into `docs/` or archived as part of doc governance cleanup |
| Email tests | `tests/email/` | Shell tests for transactional email scenarios |

## High-Level Architecture

The platform is moving from a Firebase-led workshop site toward a Supabase-led unified commerce and content platform.

The confirmed production direction is:

1. The new `app/` project becomes the main public and admin application.
2. Supabase becomes the single source of truth for offerings, events, products, orders, bookings, inventory, customers, coupons, content, menus, and settings.
3. Stripe Checkout handles payment collection.
4. Supabase Edge Functions own checkout creation, webhook processing, email dispatch, subscription validation, and order lookup.
5. The legacy `lola-workshops/` app is retired once the new app launches.
6. Firebase is removed from the production platform.
7. Customer accounts should use a passwordless magic-link style flow rather than a traditional password-first account model where practical.
8. Subscriptions are in launch scope, not a post-launch-only feature.
9. About, Contact, FAQs, and policy pages are CMS-managed for launch.

## Confirmed Launch Decisions

| Decision | Confirmed direction |
| --- | --- |
| Production app | `app/` is the production launch application |
| Legacy app | `lola-workshops/` is not required after the new app launches |
| Source of truth | Supabase is the final source of truth for live data |
| Firebase | Firebase is not needed in the final production platform |
| Accounts | Customer accounts may be required, but should be passwordless/magic-link oriented rather than password-first |
| Subscriptions | Subscriptions are part of launch scope |
| Editorial pages | About, Contact, FAQs, and policy pages should be CMS-driven |
| Documentation | All docs should live under `docs/` and be marked current or stale |

## Applications

### New App: `app/`

Stack:

- Vue 3
- Vite
- Vue Router 4
- Pinia
- Tailwind CSS
- Font Awesome
- Supabase JS
- Stripe Checkout via Supabase Edge Functions
- Tiptap for rich text editing

Primary public routes:

- `/`
- `/workshops`
- `/adult-workshops`
- `/half-term`
- `/summer-holiday`
- `/workshops/:slug`
- `/boxes`
- `/boxes/:slug`
- `/subscriptions/:slug`
- `/shop`
- `/products/:slug`
- `/cart`
- `/checkout`
- `/order/success`
- `/blog`
- `/blog/:slug`
- `/about`
- `/contact`
- `/account`
- `/login`

Primary admin routes:

- `/admin`
- `/admin/offerings`
- `/admin/blog`
- `/admin/homepage`
- `/admin/navigation`
- `/admin/waitlists`
- `/admin/events/bookings`
- `/admin/events/categories`
- `/admin/orders`
- `/admin/coupons`
- `/admin/subscriptions`
- `/admin/customers`
- `/admin/inventory`
- `/admin/analytics`
- `/admin/reviews`
- `/admin/settings`

Implemented new-app capabilities:

- Public workshop listing and detail flow.
- Public holiday programme pages for half term and summer holiday.
- Public boxes, shop, product detail, and subscription detail pages.
- LocalStorage-backed cart through Pinia.
- Checkout form for guest customer data, shipping data, event attendees, and coupon code entry.
- Stripe Checkout session creation through `create-checkout-session`.
- Order success page with retry loop while the webhook finishes processing.
- Supabase-backed homepage rendering using `site_pages` and `page_sections`.
- Supabase-backed header/footer menus and public site settings, with fallback content in Vue.
- Admin offering CRUD patterns for events, products, digital products, and subscriptions.
- Admin blog list/form with rich text editing.
- Admin homepage, navigation, settings, coupons, waitlists, orders, customers, inventory, subscriptions, analytics, reviews, and event booking screens.
- Customer-facing waitlist modals for sold-out events and out-of-stock products.

Known new-app gaps or risks:

- `app/src/views/Account.vue` is still a placeholder shell; real order, booking, subscription, address, and claim history are not implemented there.
- Contact form writes to `contact_submissions` through `submit-contact-form`, which also sends the customer confirmation and admin notification email templates.
- Subscription detail lets customers configure curated boxes and add a subscription to the cart, but subscription checkout and webhook fulfillment still need production verification.
- Curated subscription items in the cart flow currently go through the standard `create-checkout-session` payment-mode function unless explicitly routed elsewhere; direct subscription checkout from `BoxDetail.vue` uses `create-subscription-checkout-session`.
- Some detailed docs say older milestones are complete, while newer code and epic notes show remaining work. Use code and current migrations as the planning source of truth.
- Public routes still depend on fallback CMS/menu content when Supabase content is missing or RLS blocks reads.
- Admin authorization relies on `user.app_metadata.role === 'admin'`; production readiness depends on a reliable role assignment process.

### Legacy App: `lola-workshops/`

Stack:

- Vue CLI
- Vue 3
- TypeScript
- Vuetify
- Vuex
- Pinia cart store added for migration compatibility
- Firebase Auth, Analytics, Firestore, and Firebase Functions
- Supabase JS added for event/catalog migration
- Stripe Checkout migration started

Primary public routes:

- `/`
- `/event-details/:id`
- `/category/:categorySlug`
- `/checkout`
- `/basket`
- `/registration`
- `/booking/:id`
- `/order/success`
- `/about`
- `/behaviour-policy`
- `/adult-art-workshops`
- `/private-parties`
- `/summer-workshops`
- `/holiday-workshops`
- `/half-term`
- `/terms-and-conditions`
- `/faqs`

Primary admin routes:

- `/admin/dashboard`
- `/admin/event-edit/:id`
- `/admin/bookings`
- `/admin/coupons`
- `/admin/settings`
- `/admin/events`
- `/admin/downloads`
- `/admin/upload`

Implemented legacy migration work:

- Legacy Supabase client exists in `lola-workshops/src/lib/supabase.ts`.
- Future event reads can come from Supabase `offering_events` joined to `offerings`, `event_categories`, and `event_capacity`.
- Event transformation helpers map Supabase records into the old Firebase-shaped component contract.
- Calendar/detail/category flows have partial Supabase support.
- Basket has started using the new Pinia cart store and Supabase coupon/capacity helpers.
- Registration has Supabase helper imports and comments marking old Firestore update paths as deprecated.
- Payment view now calls the Supabase `create-checkout-session` function and leaves booking/capacity creation to the Stripe webhook.
- Legacy `/order/success` route exists for Stripe return redirects.

Remaining Firebase dependence in legacy:

- Firebase app, auth, analytics, and Firestore are still initialized in `lola-workshops/src/main.ts`.
- Legacy router still uses Firebase Auth and Analytics.
- Legacy Firebase Functions remain under `lola-workshops/functions/` for newsletter, email, cron, and historical Stripe logic.
- Multiple legacy admin and import screens still use Firestore collections such as `events`, `themes`, `bookings`, `coupons`, and `adult_workshops`.
- `BookingView.vue`, `BookingsListComponent.vue`, `DashboardView.vue`, `EventsView.vue`, `ThemesView.vue`, upload/download components, and coupon admin still have Firestore code paths.
- Some public legacy pages for summer, half-term, adult workshops, and booking management still reference Firebase data sources.

Legacy planning implication:

The legacy app is not Firebase-free and is not part of the final production launch architecture. It should be treated as a source to audit, port from, and retire, not as a long-term parallel app.

Any feature that only exists in `lola-workshops/` and is still needed at launch should be rebuilt or migrated into `app/` and Supabase. Remaining Firebase write paths should not be kept as production dependencies.

## Backend and Data Model

### Core Supabase Schema

The base schema in `docs/migrations/schema.sql` defines the broad unified model:

- customers
- offerings
- offering_events
- offering_products
- product_variants
- product_reviews
- offering_digital_products
- categories and tags
- content pages and blog posts
- URL redirects
- carts and cart items
- orders, order items, payments, fulfillments, refunds
- subscriptions, subscription items, subscription events, subscription invoices, subscription plan boxes
- inventory items and inventory movements
- box components, component inventory, recipes, assemblies
- event capacity, event capacity holds
- bookings and booking attendees
- digital downloads and download links

Important newer migrations:

- `20260206_email_logs.sql`: email delivery logging.
- `20260208_fix_bookings_and_functions.sql`: booking table/function fixes.
- `20260208_fix_customers_id.sql`: decouples customers from auth user identity.
- `20260209_add_decrement_inventory_function.sql`: inventory decrement RPC.
- `20260209_enable_inventory_public_read.sql`: public inventory read policy.
- `20260213_subscription_fulfillment.sql`: subscription cycle fulfillment fields, plans, addresses, and `stripe_events`.
- `20260214_add_secondary_images_to_offerings.sql`: secondary offering images.
- `20260313_*`: event category image and storage work.
- `20260408_*`: event category layout metadata and capacity sync.
- `20260409_create_site_cms_foundation.sql`: page registry, page sections, menus, menu items, site settings, site image storage.
- `20260410_add_footer_contact_site_settings.sql`: footer/contact settings.
- `20260411_update_homepage_sections_for_sliders.sql`: homepage section updates.
- `20260501_add_footer_opening_times_setting.sql`: opening times setting.
- `20260501_add_holiday_program_pages.sql`: holiday programme pages.
- `20260504_create_coupons.sql`: coupons and coupon redemptions.
- `20260506_add_order_coupon_columns.sql`: order-level coupon fields.

### Content and CMS Model

The new CMS direction is a thin typed CMS, not a full drag-and-drop page builder.

Implemented primitives:

- `site_pages`: public page registry for both CMS pages and Vue app routes.
- `page_sections`: typed content blocks for CMS-rendered pages.
- `site_menus` and `site_menu_items`: header/footer menu data.
- `site_settings`: global branding, footer, contact, social, opening-hours settings.
- `site-images` bucket for CMS-managed images.

Current frontend usage:

- `app/src/lib/cms.js` contains public and admin helpers for pages, sections, menus, and settings.
- `app/src/views/Home.vue` fetches the `home` page and renders sections through `HomeSectionRenderer`.
- `app/src/components/Navigation.vue` reads `header_primary`, with a hard-coded fallback.
- `app/src/components/Footer.vue` reads `footer_primary`, `footer_secondary`, and public site settings, with hard-coded fallbacks.
- Admin screens exist for homepage content, navigation, and settings.

Planning notes:

- About and Contact still render as app-route pages, not fully CMS pages.
- The homepage uses both Supabase section data and in-code default sections. That is useful for resilience, but production content ownership should be clarified.
- The next CMS epics should separate content model completion, admin UX, and public rendering polish.

### Commerce Model

Implemented or partially implemented commerce capabilities:

- Physical products and boxes.
- Digital products.
- Subscription offerings and curated subscription boxes.
- Event/workshop bookings.
- Mixed cart.
- Guest checkout.
- Stripe Checkout.
- Coupon validation and discounting through the checkout edge function.
- Webhook-created orders, order items, bookings, coupon redemptions, inventory changes, and capacity changes.
- Admin order, coupon, inventory, subscription, customer, and analytics views.

Key backend functions:

- `create-checkout-session`: validates cart, capacity, inventory, coupons, creates Stripe Checkout session.
- `stripe-webhook`: handles checkout completion, order creation, booking creation, inventory decrement, event capacity decrement, coupon redemption, transactional email calls, and subscription Stripe events.
- `get-order-by-session`: returns a public-safe order summary for the success page.
- `create-subscription-checkout-session`: creates Stripe Checkout sessions in subscription mode.
- `validate-subscription-boxes`: validates curated subscription box selections.
- `send-email`: sends transactional emails through templates and logs delivery attempts.

Known commerce gaps or risks:

- Account history is not surfaced to customers yet.
- Guest checkout exists, but post-purchase account claiming is not implemented.
- Subscription checkout has two competing paths: a direct subscription-mode Edge Function and the normal cart checkout path. The intended customer journey needs to be resolved before production.
- Subscription webhook support has been added, but TODOs remain for subscription renewal and failed-payment emails.
- Subscription fulfillment needs end-to-end production validation: cycle keys, address selection, packing queue, tracking, renewal orders, idempotency, and admin shipment workflow.
- Coupon support exists in new checkout/admin/backend, but legacy coupon management still exists in Firebase and should be retired or explicitly frozen.
- There is no clear automated regression test suite for checkout, webhook processing, coupons, and subscriptions.

### Email System

Supabase email function:

- `supabase/functions/send-email/index.ts`

Templates include:

- order confirmation
- new order admin
- order shipped
- event booking confirmation
- event reminders
- waitlist event/product available
- subscription activated
- subscription renewal success
- subscription payment failed
- digital download ready
- contact form admin/customer
- password reset

Email-related planning notes:

- Email logs exist through `email_logs`.
- Shell tests exist under `tests/email/`.
- Legacy Firebase email functions still exist.
- Contact form frontend currently writes to a table rather than calling the email function.

## Migration State

### Already Done or Mostly Done

- Supabase schema foundation exists.
- New app Vite project exists and is broad enough to cover public and admin needs.
- New public storefront routes exist.
- New admin sections exist.
- Stripe Checkout integration exists for one-time mixed carts.
- Stripe webhook creates orders and bookings.
- Email templates and send-email function exist.
- CMS foundation tables and admin/public read helpers exist.
- Coupons have Supabase schema, admin screen, checkout validation, webhook persistence, and order discount fields.
- Legacy app can read many event records from Supabase.

### In Progress or Partially Done

- Legacy-to-new-app retirement and feature parity audit.
- Homepage CMS/admin rollout.
- Navigation/footer settings rollout.
- Subscription customer selection and backend validation.
- Subscription webhook/fulfillment workflow.
- Term/holiday event grouping and category layout.
- Event category images and category CMS support.
- Documentation consolidation into `docs/` with current/stale status.

### Not Yet Done

- Customer account dashboard with real orders, bookings, subscriptions, addresses, and downloads.
- Magic-link customer access and post-purchase account claiming.
- Full redirect implementation and SEO launch checks.
- Final Firebase decommission execution.
- Final data migration validation from Firebase and WooCommerce.
- CMS conversion for About, Contact, FAQs, and policy pages.
- Contact form database migration and email delivery path.
- Automated tests around edge functions, checkout, webhook idempotency, capacity, inventory, coupons, and RLS.
- Production monitoring, alerting, secrets inventory, and rollback runbook.

## Existing Epic and Planning Documents

Important docs already in the repo:

- `docs/epic-0-summary.md`
- `docs/epic-1-domain-model.md`
- `docs/epic-2-content-audit.md`
- `docs/epic-3-url-strategy.md`
- `docs/epic-5-project-setup.md`
- `docs/epic-6-admin-cms.md`
- `docs/epic-7-customer-frontend.md`
- `LOLA-AS-ONE-CONTENT-MANAGEMENT-EPIC.md`
- `LOLA-AS-ONE-CMS-PHASE-0-1-TASKS.md`
- `GUEST-CHECKOUT-ACCOUNT-CLAIM-EPIC.md`
- `COUPONS-SUPABASE-MIGRATION-EPIC.md`
- `BASKET-RECOMMENDATIONS-EPIC.md`
- `docs/LEGACY_WEBSITE_MIGRATION_EPIC.md`
- `docs/LOLAWORKSHOPS_INTEGRATION_AUDIT.md`
- `docs/subscription-epic-audit.md`
- `docs/stripe-backend-integration-plan.md`
- `docs/content-governance.md`

Doc hygiene issues to resolve:

- Some docs are stale relative to current code and migrations.
- Some epic statuses conflict with newer implementation state.
- Several implementation notes live at repo root rather than inside `docs/`.
- Some production-sensitive guides include exact project references and dashboard URLs; these may need a deployment/secrets review before wider sharing.

Doc governance decision:

- Move or copy root-level planning docs into `docs/`.
- Mark every doc as `current` or `stale`.
- Keep stale docs available when they preserve useful history, but make their status obvious at the top.
- Treat this file as current until a more detailed production roadmap replaces it.

## Production Readiness Snapshot

### Can Be Considered Implemented

- New app project scaffold and broad route map.
- Supabase client wiring.
- Public browse/detail/cart/checkout route flow.
- Stripe Checkout session creation for mixed carts.
- Checkout success order lookup.
- Stripe webhook order/booking processing.
- Admin UI coverage for core content and commerce areas.
- CMS foundation for homepage, menus, footer/settings.
- Coupon schema, admin, checkout, and webhook support.
- Email function and transactional templates.

### Needs Production Hardening

- RLS audit across all public/admin/client-accessed tables.
- Edge function idempotency and retry behavior under Stripe retries.
- Capacity/inventory race-condition testing.
- Coupon usage-limit and per-customer-limit tests.
- Subscription billing and fulfillment tests.
- Magic-link account access and customer-claiming security.
- Admin role assignment and support process.
- Contact form and email delivery path.
- Error states and support messaging for payment, webhook, and email failure.
- Data migration row counts, duplicate detection, and rollback scripts.
- SEO redirects and canonical metadata.
- Build/deploy environment parity.

### Clear Launch Blockers

- Launch `app/` as the production app and ensure all launch-critical legacy functionality has moved there.
- Remove Firebase as a production dependency.
- Implement real customer account history and magic-link account claiming/access.
- Make subscription checkout, billing, renewal, fulfillment, and admin operations production-ready.
- Convert About, Contact, FAQs, and policy pages to CMS-driven pages.
- Validate live Stripe webhook behavior for one-time orders, event bookings, coupons, and subscriptions.
- Confirm all required Supabase migrations are applied in production.
- Confirm Supabase is the final live source of truth for migrated product, workshop, booking, coupon, customer, and subscription data.
- Confirm contact form storage/email path works in production.
- Consolidate docs under `docs/` and mark each current or stale.
- Complete deployment runbook, secrets inventory, and smoke-test checklist.

## Suggested Epic Backlog From This Inventory

This is a starting point for the next planning pass.

### Epic A: Launch Shape and Roadmap Governance

Goal: Codify the confirmed launch shape and create one production roadmap.

Candidate stories:

- Document that `app/` is the only production app at launch.
- Define production domains, legacy redirects, and cutover behavior.
- Define which pages and flows must exist before public launch.
- Freeze doc statuses and create one canonical roadmap.
- Create release checklist and rollback plan.

### Epic B: Legacy App Retirement and Firebase Removal

Goal: Retire `lola-workshops/` and remove Firebase as a production dependency.

Candidate stories:

- Audit every remaining Firebase read/write in `lola-workshops/`.
- Identify launch-critical legacy routes or admin workflows that still need equivalents in `app/`.
- Port required legacy functionality into `app/` and Supabase.
- Freeze legacy Firebase admin writes during cutover.
- Remove or archive Firebase Functions after equivalent Supabase flows are live.
- Remove Firebase secrets, deploy hooks, and runbook steps from the final production checklist.

### Epic C: Magic-Link Customer Accounts and Claiming

Goal: Let customers access their history through passwordless account access.

Candidate stories:

- Enforce or audit customer uniqueness by normalized email.
- Choose the exact magic-link mechanism, likely Supabase passwordless email auth.
- Link `customers.auth_user_id` to Supabase auth users after magic-link verification.
- Build account dashboard tabs for profile, orders, bookings, subscriptions, addresses, and downloads.
- Add magic-link claim CTA from order success and confirmation emails.
- Handle duplicate customer rows and already-claimed records safely.
- Avoid password-first UX unless a later security decision requires it.

### Epic D: Checkout, Orders, Coupons, and Webhook Hardening

Goal: Make payment flows production safe.

Candidate stories:

- Add automated tests for `create-checkout-session`.
- Add webhook idempotency tests for `stripe-webhook`.
- Validate inventory decrement, event capacity decrement, and booking attendee creation.
- Test coupon date windows, usage limits, per-customer limits, scopes, and Stripe discount totals.
- Confirm order success retry behavior for delayed webhooks.
- Add support/admin troubleshooting views for failed webhook or email events.

### Epic E: Subscription Fulfillment

Goal: Make recurring boxes operational after checkout.

Candidate stories:

- Resolve the intended subscription purchase path so recurring subscriptions do not accidentally go through one-time payment-mode checkout.
- Validate subscription checkout creation and metadata.
- Confirm `stripe_events` idempotency for subscription events.
- Complete renewal success and payment failed emails.
- Build or validate address selection/default address workflow.
- Build admin packing/shipping queue for subscription renewal orders.
- Add tracking and shipped/delivered status workflow.
- Test monthly cycle key calculation and cutoff behavior.

### Epic F: CMS and Site Content Rollout

Goal: Make launch-critical editorial pages manageable without code changes.

Candidate stories:

- Apply and verify CMS migrations in production.
- Make homepage section defaults fully admin-owned or deliberately keep code defaults.
- Convert About, Contact, FAQs, and policy pages into CMS-managed pages.
- Finalize header/footer menu admin workflow.
- Connect contact form to a verified table and/or email function.
- Add SEO metadata rendering for CMS pages and app routes.

### Epic G: Data Migration and Content Integrity

Goal: Prove Supabase is the final source of truth.

Candidate stories:

- Complete Firebase event/theme/booking export validation.
- Complete WooCommerce product/order/content import validation.
- Import or reconcile all live launch data into Supabase.
- Validate event category, term grouping, and holiday programme data.
- Validate image migration to Supabase Storage.
- Run duplicate customer, booking, order, and coupon checks.
- Produce final row-count and spot-check report.

### Epic H: Production Deployment and Operations

Goal: Make launch repeatable and supportable.

Candidate stories:

- Finalize Netlify build/deploy configuration.
- Finalize Supabase Edge Function deployment scripts.
- Inventory required secrets for app, Supabase, Stripe, Resend, and Netlify.
- Remove Firebase from production operations documentation.
- Add smoke tests for public browse, cart, checkout, webhook, email, admin login, and order lookup.
- Define monitoring/log review for Supabase functions, Stripe webhooks, Resend, and Netlify deploys.
- Document rollback and incident response steps.

### Epic I: Testing and Quality

Goal: Build confidence without relying only on manual QA.

Candidate stories:

- Add unit tests for shared helpers such as cycle helpers and cart normalization.
- Add integration tests for Supabase Edge Functions with mocked Stripe/Supabase clients where practical.
- Add browser smoke tests for public critical paths.
- Add RLS verification SQL scripts for public, authenticated customer, and admin roles.
- Add regression checklist for legacy-to-new migration cutover.

### Epic J: Documentation Consolidation

Goal: Make the docs folder the trusted project memory.

Candidate stories:

- Move root-level Markdown planning files into `docs/`.
- Add a status marker to every doc: `current` or `stale`.
- Add a short stale notice to historical docs that conflict with current launch decisions.
- Update `docs/README.md` into a current/stale index.
- Review production-sensitive docs for dashboard URLs, project references, and secret-handling guidance.

### Epic K: Growth and Post-Launch Enhancements

Goal: Keep non-blocking product ideas out of the launch critical path.

Candidate stories:

- Basket recommendations using co-purchase data.
- Advanced customer service tools.
- Richer content page templates.
- Manual merchandising and featured collections.
- Advanced subscription swaps/pauses.
- Ingredient-level stock control.
- Loyalty, gift cards, and advanced promotions.

## Resolved Launch Questions

- Production launch app: `app/`.
- Legacy app after launch: not required.
- Customer accounts: acceptable or required, but should be magic-link/passwordless oriented rather than password-first.
- Subscriptions: part of launch.
- About, Contact, FAQs, and policy pages: CMS-driven.
- Firebase: not needed in final production.
- Documentation: all docs should live under `docs/` and be marked current or stale.
- Final live data source: Supabase.

## Remaining Detail Questions

- Which exact passwordless mechanism should be used for magic-link account access: Supabase email OTP, Supabase magic link, or a custom signed-link flow?
- Which policy pages are required for launch beyond Terms, Privacy, FAQs, and Behaviour Policy?
- Which root-level docs should be moved as-is, merged, or archived as stale history?
- Which subscription plans and curated box-selection rules are launch-critical?
- What is the final production domain and redirect map from legacy URLs?

## Roadmap Output

A production roadmap has been created from this inventory:

- `docs/production-roadmap.md`

It has two sections:

1. Completed epics, backed by shipped code paths and migrations.
2. Launch epics, ordered by dependency and risk.

The roadmap avoids feature wishlists and focuses on the now-confirmed launch direction: `app/` only, Supabase as source of truth, no Firebase, magic-link customer access, subscriptions in scope, CMS-managed editorial pages, documentation governance, production deployment, and smoke-test coverage.
