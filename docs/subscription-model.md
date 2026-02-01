# Subscription Model

**Last Updated:** 2026-01-31
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
- ✅ **Single tier** — One monthly box subscription type
- 🔄 v2: Multiple tiers/box types (if needed)

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
- ✅ Subscribe to monthly boxes (single tier)
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

**Webhook events we handle:**
- `customer.subscription.created` — New subscription
- `customer.subscription.updated` — Status change (pause, resume)
- `customer.subscription.deleted` — Cancellation
- `invoice.paid` — Successful billing (create order/shipment)
- `invoice.payment_failed` — Failed payment (notify customer)

---

## Subscription Flow (Draft)

### Subscribe Flow
1. User browses subscription options
2. User selects subscription interval (monthly, quarterly, etc.)
3. User clicks "Subscribe"
4. Redirected to Stripe Checkout (subscription mode)
5. User enters payment info
6. Stripe creates subscription
7. Webhook creates subscription record in our DB
8. Confirmation email sent
9. First box ships immediately (or on next billing cycle)

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

**v1 Approach: Separate Checkouts (Recommended)**

**Why separate:**
- ✅ Simpler implementation
- ✅ Clear UX distinction between "Subscribe" and "Buy Once"
- ✅ Easier to manage in Stripe
- ✅ Avoids complex cart logic

**How it works:**
1. **Subscribe flow:**
   - User clicks "Subscribe" on subscription page
   - Redirected to Stripe Checkout (subscription mode)
   - Creates Stripe subscription
   - Customer account created/linked
   - First box ships immediately (or on next billing cycle)

2. **One-time purchase flow:**
   - User adds boxes/events to cart
   - Proceeds to checkout
   - Redirected to Stripe Checkout (payment mode)
   - One-time payment processed
   - Order created and fulfilled

**User journey:**
- Existing subscribers can still buy one-time boxes (separate transaction)
- New users can subscribe first, then buy one-time items later
- Or vice versa

**v2 Enhancement: Combined Checkout**
- Allow subscription + one-time items in same cart
- Stripe Checkout supports mixed line items
- More complex but better UX for some scenarios

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
- ✅ Monthly recurring box subscriptions
- ✅ Stripe Subscriptions for billing
- ✅ Customer accounts (required for subscription management)
- ✅ Subscribe/pause/resume/cancel functionality
- ✅ Billing cycle management (view next billing date, history)
- ✅ Update payment method
- ✅ Webhook-driven order creation on each billing cycle
- ✅ Separate checkouts for subscriptions vs one-time purchases
- ✅ Subscribers can also buy one-time boxes and book events
- ❌ **NOT in v1:** Skip individual deliveries, swap box types, gift subscriptions, combined checkout

**Critical Next Steps:**
1. ✅ Customer account implementation confirmed (email/password login)
2. ⚠️ Decide on pause duration limits (1 month, 3 months, indefinite?)
3. ⚠️ Decide on pause resume behavior (auto-resume or manual?)
4. Plan migration strategy for existing subscribers
5. Design subscription management UI (dashboard, pause/cancel flows)

**Key Principle:** Use Stripe Subscriptions for billing. Build minimal UI for subscription management. Preserve existing functionality. Don't rebuild subscription infrastructure.

