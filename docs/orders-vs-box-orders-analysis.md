# Analysis: Can We Use `orders` Table Instead of `box_orders`?

**Date:** 2026-02-13  
**Question:** Can we reuse the existing `orders` table for subscription fulfillment instead of creating a separate `box_orders` table?

---

## TL;DR: **YES! ✅ We can use `orders` table**

The `orders` table already has most of what we need. We just need to add a few fields.

---

## Comparison

### What `box_orders` Needed:
```sql
CREATE TABLE box_orders (
  id UUID PRIMARY KEY,
  subscription_id UUID,           -- Link to subscription
  customer_id UUID,                -- Who it's for
  cycle_key TEXT,                  -- "2026-02" (which month)
  status TEXT,                     -- queued/packed/shipped/delivered
  address_snapshot JSONB,          -- Frozen address
  tracking_number TEXT,            -- Shipping tracking
  shipped_at TIMESTAMPTZ,          -- When shipped
  delivered_at TIMESTAMPTZ,        -- When delivered
  notes TEXT,                      -- Admin notes
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### What `orders` Already Has:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number TEXT,
  customer_id UUID,                ✅ Already exists
  customer_email TEXT,             ✅ Already exists
  order_type TEXT,                 ✅ Has 'subscription_renewal'!
  stripe_subscription_id TEXT,     ✅ Already exists (can link to subscription)
  
  -- Address fields (already frozen per order)
  shipping_name TEXT,              ✅ Already exists
  shipping_address_line1 TEXT,     ✅ Already exists
  shipping_address_line2 TEXT,     ✅ Already exists
  shipping_city TEXT,              ✅ Already exists
  shipping_postcode TEXT,          ✅ Already exists
  shipping_country TEXT,           ✅ Already exists
  
  -- Pricing
  subtotal_gbp DECIMAL,            ✅ Already exists
  shipping_gbp DECIMAL,            ✅ Already exists
  tax_gbp DECIMAL,                 ✅ Already exists
  total_gbp DECIMAL,               ✅ Already exists
  
  -- Status
  status TEXT,                     ✅ Has: pending/paid/fulfilled/cancelled/refunded
  fulfilled_at TIMESTAMPTZ,        ✅ Already exists
  
  created_at TIMESTAMPTZ,          ✅ Already exists
  updated_at TIMESTAMPTZ           ✅ Already exists
);
```

### What's Missing from `orders`:
- ❌ `cycle_key` (e.g., "2026-02") - **NEED TO ADD**
- ❌ `tracking_number` - **NEED TO ADD**
- ❌ `shipped_at` - **NEED TO ADD**
- ❌ `delivered_at` - **NEED TO ADD**
- ❌ Status values: `queued`, `packed`, `shipped`, `delivered` - **NEED TO ADD**

---

## Recommendation: **Extend `orders` Table** ✅

Instead of creating a new `box_orders` table, we should:

### 1. Add Missing Fields to `orders`
```sql
ALTER TABLE orders 
  ADD COLUMN cycle_key TEXT,
  ADD COLUMN tracking_number TEXT,
  ADD COLUMN shipped_at TIMESTAMPTZ,
  ADD COLUMN delivered_at TIMESTAMPTZ;

-- Add index for cycle_key (for filtering by month)
CREATE INDEX idx_orders_cycle_key ON orders(cycle_key);
CREATE INDEX idx_orders_tracking ON orders(tracking_number);
```

### 2. Extend Status Values
```sql
-- Current: 'pending', 'paid', 'fulfilled', 'cancelled', 'refunded'
-- Add: 'queued', 'packed', 'shipped', 'delivered'

ALTER TABLE orders 
  DROP CONSTRAINT orders_status_check;

ALTER TABLE orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'pending',      -- Awaiting payment
    'paid',         -- Payment received
    'queued',       -- Ready to pack (subscription boxes)
    'packed',       -- Packed, ready to ship
    'shipped',      -- Shipped with tracking
    'delivered',    -- Delivered to customer
    'fulfilled',    -- Completed (legacy)
    'cancelled',    -- Cancelled
    'refunded'      -- Refunded
  ));
```

---

## Benefits of Using `orders` Table

### ✅ Pros:
1. **Unified Order History** - Customer sees all orders (one-time + subscription) in one place
2. **Reuse Existing Code** - Order confirmation emails, order detail pages already work
3. **Simpler Schema** - One less table to manage
4. **Already Has Pricing** - Can charge different amounts per box if needed
5. **Already Has Address Snapshot** - Shipping address is frozen per order
6. **Already Has `order_items`** - Can list what's in each box
7. **Stripe Integration** - Already has `stripe_payment_intent_id` for tracking payments

### ⚠️ Cons:
1. **Mixed Concerns** - One-time orders and subscription boxes in same table
2. **Status Complexity** - More status values to handle
3. **Query Complexity** - Need to filter by `order_type` to separate one-time vs. subscription

### 🎯 Verdict: **Pros Outweigh Cons**

The `orders` table was clearly designed with subscriptions in mind (note the `order_type` enum and `stripe_subscription_id` field). We should use it!

---

## Updated Implementation Plan

### Task 1.1: Extend `orders` Table (2 hours instead of 4)
**File:** `supabase/migrations/20260213_subscription_fulfillment.sql`

```sql
-- Add subscription fulfillment fields to orders table
ALTER TABLE orders 
  ADD COLUMN cycle_key TEXT,
  ADD COLUMN tracking_number TEXT,
  ADD COLUMN shipped_at TIMESTAMPTZ,
  ADD COLUMN delivered_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX idx_orders_cycle_key ON orders(cycle_key);
CREATE INDEX idx_orders_tracking ON orders(tracking_number);

-- Extend status values
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'pending', 'paid', 'queued', 'packed', 'shipped', 
    'delivered', 'fulfilled', 'cancelled', 'refunded'
  ));

-- Still need these tables:
CREATE TABLE plans (...);
CREATE TABLE addresses (...);
CREATE TABLE stripe_events (...);
```

### Webhook Handler Changes
```typescript
// In handleInvoicePaymentSucceeded()
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = invoice.subscription as string
  
  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single()
  
  // Get default address
  const { data: address } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', subscription.customer_id)
    .eq('is_default', true)
    .single()
  
  // Calculate cycle key
  const cycleKey = getNextCycleKey(
    new Date(invoice.created * 1000),
    subscription.plan.cutoff_day
  )
  
  // Create order (not box_order!)
  const { data: order } = await supabase.from('orders').insert({
    order_number: `SUB-${Date.now()}`, // Generate order number
    customer_id: subscription.customer_id,
    customer_email: subscription.customer_email,
    order_type: 'subscription_renewal',
    stripe_subscription_id: stripeSubscriptionId,
    stripe_payment_intent_id: invoice.payment_intent,
    
    // Pricing from invoice
    subtotal_gbp: invoice.amount_paid / 100,
    shipping_gbp: 0,
    tax_gbp: invoice.tax / 100,
    total_gbp: invoice.amount_paid / 100,
    
    // Address snapshot
    shipping_name: address.name,
    shipping_address_line1: address.address_line1,
    shipping_address_line2: address.address_line2,
    shipping_city: address.city,
    shipping_postcode: address.postcode,
    shipping_country: address.country,
    
    // Fulfillment fields
    cycle_key: cycleKey,
    status: 'queued', // Ready to pack
  }).select().single()
  
  // Create order_items for the subscription box contents
  // (This would list what's in the box)
  
  // Send email
  await sendEmail({
    template: 'subscription-renewal-success',
    recipient: subscription.customer_email,
    data: { subscription, order, cycleKey }
  })
}
```

---

## Admin UI Changes

Instead of "Shipments Queue", it becomes "Orders Queue" filtered by subscription orders:

```typescript
// In admin/SubscriptionsList.vue or admin/OrdersList.vue
const { data: subscriptionOrders } = await supabase
  .from('orders')
  .select('*, customer:customers(*), subscription:subscriptions(*)')
  .eq('order_type', 'subscription_renewal')
  .in('status', ['queued', 'packed'])
  .order('cycle_key', { ascending: true })
```

---

## Conclusion

**YES - Use the `orders` table!** ✅

Just add 4 fields:
- `cycle_key`
- `tracking_number`
- `shipped_at`
- `delivered_at`

And extend the status enum to include:
- `queued`
- `packed`
- `shipped`
- `delivered`

This is simpler, cleaner, and leverages existing infrastructure.

