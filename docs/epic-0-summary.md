# Epic 0 — Summary of Confirmed Decisions

**Last Updated:** 2026-01-31  
**Status:** ✅ Complete — Ready for Epic 1

---

## 🎯 Core Decisions (LOCKED)

### Product Types
- ✅ **Physical boxes** (one-time purchase)
- ✅ **Monthly subscriptions** (recurring boxes) — CRITICAL existing feature
- ✅ **Events** (pay-to-book)
- ✅ **Digital gift cards** (Stripe native)
- ✅ **Digital downloads** (PDFs, videos via Supabase Storage)

### Status Flow
- ✅ **draft → scheduled → published → archived**

### Admin Roles
- ✅ **Admin** (full access)
- ✅ **Editor** (create/edit, cannot publish)
- ✅ **Viewer** (read-only, optional)

---

## 💳 Subscription Model (CONFIRMED)

### Current Implementation
- ✅ Subscribers **currently log in** to manage subscriptions
- ✅ **Single tier** — One monthly box subscription type
- ✅ **Anniversary-based billing** — Charged monthly on signup date
- ✅ **Stripe handles failed payments** (automatic retries)
- ✅ **No trial periods**

### v1 Features
- ✅ Subscribe to monthly boxes
- ✅ **Pause subscription** (NEW FEATURE — doesn't currently exist)
- ✅ **Resume subscription** (NEW FEATURE)
- ✅ Cancel subscription
- ✅ Update payment method
- ✅ View subscription status and next billing date
- ✅ View billing history
- ✅ Subscribers can also buy one-time boxes (separate transaction)

### Outstanding Decisions
- ⚠️ **Pause duration:** How long can customers pause? (1 month, 3 months, indefinite?)
- ⚠️ **Resume behavior:** Auto-resume or manual resume?

---

## 🛒 Commerce Stack

### Payments
- ✅ Stripe Checkout (hosted payment pages)
- ✅ Stripe Subscriptions (recurring billing)
- ✅ Separate checkout flows (subscription vs one-time)

### Shipping
- ✅ UK-only in v1
- ✅ Flat rate shipping
- ⚠️ **To confirm later:** Exact flat rate amount (e.g., £4.95)
- ⚠️ **To decide:** Free shipping threshold?

### Tax/VAT
- ✅ VAT-inclusive pricing (20% UK standard rate)
- ✅ Display "inc. VAT" on product pages

### Shopping Cart
- ✅ Custom cart (session-based, localStorage)
- ✅ Mixed cart support (boxes + events in one order)
- ✅ Automatic inventory decrement (boxes)
- ✅ Automatic capacity decrement (events)

### Customer Accounts
- ✅ **REQUIRED** for subscription management
- ✅ Email/password authentication
- ✅ Guest checkout available for one-time purchases
- ✅ Customer dashboard (subscription management, order history, digital downloads)

---

## 🛠️ Tech Stack (CONFIRMED)

- ✅ **Frontend:** Vue 3 + Tailwind CSS
- ✅ **Backend/Database:** Supabase (PostgreSQL + Auth + Storage)
- ✅ **Payments:** Stripe (Checkout + Subscriptions)
- ✅ **Email:** Nodemailer (currently on Firebase Functions, will migrate)
- ✅ **File Storage:** Supabase Storage (digital downloads, product images)

---

## 📦 What's In v1

### Must Have
1. Physical boxes (one-time purchase)
2. Monthly subscriptions (single tier, anniversary billing)
3. Events (pay-to-book, capacity tracking)
4. Digital gift cards
5. Digital downloads (PDFs, videos)
6. Custom shopping cart (mixed items)
7. Customer accounts (email/password)
8. Subscription management UI (pause/resume/cancel)
9. Guest checkout (one-time purchases)
10. Stripe Checkout integration
11. Stripe Subscriptions integration
12. Webhook-driven order creation
13. UK flat rate shipping
14. VAT-inclusive pricing
15. Automatic inventory management
16. Admin order management (view, fulfill)
17. Admin subscription management (view active subscriptions)

### Not in v1
- ❌ Shipping label generation (manual fulfillment)
- ❌ Refund processing in-app (manual via Stripe Dashboard)
- ❌ Discount codes
- ❌ Product variants (size, color)
- ❌ Skip individual deliveries (v2)
- ❌ Swap box types mid-subscription (v2)
- ❌ Gift subscriptions (v2)
- ❌ Combined checkout (subscription + one-time in same cart) (v2)
- ❌ Multiple subscription tiers (v2)
- ❌ International shipping (v2)
- ❌ Weight-based shipping (v2)

---

## ⚠️ Outstanding Questions (Before Epic 1)

1. **Pause duration:** How long can customers pause subscriptions?
2. **Resume behavior:** Auto-resume or manual?
3. **Shipping rate:** What's the exact UK flat rate? (e.g., £4.95)
4. **Free shipping:** Free shipping over £X?

---

## ✅ Next Steps

**Epic 0 is complete!** All core decisions are locked.

**Ready for Epic 1:** Tech stack selection + project setup
- Database schema design
- Supabase project setup
- Vue 3 + Tailwind project initialization
- Stripe integration architecture
- Customer authentication system
- Migration plan for existing subscribers

---

## 📄 Related Documents

- [CMS Principles](./epic-0-cms-principles.md) — Full detailed decisions
- [Subscription Model](./subscription-model.md) — Subscription architecture
- [Commerce Scope Guardrails](./commerce-scope-guardrails.md) — What's in/out of scope
- [CMS Feature Checklist](./cms-feature-checklist.md) — v1 vs v2 breakdown
- [Cart Architecture](./cart-architecture.md) — Shopping cart design
- [Naming Conventions](./naming-conventions.md) — Slugs, categories, tags
- [Content Governance](./content-governance.md) — Roles and permissions

