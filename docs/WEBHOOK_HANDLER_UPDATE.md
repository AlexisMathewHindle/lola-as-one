# Webhook Handler Update - Subscription Support

**Date:** 2026-02-13  
**File:** `supabase/functions/stripe-webhook/index.ts`  
**Status:** ✅ Complete

---

## Summary

Updated the Stripe webhook handler to support subscription events and use cycle helpers for fulfillment tracking.

---

## Changes Made

### 1. Added Import ✅

```typescript
import { getNextCycleKey } from '../_shared/cycle-helpers.ts'
```

### 2. Added Idempotency Check ✅

**Location:** Lines 67-82  
**Purpose:** Prevent duplicate processing when Stripe retries webhooks

```typescript
// Check if event already processed
const { data: existingEvent } = await supabase
  .from('stripe_events')
  .select('id')
  .eq('id', event.id)
  .single()

if (existingEvent) {
  console.log('⚠️ Event already processed:', event.id)
  return new Response(JSON.stringify({ received: true, cached: true }), { status: 200 })
}
```

### 3. Added Subscription Event Handlers ✅

#### A. `customer.subscription.created` (Lines 546-621)

**Purpose:** Create subscription record when customer subscribes

**Actions:**
- ✅ Find or create customer in database
- ✅ Get plan from database using Stripe price ID
- ✅ Create subscription record with status and billing dates

#### B. `customer.subscription.updated` (Lines 623-645)

**Purpose:** Update subscription when status or dates change

**Actions:**
- ✅ Update subscription status
- ✅ Update billing period dates
- ✅ Update cancellation status

#### C. `customer.subscription.deleted` (Lines 647-665)

**Purpose:** Mark subscription as canceled

**Actions:**
- ✅ Set status to 'canceled'
- ✅ Set canceled_at timestamp

#### D. `invoice.payment_succeeded` (Lines 667-757) **⭐ CRITICAL**

**Purpose:** Create subscription order with cycle key when payment succeeds

**Actions:**
- ✅ Get subscription from database with plan
- ✅ Get customer's default address
- ✅ **Calculate cycle key using `getNextCycleKey()`**
- ✅ Create order with `order_type='subscription_renewal'`
- ✅ Set order status to 'queued'
- ✅ Snapshot shipping address

**Key Code:**
```typescript
// Calculate which month to ship
const billingDate = new Date(invoice.created * 1000)
const cycleKey = getNextCycleKey(billingDate, subscription.plan.cutoff_day)

// Create order with cycle_key
await supabase.from('orders').insert({
  order_type: 'subscription_renewal',
  cycle_key: cycleKey,  // "2026-03"
  status: 'queued',
  // ... address snapshot, pricing, etc.
})
```

#### E. `invoice.payment_failed` (Lines 759-785)

**Purpose:** Handle failed subscription payments

**Actions:**
- ✅ Update subscription status to 'past_due'
- 📝 TODO: Send payment failed email

### 4. Added Event Logging ✅

**Location:** Lines 802-813  
**Purpose:** Log processed events for idempotency

```typescript
// Log event as processed
await supabase.from('stripe_events').insert({
  id: event.id,
  type: event.type,
})
```

---

## Event Flow

### Subscription Creation Flow

```
1. Customer completes checkout (mode=subscription)
   ↓
2. Stripe sends: checkout.session.completed
   → Currently skipped (lines 76-79)
   ↓
3. Stripe sends: customer.subscription.created
   → Handler creates subscription record
   ↓
4. Stripe sends: invoice.payment_succeeded
   → Handler creates order with cycle_key
   → Order status: 'queued'
```

### Monthly Renewal Flow

```
1. Stripe charges customer on billing date
   ↓
2. Stripe sends: invoice.payment_succeeded
   → Handler calculates cycle_key
   → Handler creates order
   → Order queued for fulfillment
```

### Cancellation Flow

```
1. Customer cancels subscription
   ↓
2. Stripe sends: customer.subscription.updated
   → Handler updates cancel_at_period_end
   ↓
3. At period end, Stripe sends: customer.subscription.deleted
   → Handler marks subscription as canceled
```

---

## Cycle Key Logic

**Example 1: Payment Before Cutoff**
```
Billing Date: Feb 15, 2026
Cutoff Day: 20
Result: cycle_key = "2026-02" (ship in February)
```

**Example 2: Payment After Cutoff**
```
Billing Date: Feb 25, 2026
Cutoff Day: 20
Result: cycle_key = "2026-03" (ship in March)
```

**Example 3: Year Rollover**
```
Billing Date: Dec 25, 2026
Cutoff Day: 20
Result: cycle_key = "2027-01" (ship in January)
```

---

## Database Tables Used

| Table | Purpose |
|-------|---------|
| `customers` | Store customer records |
| `subscriptions` | Store subscription records |
| `plans` | Store subscription plan configuration |
| `addresses` | Store customer shipping addresses |
| `orders` | Store subscription orders with cycle_key |
| `stripe_events` | Track processed webhook events (idempotency) |

---

## Testing

### Test Subscription Creation

```bash
# Use Stripe CLI to trigger test webhook
stripe trigger customer.subscription.created
```

### Test Payment Success

```bash
# Trigger invoice payment
stripe trigger invoice.payment_succeeded
```

### Check Database

```sql
-- Check subscription was created
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;

-- Check order was created with cycle_key
SELECT order_number, cycle_key, status, total_gbp 
FROM orders 
WHERE order_type = 'subscription_renewal' 
ORDER BY created_at DESC 
LIMIT 1;

-- Check event was logged
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 5;
```

---

## TODO Items

- [ ] Send subscription renewal confirmation email (line 755)
- [ ] Send payment failed email to customer (line 783)
- [ ] Handle subscription checkout sessions (currently skipped at line 76-79)
- [ ] Add email notification when customer has no default address (line 714)

---

## Next Steps

1. ✅ **Webhook handler updated** ← You are here
2. ⏭️ **Test webhook handlers** with Stripe CLI
3. ⏭️ **Build admin UI** to view queued orders by cycle
4. ⏭️ **Build customer billing portal** to manage subscriptions

**See:** `docs/subscription-epic-audit.md` for full implementation roadmap


