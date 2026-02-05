# Lola As One — CMS Documentation

**Project:** Simple CMS for selling boxes and booking events
**Last Updated:** 2026-02-04
**Status:** ✅ Epic 7 COMPLETE! (100% - All customer-facing e-commerce + Stripe integration complete!)

---

## 🗺️ Project Roadmap

### [Epic Structure](./epic-structure.md) ⭐
**START HERE — Complete epic roadmap and project plan.**

**Status:**
- ✅ Epic 0: Platform decisions + Commerce scope (COMPLETE)
- ✅ Epic 1: Unified domain model (COMPLETE)
- ✅ Epic 2: Content audit + URL mapping (COMPLETE)
- ✅ Epic 3: URL strategy + routing (COMPLETE)
- 🚧 Epic 4: Data migration + content import (PENDING)
- ✅ Epic 5: Project setup (Supabase, Vue 3, Tailwind) (COMPLETE)
- ✅ Epic 6: Admin CMS (COMPLETE - 100%)
- ✅ Epic 7: Customer-Facing E-commerce (COMPLETE - 100%)

---

## Core Documents

### 0. [Epic 0 Summary](./epic-0-summary.md) ⭐
**Quick reference for all confirmed decisions.**

Quick reference covering:
- Product types (physical, subscriptions, digital)
- Subscription model (monthly, pause/resume/cancel)
- Commerce stack (Stripe, cart, shipping)
- Tech stack (Vue 3, Supabase, Tailwind)
- What's in/out of v1
- Outstanding questions

### 1. [Epic 0: CMS Principles + Platform Decisions + Commerce Scope](./epic-0-cms-principles.md)
**The master document with detailed specifications.**

Defines:
- Offering types (events, products, subscriptions, digital)
- Status flow (draft → scheduled → published → archived)
- Admin roles (admin, editor, viewer)
- Frontend-driven CMS philosophy
- Platform decisions (Stripe, shipping, tax, inventory)
- Tech stack (Vue 3, Supabase, Tailwind)

### 2. [CMS Feature Checklist](./cms-feature-checklist.md)
**What's in v1 vs v2.**

Comprehensive breakdown of:
- Content management features
- Publishing workflow
- Frontend control
- Commerce & payments
- Technical features

### 3. [Commerce Scope Guardrails](./commerce-scope-guardrails.md)
**Don't rebuild Shopify.**

Defines:
- v1 commerce architecture (custom cart + Stripe Checkout)
- Payment flow
- Product types (physical boxes, optional digital)
- Shipping (UK flat rate)
- Tax/VAT (inclusive pricing)
- Event bookings (pay-to-book)
- Order management
- Inventory management (auto-decrement)

### 4. [Subscription Model](./subscription-model.md)
**How recurring subscriptions work.**

Covers:
- Monthly subscription architecture
- Stripe Subscriptions integration
- Customer account requirements
- Subscribe/pause/resume/cancel flows
- Billing cycle management
- Separate checkout for subscriptions vs one-time
- Migration considerations

### 4a. [Subscription Customer Flow – Curated Plans](./epic-subscription-customer-flow.md)
**How the curated subscription plan UX works.**

Covers:
- `/shop → /subscriptions/:slug` entry flow for subscription offerings.
- Curated box selection per plan using `subscription_plan_boxes` and max-box limits.
- Server-side availability validation via `validate-subscription-boxes` Edge Function and suggestion/swap behaviour.
- How configured subscriptions are represented in the cart via `subscriptionConfig`.

### 5. [Epic 1 — Domain Model](./epic-1-domain-model.md) ⭐
**Complete database schema design.**

**Total: 42 tables** covering:
- **CMS tables:** Unified offerings model (events, products, digital, subscriptions)
- **Blog posts:** Separate table with guest author attribution (80+ posts from existing site)
- **Product variants:** Support for product options (e.g., "Sketchbook" vs "Sketchbook + Paints")
- **Product reviews:** Customer reviews and ratings (v1)
- **Product categories:** Collections like "Classic Collection", "Sale Items"
- **Workshop categories:** Stored in `offerings.metadata` JSONB (Open Studio, Little Ones, Adult, Holiday, Other Age Groups)
- **Commerce tables:** Orders, payments, fulfillments
- **Subscription tables:** Pause/resume/cancel support
- **Inventory management:** Stock tracking, movements
- **Ingredient-level stock control (v2):** Component tracking, box recipes, assembly records
- **Event bookings:** Capacity management, attendee details (v1)
- **Digital products:** Downloads, access control
- **Content pages:** Static CMS pages (About, Contact, FAQs, Policies)
- **URL redirects:** SEO preservation from old sites
- **Database triggers and RLS policies**
- **Entity relationships and design decisions**

### 6. [Epic 2 — Content Audit](./epic-2-content-audit.md) ✅
**Complete inventory of existing sites.**

**Lots of Lovely Art:**
- 36 static pages (e-commerce, informational, business pages)
- 80+ blog posts (artist features, tutorials, book recommendations, educational content)
- 120+ products across 10 categories (art boxes, subscriptions, sketchbooks, activity booklets, books, art supplies, fabric & accessories, party supplies, journals, miscellaneous)

**Lola Creative Space:**
- ~5-10 static pages (Home, About, Contact, FAQs, Terms, Privacy)
- Calendar-based workshop navigation
- 5 workshop categories (Open Studio, Little Ones, Adult, Holiday, Other Age Groups)
- Guest checkout only (no accounts in v1)

**Unified Site Strategy:**
- Shared global pages (one About, Contact, FAQs, Terms, Privacy for whole company)
- Landing pages with specific content (Workshops landing, Boxes landing)
- Guest checkout for both workshops AND boxes in v1
- Customer accounts as nice-to-have for v2

### 7. [Epic 3 — URL Strategy + Routing](./epic-3-url-strategy.md) ⭐
**Unified URL structure and redirect mapping.**

**URL Patterns:**
- `/workshops` — Workshop landing + calendar
- `/workshops/:slug` — Individual workshop (SEO-friendly slugs)
- `/boxes` — Boxes landing page
- `/boxes/:slug` — Product or category page
- `/blog` — Blog landing
- `/blog/:slug` — Individual blog post

**Redirects:**
- 250+ redirects from old sites (301 permanent)
- Stored in `url_redirects` table
- Vue Router middleware + server-side redirects

**Key Decisions:**
- Use slugs instead of IDs for SEO
- Flat hierarchy (avoid deep nesting)
- Query params for filtering (categories, tags)
- Separate landing pages for workshops and boxes
- Unified global pages (About, Contact, FAQs)

### 8. [Epic 5 — Project Setup](./epic-5-project-setup.md) ✅
**Initialize project infrastructure and configure development environment.**

**Completed:**
- ✅ Supabase project created and database migrated (42 tables)
- ✅ Authentication configured (email/password with sign up/sign in)
- ✅ Storage buckets created (product-images, blog-images, workshop-images)
- ✅ Vue 3 app initialized with Vite in `app/` directory
- ✅ Vue Router configured with 17 routes and auth guards (added /shop, /products/:slug, /cart, /checkout, /order/success)
- ✅ Pinia stores created (auth, cart with localStorage)
- ✅ Supabase client integrated
- ✅ Tailwind CSS v4 configured with brand colors and design system
- ✅ All 11 placeholder views created (Home, Workshops, Boxes, Blog, About, Contact, Account, Login, Admin, etc.)
- ✅ Navigation component with responsive design
- ✅ Environment variables configured (.env.local)
- ✅ Dev server running successfully (http://localhost:5173/)
- ✅ Git repository initialized

**Optional/Future:**
- Stripe integration (when ready for payments)
- ESLint + Prettier (code quality)
- Vercel deployment (when ready to deploy)

### 9. [Epic 6 — Admin CMS](./epic-6-admin-cms.md) ✅
**Build complete admin interface for content management.**

**Completed (100%):**
- ✅ Admin Dashboard with stats and quick actions
- ✅ Offerings Management (CRUD for events, products, subscriptions, digital products)
- ✅ Image Upload Component with Supabase Storage integration
- ✅ Blog Management (BlogList, BlogForm, RichTextEditor with Tiptap)
- ✅ Waitlist Management UI (4 admin components)
  - ✅ WaitlistDashboard.vue - Overview with stats and activity
  - ✅ EventWaitlistList.vue - Event waitlist entries management
  - ✅ ProductWaitlistList.vue - Product waitlist entries management
  - ✅ WaitlistEntryDetails.vue - Individual entry details
- ✅ Waitlist Settings in OfferingsForm (enable/disable for events and products)
- ✅ Waitlist Stats on Dashboard (active waitlists, pending notifications, conversion rate)
- ✅ Event/Workshop Attendee Management (4 components)
  - ✅ EventBookingsList.vue - List all bookings with filters
  - ✅ EventDetails.vue - Event details with capacity tracking
  - ✅ BookingDetails.vue - Individual booking details with cancel functionality
  - ✅ AttendeeCheckIn.vue - Day-of-event check-in interface
- ✅ Order Management (2 components)
  - ✅ OrdersList.vue - List all orders with filters (status, type, date, search)
  - ✅ OrderDetails.vue - Individual order details with fulfillment workflow
- ✅ Subscription Management (2 components)
  - ✅ SubscriptionsList.vue - List all subscriptions with filters (status, interval, search)
  - ✅ SubscriptionDetails.vue - Individual subscription details with pause/resume/cancel actions
- ✅ Customer Management (2 components)
  - ✅ CustomersList.vue - List all customers with filters (search, status, sort)
  - ✅ CustomerDetails.vue - Individual customer details with order/subscription/booking history
- ✅ Product Inventory Management (2 components)
  - ✅ InventoryList.vue - List all inventory items with stock levels and filters
  - ✅ InventoryDetails.vue - Individual inventory item details with stock adjustment functionality
- ✅ **Analytics & Reporting** (12 of 12 features complete)
  - ✅ AnalyticsDashboard.vue - Comprehensive analytics dashboard with sales, customer, and inventory insights
  - ✅ Date range filtering (7, 30, 90, 365 days, all time)
  - ✅ Sales Overview (total revenue, average order value, subscription revenue, event revenue)
  - ✅ Customer Insights (total customers, new customers, repeat customers, average LTV)
  - ✅ Inventory Status (total items, in stock, low stock, out of stock)
  - ✅ Top Selling Products (top 5 by revenue)
  - ✅ Top Events (top 5 by revenue)
  - ✅ Recent Orders table (last 10 orders with status)

**Database Status:**
- ✅ Waitlist tables already exist (`event_waitlist_entries`, `product_waitlist_entries`)
- ✅ `offering_products.waitlist_enabled` column exists
- ✅ Booking tables exist (`bookings`, `booking_attendees`)
- ✅ Order tables exist (`orders`, `order_items`, `payments`, `fulfillments`)
- ✅ Subscription tables exist (`subscriptions`, `subscription_items`, `subscription_invoices`, `subscription_events`)
- ✅ Customer table exists (`customers`)
- ✅ Inventory tables exist (`inventory_items`, `inventory_movements`)

---

## Epic 7: Customer-Facing E-commerce (IN PROGRESS)

**Goal:** Build customer-facing product pages, cart, and checkout flow

**Status:** 🚧 In Progress (54%)

**Components to Build:**
- ✅ Product Listing Pages (3 pages)
  - ✅ Workshops.vue - Responsive calendar view (week/day) with mobile optimization
  - ✅ Boxes.vue - List all subscription boxes and one-time boxes
  - ✅ Shop.vue - List all products (boxes + digital products)
- ⏳ Product Detail Pages (3 pages)
  - ✅ WorkshopDetail.vue - Workshop details with booking form
  - ✅ BoxDetail.vue - Box details with add to cart
  - ⏳ ProductDetail.vue - Digital product details
- ⏳ Cart & Checkout (3 pages)
  - Cart.vue - Shopping cart with item management
  - Checkout.vue - Customer info and payment
  - OrderSuccess.vue - Order confirmation
- ✅ Waitlist Modals (2 components)
  - ✅ JoinEventWaitlistModal.vue - Join waitlist for sold-out events
  - ✅ JoinProductWaitlistModal.vue - Join waitlist for out-of-stock products
- ⏳ Cart Store Enhancements
  - Add event booking support
  - Add subscription support
  - Add inventory validation
  - Add capacity validation
  - Add shipping calculation
  - Add VAT calculation
- ⏳ Stripe Integration
  - Create checkout session API
  - Webhook handler for order creation
  - Inventory decrement on purchase
  - Capacity decrement on booking

**Key Features:**
- Mixed cart support (boxes + events in one order)
- Guest checkout (no account required)
- Stripe Checkout integration (hosted payment page)
- Real-time inventory validation
- Real-time capacity validation
- Waitlist functionality for sold-out items
- Responsive design (mobile-first)

**Routes to Add:**
- `/workshops` - Workshops listing
- `/workshops/:slug` - Workshop detail
- `/boxes` - Boxes listing
- `/boxes/:slug` - Box detail
- `/shop` - All products listing
- `/products/:slug` - Product detail
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/order/success` - Order confirmation

---

### 10. [Cart Architecture](./cart-architecture.md)
**How the shopping cart works.**

Covers:
- Cart storage (localStorage)
- Cart operations (add, update, remove)
- Checkout flow (validation → Stripe Checkout → webhook)
- Mixed-item support (boxes + events)
- Pricing calculation
- Edge cases

### 11. [Naming Conventions](./naming-conventions.md)
**Consistent naming patterns.**

Standards for:
- Slugs (URL-friendly identifiers)
- Categories (predefined groupings)
- Tags (free-form keywords)
- File naming (images, media)
- API endpoints
- Frontend routes

### 10. [Content Governance](./content-governance.md)
**Who can do what.**

Defines:
- Role permissions (admin, editor, viewer)
- Publishing workflow
- Content lifecycle
- Quality standards
- Category/tag management
- Deletion policy

---

## Quick Reference: v1 Scope

### ✅ What We're Building

**Content:**
- Events (time-based offerings with capacity management)
- Products (physical boxes with variant support)
- Blog posts (80+ posts with guest author attribution)
- Static pages (About, Contact, FAQs, Policies)
- Rich text descriptions (JSONB structured content)
- Featured images
- Categories and tags (reusable across offerings, products, blog posts)
- Draft/scheduled/published/archived status
- Workshop categories (Open Studio, Little Ones, Adult, Holiday, Other Age Groups)
- Product collections (Classic Collection, Sale Items, etc.)
- URL redirects (SEO preservation from old sites)

**Commerce:**
- Custom shopping cart (session-based)
- Mixed-item orders (boxes + events)
- Stripe Checkout integration
- Automatic inventory management
- Event capacity tracking
- **Event capacity holds** (temporary reservations during checkout)
- **Booking attendee details** (collect attendee information for workshops)
- Guest checkout (workshops AND boxes)
- UK flat rate shipping (Royal Mail integration via WooCommerce)
- VAT-inclusive pricing
- **Subscriptions** (monthly recurring, pause/resume/cancel)
- Product variants (e.g., "Sketchbook" vs "Sketchbook + Paints")
- **Product reviews** (customer reviews and ratings)
- Discount codes
- Abandoned cart recovery
- Inventory reservations during checkout
- Low stock alerts


**Admin:**
- Content management (create, edit, publish)
- Order management (view, fulfill)
- Category management
- User management (admin, editor roles)
- Homepage and navigation control

**Technical:**
- REST API
- Stripe webhooks
- Email notifications
- Cart validation

### ❌ What We're NOT Building (v1)

**Deferred to v2 (Nice-to-Have):**
- Customer accounts (for order/booking history, subscription management)
- **Ingredient-level stock control** (track components that make up boxes, bill of materials, box assembly)
  - Track individual components (paints, brushes, paper, etc.)
  - Define box recipes (bill of materials)
  - Track box assembly from components
  - Component-level inventory management
  - Supplier management and reorder points
  - Cost tracking for profitability analysis
- Shipping label generation
- Refund processing (manual via Stripe Dashboard in v1)
- Weight-based shipping
- International shipping

**Out of Scope:**
- Multi-currency
- Multi-language
- Wishlist
- Memberships
- Courses


---

## Key Principles

1. **Simple over complex** — Build the minimum viable system
2. **Let Stripe do the heavy lifting** — Don't rebuild payment infrastructure
3. **Frontend-driven** — CMS controls what appears on the site
4. **Guest and User account checkout** — Both guest and user account checkout available in v1
5. **Automatic inventory** — Stock and capacity updated on purchase
6. **Don't rebuild Shopify** — If it's complex e-commerce, it's out of scope

---

## Next Steps

✅ **Epic 0:** Platform decisions + Commerce scope (COMPLETE)
✅ **Epic 1:** Unified domain model (COMPLETE)
✅ **Epic 2:** Content audit (COMPLETE)
✅ **Epic 3:** URL strategy + routing (COMPLETE)
✅ **Epic 5:** Project setup (Supabase, Vue 3, Tailwind) (COMPLETE)

**Up Next:**
- **Epic 4:** Data migration + slug generation (migrate 80+ blog posts, 120+ products, workshop data)
- **Epic 7:** Customer-facing e-commerce features (product pages, cart, checkout)
- **Epic 8:** Stripe integration (payment processing for orders and subscriptions)
- **Epic 9:** Customer-facing waitlist modals and email notifications
- **Epic 10:** Frontend public pages (home, about, contact, blog) - ✅ COMPLETE

---

## Outstanding Questions

### Subscription Model
1. **Pause Duration:** How long can customers pause subscriptions? (Recommendation: 3 months max)
2. **Resume Behavior:** Auto-resume or manual? (Recommendation: Customer chooses)

### Commerce
3. **Order Number Format:** `ORD-YYYYMMDD-XXXXXX` or `LOL-XXXXXX`?
4. **Free Shipping Threshold:** Free shipping over £X?
5. **Shipping Rate:** What's the exact UK flat rate? (Royal Mail integration needed)

### Digital Products
6. **Digital Download Expiry:** How long should download links be valid? (Recommendation: 7 days)
7. **Gift Card Implementation:** Stripe native or custom? (Recommendation: Stripe native)

### Technical
8. **Email Provider:** Which service for transactional emails? (Nodemailer migrating to Supabase Edge Functions)
9. **Image Hosting:** Supabase Storage (confirmed)

---

## Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| Epic Structure | ✅ Complete | 2026-01-31 |
| Epic 0 Summary | ✅ Complete | 2026-01-31 |
| Epic 0 Principles | ✅ Complete | 2026-01-31 |
| Feature Checklist | ✅ Complete | 2026-01-31 |
| Commerce Guardrails | ✅ Complete | 2026-01-31 |
| Subscription Model | ✅ Complete | 2026-01-31 |
| Epic 1 Domain Model | ✅ Complete | 2026-02-01 |
| Schema SQL | ✅ Complete | 2026-02-01 |
| Epic 2 Content Audit | ✅ Complete | 2026-02-01 |
| Epic 3 URL Strategy | ✅ Complete | 2026-02-01 |
| Epic 6 Admin CMS | ✅ Complete (100%) | 2026-02-02 |
| Cart Architecture | ✅ Complete | 2026-01-31 |
| Naming Conventions | ✅ Complete | 2026-01-31 |
| Content Governance | ✅ Complete | 2026-01-31 |
| Waitlist Implementation Guide | ✅ Complete | 2026-02-02 |

