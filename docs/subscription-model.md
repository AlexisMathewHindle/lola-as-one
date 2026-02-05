# Subscription Model

**Last Updated:** 2026-02-04
**Status:** ✅ Confirmed - Monthly subscriptions with Stripe

## Purpose
Define how recurring box subscriptions work in v1. **This is an existing feature that must be migrated/preserved.**

---

## Confirmed Requirements

### Current Implementation
- ✅ **Stripe Subscriptions** — Already in use
- ✅ **Monthly billing** — Recurring monthly boxes
- ✅ **Subscribe/cancel/pause** — Existing functionality must be preserved
- ✅ **Billing cycle management** — Required in v1
- ✅ **Mixed purchases** — Users can buy one-time boxes AND subscribe

### Key Features (v1)
1. Monthly recurring box subscriptions
2. Customer can subscribe, pause, resume, cancel
3. Customer can buy one-time boxes separately
4. Customer can book events (separate from subscription)
5. Billing cycle management (track next billing date, billing history)

---

## Confirmed Details

### Customer Management
- ✅ **Subscribers log in** to manage subscriptions (custom UI required)
- ✅ **Customer accounts** with email/password authentication
- ✅ **Order history** accessible to logged-in customers

### Subscription Tiers
- ✅ **Curated subscription plans** — 3-month, 6-month, and every-other-month plans
- ✅ **Plan-specific box limits** — 3-month → max 3 boxes; 6-month → max 6 boxes; every-other-month → max 6 boxes (6 shipments over 12 months)
- ✅ **Backend-configured eligible boxes** — For each plan, admin selects which physical boxes are available to subscribers

### Billing Details
- ✅ **Anniversary date billing** — Customers charged monthly on their signup date
- ✅ **Failed payments** — Handled by Stripe (automatic retries, dunning)
- ✅ **No trial periods** in v1
- ✅ **First charge** — Immediate on subscription signup

### Pause Functionality
- ✅ **NEW FEATURE** — Pause option doesn't currently exist, adding in v1
- ⚠️ **To decide:** Pause duration (1 month, 3 months, indefinite?)
- ⚠️ **To decide:** Auto-resume or manual resume?

### Mixed Cart
- ✅ **Separate transactions** — Subscriptions and one-time purchases use different checkout flows
- 🔄 v2: Combined checkout (if user demand justifies complexity)

---

## v1 Architecture (Confirmed)

### Approach: Stripe Subscriptions + Customer Accounts

**Since pause/cancel functionality already exists, we need customer accounts for subscription management.**

**How it works:**
- Use Stripe Subscriptions for recurring billing
- Build customer accounts for subscription management
- Customers log in to view/manage subscription
- Stripe handles billing, retries, payment processing
- Custom UI for pause/resume/cancel

**Why customer accounts are required:**
- ✅ Existing pause/cancel functionality needs UI
- ✅ Billing cycle management requires customer access
- ✅ Customers need to see subscription status and next billing date
- ✅ Customers need to manage payment methods

**v1 Features:**
- ✅ Customer accounts (email/password login)
- ✅ Curated subscription plans (3-month, 6-month, every-other-month)
- ✅ Per-plan box selection limits enforced in the application
- ✅ **Pause subscription** (NEW FEATURE - temporarily stop deliveries)
- ✅ **Resume subscription** (NEW FEATURE - restart deliveries)
- ✅ Cancel subscription (end recurring billing)
- ✅ Update payment method
- ✅ View subscription status and next billing date (anniversary-based)
- ✅ View billing history
- ✅ Stripe handles billing automatically in background
- ✅ Stripe handles failed payments (automatic retries)
- ✅ Webhook creates order record for each billing cycle
- ✅ No trial periods

**v2 Enhancements:**
- Skip individual deliveries
- Swap box types mid-subscription
- Gift subscriptions
- Referral program
- Subscription analytics dashboard

---

## Subscription Data Model (Draft)

### If Using Stripe Subscriptions

**Stripe handles:**
- Subscription status (active, paused, cancelled)
- Billing schedule
- Payment retries
- Customer payment methods

**We store:**
```
SUBSCRIPTION
- id (uuid)
- stripe_subscription_id (string, unique)
- stripe_customer_id (string)
- customer_email (string)
- product_id (uuid, FK to PRODUCT)
- status (active, paused, cancelled)
- interval (monthly, quarterly, annual)
- next_billing_date (date)
- created_at (timestamp)
- cancelled_at (timestamp, nullable)
```

**Curated subscription box configuration:**
- Subscription offerings (3-month, 6-month, every-other-month) are stored in `offerings` with `type = 'subscription'`.
- The set of physical boxes each plan can use is stored in `subscription_plan_boxes` (join between `offerings` and `offering_products`).
- Per-plan max boxes are enforced in the application:
  - 3-month → up to 3 boxes
  - 6-month → up to 6 boxes
  - Every-other-month → up to 6 boxes (6 shipments over 12 months)
- Admin configures eligible boxes for each plan via the subscription detail CMS UI.

**Webhook events we handle:**
- `customer.subscription.created` — New subscription
- `customer.subscription.updated` — Status change (pause, resume)
- `customer.subscription.deleted` — Cancellation
- `invoice.paid` — Successful billing (create order/shipment)
- `invoice.payment_failed` — Failed payment (notify customer)

---

## Subscription Flow (Draft)

### Subscribe Flow
1. User browses subscription options (3-month, 6-month, every-other-month)
2. User selects a plan and quantity (number of parallel subscriptions)
3. User chooses boxes for that plan from the curated list (up to the plan's max boxes)
4. The configured subscription (plan + selected boxes) is validated via a Supabase Edge Function (`validate-subscription-boxes`); if all boxes are still eligible/available it is added to the same basket as any one-time products on `/checkout`. If some boxes are unavailable, the flow surfaces an error and suggestions and requires the user to adjust their selection before continuing.
5. User proceeds to checkout and is redirected to Stripe Checkout (subscription mode, with mixed subscription + one-time line items)
6. User enters payment info
7. Stripe creates the subscription and charges the first invoice
8. Webhook creates subscription record in our DB (and, where needed, an initial order/shipment record)
9. Confirmation email sent
10. First box ships immediately (or on next billing cycle)

#### Current frontend implementation (2026-02-04)

- **Route & plan page**
  - Subscription offerings (`offerings.type = 'subscription'`) are listed on `/shop` and route to `/subscriptions/:slug`, implemented by `SubscriptionDetail.vue`.
- **Curated box selection**
  - Eligible boxes for each plan come from `subscription_plan_boxes` joined to `offering_products` / `offerings`; the UI enforces per-plan max box counts using `offerings.metadata.max_boxes` or slug/title heuristics (3-month, 6-month, every-other-month).
- **Server-side availability validation**
  - Before adding to cart, `SubscriptionDetail.vue` calls Supabase Edge Function `validate-subscription-boxes` with:
    - `subscription_offering_id`
    - `selected_box_product_ids` (array of `offering_products.id`)
  - The function checks plan membership, offering `status`, `available_for_subscription`, and basic inventory (`track_inventory`, `stock_quantity`), returning:
    - `allAvailable`
    - `unavailable[]` with per-product reasons
    - `suggestions[]` with other curated boxes that are currently selectable.
- **Suggestions and swap UX**
  - On partial failure, the page shows a clear error listing unavailable selections and renders a Try one of these boxes instead suggestion list.
  - When the user is already at the max box count and has unavailable selections, clicking a suggestion swaps an unavailable box out for the suggested one and clears the error.
- **Cart behaviour**
  - On success, the subscription is added to the shared cart as a single item with `type = 'subscription'` and `subscriptionConfig` (plan label, `max_boxes`, `selected_box_product_ids`); `Cart.vue` displays this summary next to the subscription item.

_Backend Stripe subscription checkout and webhook handling follow the architecture described below but are still being fully wired to this curated-plan flow._

### Recurring Billing Flow
1. Stripe charges customer on billing date
2. `invoice.paid` webhook triggered
3. Backend creates order record
4. Backend creates shipment/fulfillment task
5. Admin ships box
6. Confirmation email sent

### Cancellation Flow (Option A: Stripe Portal)
1. Customer receives email with "Manage Subscription" link
2. Customer clicks link → Stripe Customer Portal
3. Customer clicks "Cancel Subscription"
4. Stripe cancels subscription
5. `customer.subscription.deleted` webhook triggered
6. Backend updates subscription status
7. Cancellation confirmation email sent

### Cancellation Flow (Option B: Custom UI)
1. Customer logs in
2. Customer navigates to "My Subscription"
3. Customer clicks "Cancel Subscription"
4. Backend calls Stripe API to cancel
5. Stripe confirms cancellation
6. Backend updates subscription status
7. Cancellation confirmation email sent

---

## Mixed Cart Considerations

### Scenario: User wants to subscribe AND buy a one-time box

**Updated v1 Approach (2026-02-04): Combined Checkout (single basket)**

**Why combined:**
- ✅ Better UX: customer sees subscription and one-time items together on `/checkout`
- ✅ Single Stripe payment for both recurring and one-time items
- ⚠️ More complex Stripe integration (mixed line items, subscription mode)

**How it works (target state):**
1. Customer configures a subscription (plan, quantity, selected boxes) and adds it to the basket.
2. Basket can contain:
   - Subscription line items
   - One-time boxes, workshops, and other products
3. Checkout flow creates a Stripe Checkout Session in **subscription mode** with:
   - A recurring line item for the subscription price (quantity = number of subscriptions)
   - One-time line items for any non-subscription products
4. On successful payment:
   - Subscription records are created/updated from Stripe subscription/webhook events
   - Normal `orders` and `order_items` rows are created for the one-time portion of the basket

**Legacy (previous plan): Separate Checkouts**
- Earlier versions of this document assumed separate subscription vs one-time checkouts; this is kept for historical context, but the product direction is now combined checkout as described above.

---

## Admin Features

### Subscription Management (Admin)
- ✅ View all active subscriptions
- ✅ View subscription details (customer, product, billing date)
- ✅ See upcoming shipments
- ⚠️ Cancel subscription on behalf of customer (via Stripe Dashboard or API)
- ❌ **NOT in v1:** Pause/skip deliveries, change billing date, apply discounts

### Reporting
- ✅ Total active subscribers
- ✅ Monthly recurring revenue (MRR)
- ✅ Churn rate (cancelled subscriptions)
- 🔄 **v2:** Cohort analysis, lifetime value, retention metrics

---

## Migration Considerations

If you have existing subscribers:

1. **Export current subscriber data:**
   - Customer info (name, email, address)
   - Subscription details (interval, start date, status)
   - Payment methods (if possible)

2. **Migration strategy:**
   - **Option A:** Migrate to Stripe Subscriptions (if not already there)
   - **Option B:** Keep existing system running, new subscriptions use new CMS
   - **Option C:** Gradual migration (notify customers, ask them to re-subscribe)

3. **Data integrity:**
   - Ensure no duplicate subscriptions
   - Preserve billing history
   - Maintain customer payment methods

---

## Summary

**v1 Subscription Scope (Confirmed):**
- ✅ Monthly-billed curated subscription plans (3-month, 6-month, every-other-month)
- ✅ Stripe Subscriptions for billing
- ✅ Customer accounts (required for subscription management)
- ✅ Subscribe/pause/resume/cancel functionality
- ✅ Billing cycle management (view next billing date, history)
- ✅ Update payment method
- ✅ Webhook-driven order creation on each billing cycle
- ✅ Combined checkout: subscription line items appear in the same basket as one-time products on `/checkout`
- ✅ Subscribers can also buy one-time boxes and book events
- ❌ **NOT in v1:** Skip individual deliveries, swap box types mid-subscription, gift-only subscriptions

**Critical Next Steps:**
1. ✅ Customer account implementation confirmed (email/password login)
2. ⚠️ Decide on pause duration limits (1 month, 3 months, indefinite?)
3. ⚠️ Decide on pause resume behavior (auto-resume or manual?)
4. Plan migration strategy for existing subscribers
5. Design subscription management UI (dashboard, pause/cancel flows)

**Key Principle:** Use Stripe Subscriptions for billing. Build minimal UI for subscription management. Preserve existing functionality. Don't rebuild subscription infrastructure.

