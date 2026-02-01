# Epic 0: CMS Principles + Platform Decisions + Commerce Scope

**Timeline:** 1–2 days
**Status:** In Progress
**Last Updated:** 2026-01-31

## Purpose

Establish clear boundaries for what "simple" means in v1 and what features are explicitly deferred to v2. **Prevents accidentally rebuilding Shopify.** This document serves as the source of truth for scope decisions.

---

## Core Decisions (LOCKED)

### 1. Offering Types in v1
- ✅ **Event** — Time-based offerings with scheduling
- ✅ **Product** — Physical or digital goods
- ❌ **NOT in v1:** Services, memberships, subscriptions, courses

### 2. Status Flow
All content follows this lifecycle:

```
draft → scheduled → published → archived
```

- **draft** — Work in progress, not visible to public
- **scheduled** — Queued for auto-publish at specific date/time
- **published** — Live and visible on frontend
- **archived** — Hidden from public but retained in system

**NOT in v1:** Versioning, revision history, soft deletes with restore

### 3. Admin Roles
- ✅ **admin** — Full access (create, edit, publish, delete, manage users)
- ✅ **editor** — Create and edit content, submit for review
- ⚠️ **viewer** (optional) — Read-only access to CMS

**NOT in v1:** Custom roles, granular permissions per content type, approval workflows

### 4. Frontend-Driven CMS Philosophy
The CMS controls **exactly** what appears on the frontend:
- Homepage blocks/sections
- Navigation menus
- Featured content
- Category pages
- Individual offering pages

**Key Principle:** Frontend queries CMS data; CMS dictates structure and visibility.

---

## Platform Decisions (LOCKED)

### 5. Payments & Cart
- ✅ **Stripe** — Payment processor
- ✅ **Stripe Checkout** — Hosted payment pages
- ✅ **Custom Cart** — Session-based cart for mixed items (boxes + events)
- ❌ **NOT in v1:** Stripe Elements (embedded payment form), PayPal, Apple Pay standalone

**v1 Approach:** Custom cart → Stripe Checkout → webhook-driven order fulfillment

**Rationale:**
- Custom cart required to support mixed-item orders (boxes + events in one purchase)
- Stripe Checkout handles PCI compliance, fraud detection, and payment UI
- Webhooks trigger order creation and inventory updates after successful payment
- Cart stored in browser localStorage (no server-side storage needed)

### 6. Product Types
- ✅ **Physical products** — Boxes (one-time purchase)
- ✅ **Subscriptions** — Monthly recurring box deliveries (existing feature, must migrate)
- ✅ **Digital products** — Gift cards, downloadable content (Supabase Storage)
- ❌ **NOT in v1:** Complex bundles, product variants

**Confirmed:**
- Monthly subscriptions via Stripe Subscriptions (single tier)
- Subscribe/pause/resume/cancel functionality required (pause is NEW feature)
- Anniversary-based billing (charged monthly on signup date)
- Stripe handles failed payments (automatic retries)
- No trial periods
- Users can buy one-time boxes AND subscribe (separate checkouts)
- Digital gift cards and downloads included in v1

### 7. Shipping
- ✅ **UK-only** — Domestic shipping first
- ✅ **Flat rate** — Single shipping cost for all orders (v1)
- 🔄 **v2:** Weight-based, international, multiple carriers

**v1 Shipping Logic:**
- Single flat rate applied at checkout
- ⚠️ **To confirm later:** Exact flat rate amount (e.g., £4.95)
- No real-time carrier rates
- Manual fulfillment (admin receives order, ships via preferred carrier)

### 8. Tax/VAT
- ✅ **Basic VAT handling** — Include VAT in prices (UK standard 20%)
- ✅ **Stripe Tax** (optional) — Auto-calculate VAT if needed
- 🔄 **v2:** Proper VAT invoicing, EU/international tax rules

**v1 Approach:**
- Prices displayed include VAT
- Stripe can handle VAT calculation if configured
- No complex tax exemptions or multi-region rules

### 9. Event Bookings
- ✅ **Pay-to-book via Stripe** — Immediate payment confirms booking
- ✅ **Capacity tracking** — Auto-decrement available spaces on booking
- ✅ **Mix with products** — Events can be added to cart alongside boxes
- ❌ **NOT in v1:** "Request booking" workflow, waitlists, deposits, installment payments

**v1 Event Flow:**
1. User selects event
2. Adds to cart (can mix with products)
3. Proceeds to checkout
4. Redirected to Stripe Checkout
5. Payment processed
6. Webhook creates booking record and decrements capacity
7. Confirmation email sent

**v2 Enhancements:** Waitlists, partial payments, manual approval

### 10. Inventory Management
- ✅ **Auto-decrement on purchase** — Stock (boxes) and capacity (events) updated automatically
- ✅ **Validation before checkout** — Prevent overselling
- ✅ **Out of stock handling** — Disable "Add to Cart" when unavailable
- ❌ **NOT in v1:** Inventory reservations during checkout, low stock alerts, SKU management

**v1 Approach:**
- **Products:** Track stock count, decrement on successful payment
- **Events:** Track capacity and current bookings, increment on successful payment
- Validation at checkout prevents race conditions

### 10. Digital Products
- ✅ **Gift cards** — Stripe supports natively (digital delivery)
- ✅ **Digital downloads** — PDFs, videos, etc.
- ✅ **File hosting** — Supabase Storage
- ✅ **Access control** — Authenticated download links (time-limited or one-time use)

**v1 Approach:**
- Gift cards: Stripe handles code generation and delivery
- Downloads: Files stored in Supabase Storage
- After purchase, customer receives download link (expires after X days or downloads)
- Admin uploads files via CMS

**v2 Enhancements:**
- Download limits per purchase
- Streaming for video content
- DRM protection

### 11. Customer Accounts
- ✅ **Customer accounts REQUIRED** — Needed for subscription management
- ✅ **Guest checkout** for one-time purchases (boxes, events, digital products)
- ✅ **Customer dashboard** for subscription management (pause/resume/cancel)

**v1 Approach (confirmed):**
- Customer accounts with email/password login
- Subscribers log in to manage subscription (pause, resume, cancel, update payment)
- Guest checkout still available for one-time purchases (no account required)
- After guest purchase, option to create account (optional)

**Key features:**
- View subscription status and next billing date (anniversary-based)
- Pause/resume/cancel subscription (pause is NEW feature)
- Update payment method
- View billing history
- View order history (subscriptions + one-time purchases)
- Access digital downloads from order history

### 12. Tech Stack (Confirmed)
- ✅ **Frontend:** Vue 3 + Tailwind CSS
- ✅ **Backend/Database:** Supabase (PostgreSQL + Auth + Storage)
- ✅ **Payments:** Stripe (Checkout + Subscriptions)
- ✅ **Email:** Nodemailer (currently on Firebase Functions, will migrate)
- ✅ **File Storage:** Supabase Storage (for digital downloads, product images)

**Key Decisions:**
- Supabase provides: Database, Authentication, File Storage, Real-time subscriptions
- Vue 3 for reactive UI and component-based architecture
- Tailwind for rapid UI development
- Stripe for all payment processing (one-time + subscriptions)
- Email service to be migrated from Firebase Functions to Supabase Edge Functions or similar

### 13. Shipping Labels
- ❌ **NOT in v1** — Manual fulfillment
- 🔄 **v2 (nice-to-have):** Automated label generation (Shippo, EasyPost)

**v1 Approach:**
- Admin manually ships orders via preferred carrier
- Admin marks order as "fulfilled" in CMS

---

## What's In / What's Out

See: [CMS Feature Checklist](./cms-feature-checklist.md)
See: [Commerce Scope Guardrails](./commerce-scope-guardrails.md)
See: [Cart Architecture](./cart-architecture.md)
See: [Subscription Model](./subscription-model.md)

---

## Naming Conventions

See: [Naming Conventions](./naming-conventions.md)

---

## Content Governance

See: [Content Governance](./content-governance.md)

---

## Success Criteria

Epic 0 is complete when:
- [x] All stakeholders agree on v1 scope
- [x] Platform decisions locked (Stripe, shipping, tax)
- [x] Commerce scope defined (custom cart, inventory management)
- [x] Feature checklist is reviewed and approved
- [x] Naming conventions are documented
- [x] Content governance roles are defined
- [x] Cart architecture documented
- [x] No ambiguity remains about what's in/out of v1

