# Lola Box Subscriptions Epic - Implementation Audit

**Date:** 2026-02-13  
**Status:** 🔍 Audit Complete  
**Purpose:** Compare the original epic requirements against current implementation to identify gaps and next steps

---

## Executive Summary

### Overall Progress: ~30% Complete

**What's Working:**
- ✅ Basic subscription checkout flow (Stripe integration)
- ✅ Subscription database schema (subscriptions table exists)
- ✅ Email infrastructure (Resend integration)
- ✅ Customer accounts and authentication
- ✅ One-time checkout and webhook handling

**Critical Gaps:**
- ❌ No `plans` table (subscriptions reference offerings directly)
- ❌ No `box_orders` table for fulfillment queue
- ❌ No `addresses` table for shipping management
- ❌ No `stripe_events` table for webhook idempotency
- ❌ No cycle_key logic or cutoff date handling
- ❌ Webhook doesn't handle subscription events (only one-time purchases)
- ❌ No billing portal edge function
- ❌ No admin shipments/fulfillment UI for subscriptions
- ❌ No customer subscription management UI

---

## Phase-by-Phase Analysis

### ✅ Phase 0 — Product & Rules (PARTIALLY DONE)

**Task 0.1: Define plans + Stripe mapping**

**Status:** ⚠️ INCOMPLETE - No dedicated plans table

**What Exists:**
- Subscriptions are stored in `subscriptions` table
- Stripe price IDs stored in `offering.metadata.stripe_price_id`
- Billing intervals stored in `subscriptions.billing_interval`

**What's Missing:**
- No `plans` table with:
  - `plan_id`, `name`, `interval`, `stripe_price_id`, `active`
- No cutoff day configuration (e.g., 20th of month)
- No shipping window text ("Ships 1st week of month")
- No single source of truth for plan configuration

**Recommendation:**
Create `plans` table and migrate existing subscription offerings to reference it.

---

### ⚠️ Phase 1 — Database Schema (40% DONE)

**Task 1.1: Create tables (minimum)**

#### ✅ Tables That Exist:

1. **subscriptions** ✅
   - Has: `id`, `customer_id`, `stripe_subscription_id`, `stripe_price_id`, `status`, `billing_interval`, `amount_gbp`, `current_period_start`, `current_period_end`, `next_billing_date`
   - Missing: `cancel_at_period_end` boolean, `plan_id` reference

2. **customers** ✅
   - Has: `id`, `email`, `first_name`, `last_name`, `phone`, `stripe_customer_id`
   - Complete as per epic

3. **stripe_events** ❌ MISSING
   - Purpose: Webhook idempotency
   - Needed fields: `id` (stripe event id), `type`, `created_at`

#### ❌ Tables That Don't Exist:

4. **plans** ❌ CRITICAL
   - Needed: `id`, `name`, `interval`, `stripe_price_id`, `active`
   - Current workaround: Using `offerings` table with type='subscription'

5. **box_orders** ❌ CRITICAL
   - Needed: `id`, `user_id`, `subscription_id`, `cycle_key`, `status`, `address_snapshot`, `tracking_number`
   - Status values: queued, packed, shipped, delivered, skipped, on_hold
   - This is the core fulfillment entity

6. **addresses** ❌ CRITICAL
   - Needed: `id`, `user_id`, address fields, `is_default`
   - Current workaround: Addresses stored directly in `orders` table
   - Problem: No reusable address management for subscriptions

#### ⚠️ RLS Policies:
- Subscriptions table: No RLS policies visible
- Need policies for users to read their own subscriptions + box_orders
- Need admin role to read all

**Recommendation:**
Priority 1: Create `box_orders`, `addresses`, `stripe_events`, `plans` tables with proper RLS.

---

### ✅ Phase 2 — Stripe Checkout Edge Function (DONE)

**Task 2.1: Create subscription checkout session**

**Status:** ✅ COMPLETE

**What Exists:**
- `supabase/functions/create-subscription-checkout-session/index.ts` exists
- Creates Stripe checkout session in subscription mode
- Stores metadata: `offering_id`, `customer_email`, `billing_interval`, `stripe_price_id`
- Success URL: `/order/success?session_id={CHECKOUT_SESSION_ID}`
- Handles customer creation/lookup in Stripe

**What's Good:**
- Proper error handling
- CORS configured
- Uses Stripe SDK correctly

**Minor Gaps:**
- Doesn't validate cutoff dates (not implemented yet)
- Doesn't reference `plans` table (uses offerings directly)
- Could add more metadata for tracking (e.g., `plan_id` when plans table exists)

**Recommendation:**
Update to reference `plans` table once created. Otherwise, this is production-ready.

---

### ⚠️ Phase 3 — Stripe Webhook Handler (20% DONE)

**Task 3.1: Handle subscription lifecycle events**

**Status:** ⚠️ CRITICAL GAPS

**What Exists:**
- `supabase/functions/stripe-webhook/index.ts` exists
- Handles webhook signature verification ✅
- Currently handles:
  - `checkout.session.completed` ✅ (for one-time purchases)
  - `checkout.session.expired` ✅

**What's Missing (CRITICAL):**

1. **No subscription event handlers:**
   - ❌ `customer.subscription.created` - Create subscription record
   - ❌ `customer.subscription.updated` - Update status, dates
   - ❌ `customer.subscription.deleted` - Mark as cancelled
   - ❌ `invoice.payment_succeeded` - Create box_order for new cycle
   - ❌ `invoice.payment_failed` - Update status to past_due
   - ❌ `invoice.upcoming` - Send reminder email (nice-to-have)

2. **No idempotency checking:**
   - ❌ No `stripe_events` table insert/check
   - Risk: Webhook retries could create duplicate box orders

3. **No box order creation logic:**
   - ❌ No `getNextCycleKey()` function
   - ❌ No cutoff date logic
   - ❌ No box_order insertion on successful payment

**Current Code Structure:**
```typescript
// Only handles checkout completion for one-time orders
if (event.type === 'checkout.session.completed') {
  // Creates order record
  // Creates order_items
  // Creates bookings (for events)
  // Sends confirmation email
}
```

**Needed Code Structure:**
```typescript
// Check idempotency
const existingEvent = await checkStripeEvent(event.id)
if (existingEvent) return

// Handle subscription events
switch (event.type) {
  case 'customer.subscription.created':
    // Create subscription record
  case 'invoice.payment_succeeded':
    // Create box_order with cycle_key
  case 'customer.subscription.updated':
    // Update subscription status
  case 'customer.subscription.deleted':
    // Mark cancelled
  case 'invoice.payment_failed':
    // Update to past_due, send email
}

// Log event
await insertStripeEvent(event.id, event.type)
```

**Recommendation:**
Priority 1: Add subscription event handlers + idempotency. This is the core of the subscription system.

---

### ❌ Phase 4 — Cycle & Fulfillment Logic (NOT STARTED)

**Task 4.1: Implement cycle_key helper**
**Task 4.2: Box order creation rules**

**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**

1. **No `getNextCycleKey()` function:**
   - Should calculate `YYYY-MM` based on:
     - Current date
     - Cutoff day (e.g., 20th)
     - Billing date
   - Example: Payment on Jan 25 with cutoff=20 → cycle_key = "2026-02"

2. **No box order creation logic:**
   - Should happen in webhook on `invoice.payment_succeeded`
   - Should create `box_orders` record with:
     - `subscription_id`
     - `cycle_key` (from helper)
     - `status = 'queued'`
     - `address_snapshot` (frozen copy of current address)

3. **No cutoff date configuration:**
   - No place to store cutoff day (should be in `plans` table)

4. **No address snapshot logic:**
   - Need to copy current default address to `box_orders.address_snapshot`
   - Prevents issues when customer changes address mid-cycle

**Example Implementation Needed:**
```typescript
function getNextCycleKey(billingDate: Date, cutoffDay: number): string {
  const billing = new Date(billingDate)
  const year = billing.getFullYear()
  const month = billing.getMonth() + 1

  // If billing date is after cutoff, ship next month
  if (billing.getDate() > cutoffDay) {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
  }

  return `${year}-${String(month).padStart(2, '0')}`
}
```

**Recommendation:**
Priority 2: Implement after webhook handlers are in place. Critical for fulfillment.

---

### ❌ Phase 5 — Billing Portal Edge Function (NOT STARTED)

**Task 5.1: Create billing portal session endpoint**

**Status:** ❌ MISSING ENTIRELY

**What's Missing:**
- No `supabase/functions/create-billing-portal-session/index.ts` file
- This edge function should:
  1. Accept customer_id or stripe_customer_id
  2. Call `stripe.billingPortal.sessions.create()`
  3. Return portal URL to frontend
  4. Allow customers to:
     - Update payment method
     - View invoices
     - Cancel subscription
     - Update billing info

**Needed Implementation:**
```typescript
// supabase/functions/create-billing-portal-session/index.ts
import Stripe from 'stripe'

Deno.serve(async (req) => {
  const { customer_id } = await req.json()

  // Get stripe_customer_id from database
  const { data: customer } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', customer_id)
    .single()

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${req.headers.get('origin')}/account/subscriptions`
  })

  return new Response(JSON.stringify({ url: session.url }))
})
```

**Recommendation:**
Priority 3: Implement after core webhook logic. Required for customer self-service.

---

### ⚠️ Phase 6 — Customer UI (10% DONE)

**Task 6.1: Account page with subscriptions list**
**Task 6.2: Subscription detail page**
**Task 6.3: Address management**

**Status:** ⚠️ PLACEHOLDER ONLY

**What Exists:**

1. **`app/src/views/Account.vue`** - ⚠️ Placeholder
   - Has navigation links to: Profile, Orders, Subscriptions, Bookings, Addresses
   - No actual functionality implemented
   - Just a shell with router-links

2. **`app/src/views/SubscriptionDetail.vue`** - ❌ Not found in codebase
   - Likely doesn't exist yet

**What's Missing:**

1. **Subscriptions List View:**
   - Fetch user's subscriptions from database
   - Display: Plan name, status, next billing date, amount
   - Show "Manage" button → opens billing portal
   - Show box shipment history

2. **Subscription Detail View:**
   - Show subscription details
   - List upcoming/past box orders with tracking
   - Show address for next shipment
   - "Update Address" button
   - "Manage Billing" button → portal
   - "Pause/Resume" functionality (if supported)

3. **Address Management:**
   - List saved addresses
   - Add/edit/delete addresses
   - Set default address
   - Show which address will be used for next box

**Recommendation:**
Priority 4: Build after backend is complete. Start with read-only views, then add management.

---

### ⚠️ Phase 7 — Admin UI (10% DONE)

**Task 7.1: Shipments queue (box_orders list)**
**Task 7.2: Packing list view**
**Task 7.3: Mark as shipped + tracking**

**Status:** ⚠️ PLACEHOLDER ONLY

**What Exists:**

1. **`app/src/views/admin/SubscriptionsList.vue`** - ⚠️ Placeholder
   - Just shows emoji and feature list
   - No actual data fetching
   - No table/grid implementation

2. **`app/src/views/admin/SubscriptionDetails.vue`** - ⚠️ Placeholder
   - Empty placeholder page
   - No subscription detail view

**What's Missing:**

1. **Shipments Queue View:**
   - Table of `box_orders` filtered by status
   - Columns: Customer, Subscription, Cycle, Address, Status
   - Filter by: status (queued/packed/shipped), cycle_key
   - Bulk actions: Mark as packed, Print labels
   - Search by customer name/email

2. **Packing List View:**
   - Printable list of queued orders for current cycle
   - Shows: Customer name, address, subscription plan
   - Checkbox to mark as packed
   - Generate shipping labels (integration needed)

3. **Shipment Management:**
   - Update box_order status: queued → packed → shipped
   - Add tracking number
   - Send "shipped" email to customer
   - Mark as delivered (manual or via webhook)

4. **Subscription Management:**
   - View all subscriptions
   - Filter by status
   - View customer details
   - See payment history
   - Manual actions: pause, cancel, refund

**Recommendation:**
Priority 5: Build after customer UI. Critical for operations but backend must exist first.

---

### ✅ Phase 8 — Email Templates (60% DONE)

**Task 8.1: Subscription lifecycle emails**

**Status:** ✅ PARTIALLY COMPLETE

**What Exists:**

Email infrastructure is in place:
- ✅ `supabase/functions/send-email/index.ts` - Resend integration
- ✅ `email_logs` table for tracking
- ✅ Template system with React Email

**Existing Templates:**
1. ✅ `subscription-activated.ts` - Sent when subscription starts
2. ✅ `subscription-renewal-success.ts` - Sent on successful billing
3. ✅ `subscription-payment-failed.ts` - Sent on payment failure
4. ✅ `order-confirmation.ts` - For one-time orders
5. ✅ `event-booking-confirmation.ts` - For event bookings

**What's Missing:**

1. ❌ **Box shipped email** - "Your [Month] box is on its way!"
   - Include: Tracking number, expected delivery, box contents preview

2. ❌ **Subscription cancelled email** - Confirmation of cancellation
   - Include: Last box date, feedback request

3. ❌ **Subscription paused email** - Confirmation of pause
   - Include: Resume date, how to resume early

4. ❌ **Payment method expiring email** - Proactive reminder
   - Include: Link to billing portal

5. ❌ **Welcome series** - Onboarding emails (nice-to-have)

**Email Trigger Points (in webhook):**
- ✅ `subscription.created` → subscription-activated.ts
- ✅ `invoice.payment_succeeded` → subscription-renewal-success.ts
- ✅ `invoice.payment_failed` → subscription-payment-failed.ts
- ❌ `box_order.shipped` → box-shipped.ts (NEW)
- ❌ `subscription.deleted` → subscription-cancelled.ts (NEW)

**Recommendation:**
Priority 6: Add missing templates as features are built. Infrastructure is solid.

---

## Nice-to-Have Features (V2)

### ❌ Not Implemented (Expected)

1. **Subscription Pausing** - Allow customers to pause/resume
2. **Skip a Month** - Skip individual shipments
3. **Gift Subscriptions** - Purchase for someone else
4. **Referral Program** - Earn credits for referrals
5. **Box Customization** - Choose products in box
6. **Prepaid Subscriptions** - Pay upfront for 3/6/12 months
7. **Dunning Management** - Advanced failed payment handling
8. **Analytics Dashboard** - MRR, churn, LTV metrics

**Recommendation:**
Defer to V2. Focus on core subscription flow first.

---

## Critical Missing Pieces Summary

### 🔴 Blockers (Must Fix Before Launch)

**UPDATE:** We can use the existing `orders` table instead of creating `box_orders`! See `docs/orders-vs-box-orders-analysis.md`

1. **Extend `orders` table** - Add `cycle_key`, `tracking_number`, `shipped_at`, `delivered_at` fields
2. **`stripe_events` table** - No webhook idempotency
3. **`addresses` table** - No reusable address management
4. **Webhook subscription handlers** - Can't process recurring payments
5. **Cycle key logic** - Can't determine when to ship boxes

### 🟡 Important (Needed for MVP)

6. **`plans` table** - Better subscription configuration
7. **Billing portal function** - Customer self-service
8. **Admin shipments UI** - Can't fulfill orders without this
9. **Customer subscriptions UI** - Can't view/manage subscriptions
10. **Box shipped email** - Customer communication

### 🟢 Nice-to-Have (Can Launch Without)

11. **Address management UI** - Can use checkout address initially
12. **Subscription detail page** - Can use Stripe portal initially
13. **Advanced email templates** - Can add incrementally
14. **Analytics** - Can use Stripe dashboard initially

---

## Updated Epic: What to Build Next

### Sprint 1: Core Infrastructure (Week 1-2)

**Goal:** Enable subscription fulfillment backend

#### Task 1.1: Database Schema Updates
**Priority:** 🔴 CRITICAL
**Effort:** 2 hours (reduced from 4!)

**UPDATE:** We're using the existing `orders` table instead of creating `box_orders`! See `docs/orders-vs-box-orders-analysis.md` for full analysis.

Create migration file: `supabase/migrations/20260213_subscription_fulfillment.sql`

```sql
-- ============================================================================
-- EXTEND ORDERS TABLE FOR SUBSCRIPTION FULFILLMENT
-- ============================================================================
-- The orders table already has order_type='subscription_renewal' and
-- stripe_subscription_id, so we just need to add fulfillment fields

ALTER TABLE orders
  ADD COLUMN cycle_key TEXT,              -- Format: "YYYY-MM" (which month to ship)
  ADD COLUMN tracking_number TEXT,        -- Shipping tracking number
  ADD COLUMN shipped_at TIMESTAMPTZ,      -- When marked as shipped
  ADD COLUMN delivered_at TIMESTAMPTZ;    -- When delivered

-- Add indexes for subscription order queries
CREATE INDEX idx_orders_cycle_key ON orders(cycle_key);
CREATE INDEX idx_orders_tracking ON orders(tracking_number);

-- Extend status values to include fulfillment statuses
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',      -- Awaiting payment (one-time orders)
    'paid',         -- Payment received
    'queued',       -- Ready to pack (subscription boxes)
    'packed',       -- Packed, ready to ship
    'shipped',      -- Shipped with tracking
    'delivered',    -- Delivered to customer
    'fulfilled',    -- Completed (legacy/general)
    'cancelled',    -- Cancelled
    'refunded'      -- Refunded
  ));

-- Add unique constraint: one order per subscription per cycle
CREATE UNIQUE INDEX idx_orders_subscription_cycle
  ON orders(stripe_subscription_id, cycle_key)
  WHERE order_type = 'subscription_renewal';

-- ============================================================================
-- PLANS TABLE
-- ============================================================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  stripe_price_id TEXT NOT NULL UNIQUE,
  cutoff_day INTEGER NOT NULL DEFAULT 20,
  shipping_window_text TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_stripe_price ON plans(stripe_price_id);

-- ============================================================================
-- ADDRESSES TABLE
-- ============================================================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'GB',
  phone TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_customer ON addresses(customer_id);
CREATE INDEX idx_addresses_default ON addresses(customer_id, is_default);

-- ============================================================================
-- STRIPE EVENTS TABLE (Idempotency)
-- ============================================================================
CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY, -- Stripe event ID (e.g., evt_xxx)
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_events_type ON stripe_events(type);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Users can manage their own addresses
CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  USING (auth.uid() = customer_id);

-- Everyone can read active plans
CREATE POLICY "Public can view active plans"
  ON plans FOR SELECT
  USING (active = TRUE);

-- Orders table already has RLS, but ensure subscription orders are visible
-- (Assuming existing RLS allows users to see their own orders)

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN orders.cycle_key IS 'Subscription cycle in YYYY-MM format (e.g., 2026-02)';
COMMENT ON COLUMN orders.tracking_number IS 'Shipping carrier tracking number';
COMMENT ON COLUMN orders.shipped_at IS 'Timestamp when order was marked as shipped';
COMMENT ON COLUMN orders.delivered_at IS 'Timestamp when order was delivered';
COMMENT ON TABLE stripe_events IS 'Webhook idempotency - prevents duplicate processing';
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Orders table extended with 4 new fields
- [ ] Status constraint updated with new values
- [ ] Plans, addresses, stripe_events tables created
- [ ] RLS policies tested
- [ ] Indexes verified
- [ ] Can query subscription orders: `WHERE order_type = 'subscription_renewal'`

---

#### Task 1.2: Cycle Key Helper Function
**Priority:** 🔴 CRITICAL
**Effort:** 2 hours

Create: `supabase/functions/_shared/cycle-helpers.ts`

```typescript
export function getNextCycleKey(billingDate: Date, cutoffDay: number): string {
  const billing = new Date(billingDate)
  const year = billing.getFullYear()
  const month = billing.getMonth() + 1

  // If billing date is after cutoff, ship next month
  if (billing.getDate() > cutoffDay) {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
  }

  return `${year}-${String(month).padStart(2, '0')}`
}

export function getCurrentCycleKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return `${year}-${String(month).padStart(2, '0')}`
}
```

**Acceptance Criteria:**
- [ ] Function handles month/year rollovers
- [ ] Unit tests pass
- [ ] Edge cases covered (Dec 31, leap years)

---

#### Task 1.3: Webhook Subscription Event Handlers
**Priority:** 🔴 CRITICAL
**Effort:** 8 hours

Update: `supabase/functions/stripe-webhook/index.ts`

**Changes Needed:**

1. Add idempotency check at start:
```typescript
// Check if event already processed
const { data: existingEvent } = await supabase
  .from('stripe_events')
  .select('id')
  .eq('id', event.id)
  .single()

if (existingEvent) {
  return new Response(JSON.stringify({ received: true, cached: true }), { status: 200 })
}
```

2. Add subscription event handlers:
```typescript
switch (event.type) {
  case 'customer.subscription.created':
    await handleSubscriptionCreated(event.data.object)
    break

  case 'customer.subscription.updated':
    await handleSubscriptionUpdated(event.data.object)
    break

  case 'customer.subscription.deleted':
    await handleSubscriptionDeleted(event.data.object)
    break

  case 'invoice.payment_succeeded':
    await handleInvoicePaymentSucceeded(event.data.object)
    break

  case 'invoice.payment_failed':
    await handleInvoicePaymentFailed(event.data.object)
    break
}
```

3. Implement `handleInvoicePaymentSucceeded` with order creation:
```typescript
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = invoice.subscription as string

  // Get subscription from database
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single()

  if (!subscription) return

  // Get customer's default address
  const { data: address } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', subscription.customer_id)
    .eq('is_default', true)
    .single()

  if (!address) {
    console.error('No default address found for customer:', subscription.customer_id)
    return
  }

  // Calculate cycle key
  const cycleKey = getNextCycleKey(
    new Date(invoice.created * 1000),
    subscription.plan.cutoff_day
  )

  // Create subscription renewal order (using orders table, not box_orders!)
  const { data: order } = await supabase.from('orders').insert({
    order_number: `SUB-${Date.now()}-${subscription.id.slice(0, 8)}`,
    customer_id: subscription.customer_id,
    customer_email: subscription.customer_email,
    order_type: 'subscription_renewal',
    stripe_subscription_id: stripeSubscriptionId,
    stripe_payment_intent_id: invoice.payment_intent as string,

    // Pricing from invoice
    subtotal_gbp: (invoice.amount_paid / 100),
    shipping_gbp: 0,
    tax_gbp: (invoice.tax || 0) / 100,
    total_gbp: (invoice.amount_paid / 100),

    // Address snapshot (frozen copy)
    shipping_name: address.name,
    shipping_address_line1: address.address_line1,
    shipping_address_line2: address.address_line2,
    shipping_city: address.city,
    shipping_postcode: address.postcode,
    shipping_country: address.country,

    // Fulfillment fields
    cycle_key: cycleKey,
    status: 'queued', // Ready to pack and ship
  }).select().single()

  // Optional: Create order_items for box contents
  // (if you want to track what's in each box)

  // Send renewal success email
  await sendEmail({
    template: 'subscription-renewal-success',
    recipient: subscription.customer_email,
    data: { subscription, order, cycleKey }
  })
}
```

4. Log event at end:
```typescript
// Log event as processed
await supabase.from('stripe_events').insert({
  id: event.id,
  type: event.type
})
```

**Acceptance Criteria:**
- [ ] All subscription events handled
- [ ] Idempotency prevents duplicates
- [ ] Box orders created on payment success
- [ ] Emails sent for each event
- [ ] Error handling for missing addresses
- [ ] Tested with Stripe CLI webhooks

---

### Sprint 2: Customer Self-Service (Week 3)

**Goal:** Enable customers to manage subscriptions

#### Task 2.1: Billing Portal Edge Function
**Priority:** 🟡 IMPORTANT
**Effort:** 2 hours

Create: `supabase/functions/create-billing-portal-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2024-11-20.acacia'
})

serve(async (req) => {
  try {
    const { customer_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get stripe customer ID
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', customer_id)
      .single()

    if (!customer?.stripe_customer_id) {
      throw new Error('Customer not found')
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/account/subscriptions`
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

**Acceptance Criteria:**
- [ ] Function deployed
- [ ] Returns valid portal URL
- [ ] Handles auth correctly
- [ ] Error handling for missing customer

---

#### Task 2.2: Customer Subscriptions List UI
**Priority:** 🟡 IMPORTANT
**Effort:** 6 hours

Update: `app/src/views/Account.vue`

**Features:**
- Fetch user's subscriptions from database
- Display table with: Plan name, Status, Next billing, Amount
- "Manage Billing" button → opens portal
- Link to subscription detail page
- Show upcoming box shipments

**Acceptance Criteria:**
- [ ] Displays all user subscriptions
- [ ] Status badges (active/paused/cancelled)
- [ ] Billing portal opens correctly
- [ ] Responsive design
- [ ] Loading states

---

#### Task 2.3: Address Management UI
**Priority:** 🟡 IMPORTANT
**Effort:** 6 hours

Create: `app/src/views/Addresses.vue`

**Features:**
- List all saved addresses
- Add new address form
- Edit existing address
- Delete address (with confirmation)
- Set default address
- Show which address will be used for next box

**Acceptance Criteria:**
- [ ] CRUD operations work
- [ ] Default address highlighted
- [ ] Form validation
- [ ] Confirms before delete
- [ ] Updates reflected immediately

---

### Sprint 3: Admin Fulfillment (Week 4)

**Goal:** Enable admin to fulfill subscription boxes

#### Task 3.1: Admin Shipments Queue
**Priority:** 🟡 IMPORTANT
**Effort:** 8 hours

Update: `app/src/views/admin/SubscriptionsList.vue`

**Features:**
- Table of box_orders with filters
- Columns: Customer, Plan, Cycle, Address, Status
- Filter by: Status, Cycle key, Customer search
- Bulk actions: Mark as packed, Export CSV
- Click row → detail view

**Acceptance Criteria:**
- [ ] Displays all box orders
- [ ] Filters work correctly
- [ ] Search by customer name/email
- [ ] Pagination for large lists
- [ ] Export to CSV for printing

---

#### Task 3.2: Shipment Detail & Status Update
**Priority:** 🟡 IMPORTANT
**Effort:** 4 hours

Create: `app/src/views/admin/ShipmentDetail.vue`

**Features:**
- Show box order details
- Customer info and address
- Status update dropdown
- Add tracking number field
- "Mark as Shipped" button → sends email
- Notes field for internal use

**Acceptance Criteria:**
- [ ] Can update status
- [ ] Can add tracking number
- [ ] Sends shipped email automatically
- [ ] Shows audit trail of status changes

---

#### Task 3.3: Box Shipped Email Template
**Priority:** 🟡 IMPORTANT
**Effort:** 2 hours

Create: `supabase/functions/send-email/templates/box-shipped.ts`

**Content:**
- Subject: "Your [Month] Lola Box is on its way! 📦"
- Tracking number with link
- Expected delivery date
- Preview of box contents (if available)
- Link to manage subscription

**Acceptance Criteria:**
- [ ] Template renders correctly
- [ ] Tracking link works
- [ ] Sent when box_order status → shipped
- [ ] Logged in email_logs table

---

## Recommended Implementation Order

### Phase 1: Foundation (Do First) 🔴
**Estimated Time:** 2 weeks
**Blockers Removed:** All critical backend functionality

1. ✅ **Database Schema** (Task 1.1)
   - Creates: `plans`, `addresses`, `box_orders`, `stripe_events`
   - Enables: Fulfillment queue, idempotency, address management
   - Dependencies: None
   - **START HERE**

2. ✅ **Cycle Key Helper** (Task 1.2)
   - Creates: Shared utility functions
   - Enables: Box order cycle calculation
   - Dependencies: None
   - **DO SECOND**

3. ✅ **Webhook Handlers** (Task 1.3)
   - Updates: `stripe-webhook/index.ts`
   - Enables: Subscription lifecycle, box order creation
   - Dependencies: Tasks 1.1, 1.2
   - **DO THIRD - CRITICAL PATH**

**Why This Order:**
- Database must exist before webhook can write to it
- Cycle helper must exist before webhook can calculate cycles
- Webhook is the core engine that drives everything else

**Testing After Phase 1:**
```bash
# Test with Stripe CLI
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed

# Verify in database
# - subscription record created
# - box_order created with correct cycle_key
# - stripe_events logged
# - emails sent
```

---

### Phase 2: Customer Experience (Do Second) 🟡
**Estimated Time:** 1 week
**Enables:** Customer self-service

4. ✅ **Billing Portal** (Task 2.1)
   - Creates: New edge function
   - Enables: Customer can manage billing
   - Dependencies: None (uses existing subscriptions table)

5. ✅ **Subscriptions List UI** (Task 2.2)
   - Updates: `Account.vue`
   - Enables: Customer can view subscriptions
   - Dependencies: Task 2.1 (for portal link)

6. ✅ **Address Management UI** (Task 2.3)
   - Creates: `Addresses.vue`
   - Enables: Customer can manage shipping addresses
   - Dependencies: Task 1.1 (addresses table)

**Why This Order:**
- Portal is quick win for customer management
- Subscriptions list needs portal link
- Address management is independent but needed before first shipment

**Testing After Phase 2:**
- [ ] Customer can view their subscriptions
- [ ] "Manage Billing" button opens Stripe portal
- [ ] Customer can add/edit/delete addresses
- [ ] Default address is used for next box order

---

### Phase 3: Operations (Do Third) 🟢
**Estimated Time:** 1 week
**Enables:** Admin can fulfill orders

7. ✅ **Shipments Queue** (Task 3.1)
   - Updates: `admin/SubscriptionsList.vue`
   - Enables: Admin can see fulfillment queue
   - Dependencies: Task 1.1 (box_orders table)

8. ✅ **Shipment Detail** (Task 3.2)
   - Creates: `admin/ShipmentDetail.vue`
   - Enables: Admin can update status, add tracking
   - Dependencies: Task 3.1

9. ✅ **Shipped Email** (Task 3.3)
   - Creates: New email template
   - Enables: Customer notified when box ships
   - Dependencies: Task 3.2 (triggers email)

**Why This Order:**
- Queue view is needed to see what needs fulfilling
- Detail view is needed to update individual shipments
- Email is triggered by detail view actions

**Testing After Phase 3:**
- [ ] Admin can see all queued box orders
- [ ] Admin can filter by cycle/status
- [ ] Admin can mark as packed/shipped
- [ ] Admin can add tracking number
- [ ] Customer receives shipped email with tracking

---

## Testing Strategy

### Unit Tests
**Location:** `supabase/functions/_shared/__tests__/`

```typescript
// cycle-helpers.test.ts
describe('getNextCycleKey', () => {
  it('returns current month if before cutoff', () => {
    const result = getNextCycleKey(new Date('2026-02-15'), 20)
    expect(result).toBe('2026-02')
  })

  it('returns next month if after cutoff', () => {
    const result = getNextCycleKey(new Date('2026-02-25'), 20)
    expect(result).toBe('2026-03')
  })

  it('handles year rollover', () => {
    const result = getNextCycleKey(new Date('2026-12-25'), 20)
    expect(result).toBe('2027-01')
  })
})
```

---

### Integration Tests
**Tool:** Stripe CLI + Manual verification

```bash
# 1. Test subscription creation
stripe trigger customer.subscription.created
# Verify: subscription record in database

# 2. Test first payment
stripe trigger invoice.payment_succeeded
# Verify: box_order created with correct cycle_key
# Verify: email sent

# 3. Test payment failure
stripe trigger invoice.payment_failed
# Verify: subscription status updated to past_due
# Verify: payment failed email sent

# 4. Test cancellation
stripe trigger customer.subscription.deleted
# Verify: subscription status updated to cancelled
# Verify: cancelled_at timestamp set
```

---

### End-to-End Test Scenario

**Scenario:** New customer subscribes to monthly box

1. **Customer Action:** Clicks "Subscribe" on website
   - ✅ Redirected to Stripe checkout
   - ✅ Enters payment info
   - ✅ Completes checkout

2. **Webhook:** `customer.subscription.created`
   - ✅ Subscription record created in database
   - ✅ Welcome email sent

3. **Webhook:** `invoice.payment_succeeded` (first payment)
   - ✅ Box order created with cycle_key
   - ✅ Address snapshot saved
   - ✅ Renewal success email sent

4. **Admin Action:** Views shipments queue
   - ✅ Sees new box order in "queued" status
   - ✅ Clicks to view details
   - ✅ Marks as "packed"

5. **Admin Action:** Ships box
   - ✅ Updates status to "shipped"
   - ✅ Adds tracking number
   - ✅ Customer receives shipped email

6. **Customer Action:** Views account
   - ✅ Sees active subscription
   - ✅ Sees shipped box with tracking
   - ✅ Can click "Manage Billing" → portal

7. **Webhook:** `invoice.payment_succeeded` (second payment, 1 month later)
   - ✅ New box order created for next cycle
   - ✅ Uses updated address if customer changed it
   - ✅ Renewal email sent

**Success Criteria:**
- [ ] All steps complete without errors
- [ ] All emails received
- [ ] All database records correct
- [ ] Customer can manage subscription
- [ ] Admin can fulfill orders

---

## Migration Path for Existing Data

### If Subscriptions Already Exist

**Problem:** Existing subscriptions in database don't have:
- `plan_id` reference
- Associated addresses
- Box orders

**Solution:** Data migration script

```sql
-- 1. Create default plan for existing subscriptions
INSERT INTO plans (name, interval, stripe_price_id, cutoff_day)
SELECT DISTINCT
  'Monthly Box' as name,
  billing_interval,
  stripe_price_id,
  20 as cutoff_day
FROM subscriptions
WHERE stripe_price_id IS NOT NULL;

-- 2. Update subscriptions to reference plans
UPDATE subscriptions s
SET plan_id = p.id
FROM plans p
WHERE s.stripe_price_id = p.stripe_price_id;

-- 3. Create addresses from order shipping data
INSERT INTO addresses (customer_id, name, address_line1, address_line2, city, postcode, country, is_default)
SELECT DISTINCT ON (customer_id)
  customer_id,
  shipping_name,
  shipping_address_line1,
  shipping_address_line2,
  shipping_city,
  shipping_postcode,
  shipping_country,
  true as is_default
FROM orders
WHERE customer_id IS NOT NULL
  AND shipping_name IS NOT NULL
ORDER BY customer_id, created_at DESC;

-- 4. Create box orders for active subscriptions (current cycle only)
INSERT INTO box_orders (subscription_id, customer_id, cycle_key, status, address_snapshot)
SELECT
  s.id,
  s.customer_id,
  to_char(NOW(), 'YYYY-MM') as cycle_key,
  'queued' as status,
  row_to_json(a.*) as address_snapshot
FROM subscriptions s
JOIN addresses a ON a.customer_id = s.customer_id AND a.is_default = true
WHERE s.status = 'active';
```

**Run After:** Phase 1 (Task 1.1) complete

---

## Success Metrics

### Technical Metrics
- [ ] Zero duplicate box orders (idempotency working)
- [ ] 100% webhook success rate
- [ ] < 1 second webhook processing time
- [ ] All emails delivered (check email_logs)

### Business Metrics
- [ ] Customers can self-serve (reduce support tickets)
- [ ] Admin can fulfill orders in < 5 min per box
- [ ] Zero missed shipments due to system errors
- [ ] Customer satisfaction with subscription experience

### Monitoring
- [ ] Set up Stripe webhook monitoring
- [ ] Alert on failed webhooks
- [ ] Alert on failed emails
- [ ] Dashboard for box_orders by status

---

## Conclusion

### Current State
- ✅ 30% complete
- ✅ Basic infrastructure exists
- ⚠️ Missing critical fulfillment system

### After Implementation
- ✅ 100% MVP complete
- ✅ Customers can subscribe and manage
- ✅ Admin can fulfill orders
- ✅ Automated billing and notifications

### Estimated Timeline
- **Sprint 1 (Foundation):** 2 weeks
- **Sprint 2 (Customer):** 1 week
- **Sprint 3 (Admin):** 1 week
- **Total:** 4 weeks to production-ready

### Next Immediate Steps
1. ✅ Review this audit with team
2. ✅ Create `plans` table migration (Task 1.1)
3. ✅ Implement cycle helper (Task 1.2)
4. ✅ Update webhook handlers (Task 1.3)
5. ✅ Test with Stripe CLI
6. ✅ Deploy to staging
7. ✅ Run end-to-end test
8. ✅ Deploy to production

---

**Document Version:** 1.0
**Last Updated:** 2026-02-13
**Author:** Augment Agent
**Status:** Ready for Implementation

