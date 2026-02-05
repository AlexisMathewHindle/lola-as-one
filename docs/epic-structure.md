# Epic Structure — Lola As One CMS

**Last Updated:** 2026-02-01  
**Status:** 🚧 In Progress

---

## Overview

This document outlines the epic structure for building the Lola As One unified CMS platform, combining:
- **Lola Creative Space** (workshops/creative experiences)
- **Lots of Lovely Art** (boxes/gifting/subscriptions)

---

## Epic Roadmap

### ✅ Epic 0 — Platform Decisions + v1 Commerce Scope
**Status:** COMPLETE  
**Goal:** Lock down tech stack and commerce scope to prevent scope creep.

**Deliverables:**
- ✅ Tech stack confirmed (Vue 3, Tailwind, Supabase, Stripe)
- ✅ Commerce scope defined (subscriptions, one-time purchases, events, digital products)
- ✅ Subscription model documented (pause/resume/cancel)
- ✅ Customer accounts required for v1
- ✅ Inventory management approach defined

**Documents:**
- [Epic 0 Summary](./epic-0-summary.md)
- [Epic 0 Principles](./epic-0-cms-principles.md)
- [Subscription Model](./subscription-model.md)
- [Commerce Scope Guardrails](./commerce-scope-guardrails.md)

---

### ✅ Epic 1 — Unified Domain Model
**Status:** COMPLETE
**Goal:** Design database schema that supports both content and transactions.

**Deliverables:**
- ✅ Complete database schema (42 tables)
- ✅ SQL migration file ready for Supabase
- ✅ Triggers for inventory/capacity management
- ✅ Row Level Security (RLS) policies
- ✅ Entity relationship diagrams
- ✅ Content pages table for static CMS content
- ✅ URL redirects table for SEO preservation
- ✅ Product reviews and ratings (v1)
- ✅ Ingredient-level stock control (v2 - modeled)

**Documents:**
- [Epic 1 Domain Model](./epic-1-domain-model.md)
- [schema.sql](./schema.sql)

**Key Tables:**
- CMS: `offerings`, `offering_events`, `offering_products`, `offering_digital_products`, `content_pages`, `blog_posts`
- Commerce: `customers`, `orders`, `payments`, `fulfillments`, `product_reviews`
- Subscriptions: `subscriptions`, `subscription_items`, `subscription_events`
- Inventory: `inventory_items`, `inventory_movements`
- Ingredient Control (v2): `box_components`, `component_inventory`, `box_recipes`, `box_assemblies`
- Events: `event_capacity`, `event_capacity_holds`, `bookings`, `booking_attendees`
- SEO: `url_redirects`

---

### ✅ Epic 2 — Content Audit + URL Mapping
**Status:** COMPLETE
**Goal:** Freeze IA and scope from existing sites to prevent drift during build.

**Deliverables:**
- ✅ Complete inventory of both existing sites
- ✅ Lots of Lovely Art: 36 static pages + 80+ blog posts + 120+ products
- ✅ Lola Creative Space: ~5-10 pages + calendar-based workshops
- ✅ Unified site strategy confirmed
- ✅ Schema gaps identified and resolved

**Documents:**
- [Epic 2 Content Audit](./epic-2-content-audit.md)

---

### ✅ Epic 3 — URL Strategy + Routing
**Status:** COMPLETE
**Goal:** Preserve SEO and mental models with clear URL structure.

**Deliverables:**
- ✅ Unified URL structure for all content types
- ✅ 250+ redirect mappings from old sites to new URLs
- ✅ Vue Router configuration with route definitions
- ✅ Redirect middleware implementation
- ✅ Sitemap strategy (static + dynamic)
- ✅ SEO considerations (meta tags, canonical URLs, Open Graph)

**Documents:**
- [Epic 3 URL Strategy](./epic-3-url-strategy.md)

---

### 🚧 Epic 4 — Data Migration + Content Import
**Status:** NOT STARTED  
**Goal:** Match today's content shape, not an imagined future.

**Workshops (from Lola Creative Space):**
- Map to `offerings` + `offering_events`
- Extract:
  - Workshop title, description, images
  - Category/type (art, creative, kids, etc.)
  - Sessions (date, time, capacity, location)
  - Existing bookings (if applicable)

**Boxes (from Lots of Lovely Art):**
- Map to `offerings` + `offering_products`
- Extract:
  - Product title, description, images, price
  - Existing orders (if needed)
  - Subscription data (Stripe sync)

**CMS Pages:**
- Map to `content_pages`
- Extract:
  - Slug, hero, body, SEO metadata
  - About, Contact, FAQs, Policies

**Deliverables:**
- Migration scripts for content import
- Stripe subscription sync
- Image migration to Supabase Storage
- Test data in Supabase

**Acceptance Criteria:**
- Every page on both sites has a data source
- No page requires hardcoded content
- Workshop concept separated from workshop session/date

**Documents to Create:**
- `epic-4-migration-plan.md` — Migration strategy
- `epic-4-data-mapping.md` — Old data → New schema mapping

---

### ✅ Epic 5 — Project Setup (Supabase, Vue 3, Tailwind)
**Status:** COMPLETE
**Goal:** Initialize project infrastructure and configure development environment.

**Core Deliverables (COMPLETE):**
- [x] Supabase project created and database migrated (42 tables)
- [x] Vue 3 app initialized with Vite in `app/` directory
- [x] Tailwind CSS configured with brand colors (primary red, secondary green)
- [x] Vue Router configured with 12 routes and auth guards
- [x] Pinia stores created (auth, cart with localStorage)
- [x] Supabase client configured
- [x] Storage buckets created with policies (product-images, blog-images, workshop-images)
- [x] All 11 placeholder views created
- [x] Navigation component with responsive design
- [x] Sign up/Sign in authentication working
- [x] Environment variables configured (.env.local)
- [x] Development environment running locally (http://localhost:5175/)
- [x] Git repository initialized

**Optional/Future:**
- [ ] Stripe account created and configured (when ready for payments)
- [ ] Webhook endpoint created and tested (when Stripe is set up)
- [ ] ESLint and Prettier configured (code quality - optional)
- [ ] Deployment pipeline configured (Vercel - when ready to deploy)

**Documents:**
- [Epic 5 Project Setup](./epic-5-project-setup.md)

---

## Next Epics (To Be Defined)

- **Epic 6:** Admin CMS Interface
- **Epic 7:** Public Frontend Pages (Workshops, Boxes, Blog)
- **Epic 8:** Checkout + Payment Flows
- **Epic 9:** Subscription Management
- **Epic 10:** Testing + Launch

---

## Related Documents

- [README](./README.md) — Documentation index
- [Epic 0 Summary](./epic-0-summary.md) — Quick reference
- [Epic 1 Domain Model](./epic-1-domain-model.md) — Database schema
- [Epic 2 Content Audit](./epic-2-content-audit.md) — Content inventory
- [Epic 3 URL Strategy](./epic-3-url-strategy.md) — URL structure and routing
- [Epic 5 Project Setup](./epic-5-project-setup.md) — Infrastructure setup


