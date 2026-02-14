# Cycle Helper Functions

**Location:** `supabase/functions/_shared/cycle-helpers.ts`  
**Purpose:** Calculate subscription cycle keys for fulfillment tracking

---

## What is a Cycle Key?

A **cycle key** is a string in format `"YYYY-MM"` (e.g., `"2026-02"`) that represents which month a subscription box should be shipped.

**Example:**
- Customer pays on Feb 25, 2026
- Your cutoff is the 20th
- Payment is after cutoff → ship in March
- Cycle key = `"2026-03"`

---

## Functions

### 1. `getNextCycleKey(billingDate, cutoffDay)`

**Purpose:** Calculate which month to ship based on payment date and cutoff

**Parameters:**
- `billingDate` (Date) - When the subscription was billed
- `cutoffDay` (number) - Day of month (1-28) after which next cycle ships

**Returns:** `string` - Cycle key in format "YYYY-MM"

**Examples:**
```typescript
import { getNextCycleKey } from './_shared/cycle-helpers.ts'

// Payment before cutoff → ship this month
getNextCycleKey(new Date('2026-02-15'), 20)
// Returns: "2026-02"

// Payment after cutoff → ship next month
getNextCycleKey(new Date('2026-02-25'), 20)
// Returns: "2026-03"

// Year rollover
getNextCycleKey(new Date('2026-12-25'), 20)
// Returns: "2027-01"
```

---

### 2. `getCurrentCycleKey()`

**Purpose:** Get the current month as a cycle key

**Returns:** `string` - Current cycle key

**Example:**
```typescript
import { getCurrentCycleKey } from './_shared/cycle-helpers.ts'

// If today is Feb 15, 2026
getCurrentCycleKey()
// Returns: "2026-02"
```

**Use Case:** Filter admin UI to show this month's orders
```typescript
const currentCycle = getCurrentCycleKey()
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('cycle_key', currentCycle)
  .eq('order_type', 'subscription_renewal')
```

---

### 3. `parseCycleKey(cycleKey)`

**Purpose:** Parse a cycle key into its components

**Parameters:**
- `cycleKey` (string) - Cycle key in format "YYYY-MM"

**Returns:** Object with `{ year, month, monthName }`

**Example:**
```typescript
import { parseCycleKey } from './_shared/cycle-helpers.ts'

parseCycleKey("2026-02")
// Returns: { year: 2026, month: 2, monthName: "February" }
```

---

### 4. `formatCycleKey(cycleKey)`

**Purpose:** Format a cycle key for display

**Parameters:**
- `cycleKey` (string) - Cycle key in format "YYYY-MM"

**Returns:** `string` - Human-readable format

**Example:**
```typescript
import { formatCycleKey } from './_shared/cycle-helpers.ts'

formatCycleKey("2026-02")
// Returns: "February 2026"
```

**Use Case:** Display in UI
```vue
<template>
  <h2>{{ formatCycleKey(order.cycle_key) }} Box</h2>
  <!-- Shows: "February 2026 Box" -->
</template>
```

---

### 5. `getNextCycles(startCycleKey, count)`

**Purpose:** Generate next N cycle keys (for showing upcoming shipments)

**Parameters:**
- `startCycleKey` (string) - Starting cycle key
- `count` (number) - Number of cycles to generate

**Returns:** `string[]` - Array of cycle keys

**Example:**
```typescript
import { getNextCycles } from './_shared/cycle-helpers.ts'

getNextCycles("2026-02", 3)
// Returns: ["2026-02", "2026-03", "2026-04"]

// Handles year rollover
getNextCycles("2026-11", 3)
// Returns: ["2026-11", "2026-12", "2027-01"]
```

**Use Case:** Show upcoming shipments to customer
```typescript
const upcomingCycles = getNextCycles(getCurrentCycleKey(), 6)
// Show next 6 months of shipments
```

---

## Usage in Webhook Handler

```typescript
import { getNextCycleKey } from '../_shared/cycle-helpers.ts'

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Get subscription and plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('stripe_subscription_id', invoice.subscription)
    .single()
  
  // Calculate which month to ship
  const cycleKey = getNextCycleKey(
    new Date(invoice.created * 1000),  // Stripe timestamp in seconds
    subscription.plan.cutoff_day        // From plans table
  )
  
  // Create order with cycle_key
  await supabase.from('orders').insert({
    order_type: 'subscription_renewal',
    cycle_key: cycleKey,  // "2026-03"
    status: 'queued',
    // ... other fields
  })
}
```

---

## Usage in Admin UI

```typescript
import { getCurrentCycleKey, formatCycleKey } from '../_shared/cycle-helpers.ts'

// Filter orders by current cycle
const currentCycle = getCurrentCycleKey()

const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('order_type', 'subscription_renewal')
  .eq('cycle_key', currentCycle)
  .in('status', ['queued', 'packed'])

// Display in UI
orders.forEach(order => {
  console.log(`${formatCycleKey(order.cycle_key)} - ${order.customer_email}`)
  // Output: "February 2026 - customer@example.com"
})
```

---

## Running Tests

```bash
# Run all tests
deno test supabase/functions/_shared/cycle-helpers.test.ts

# Run with verbose output
deno test --allow-all supabase/functions/_shared/cycle-helpers.test.ts

# Watch mode (re-run on file changes)
deno test --watch supabase/functions/_shared/cycle-helpers.test.ts
```

**Expected output:**
```
running 25 tests from ./cycle-helpers.test.ts
✅ getNextCycleKey: payment before cutoff returns current month
✅ getNextCycleKey: payment after cutoff returns next month
✅ getNextCycleKey: handles year rollover
... (22 more tests)

test result: ok. 25 passed; 0 failed; 0 ignored
```

---

## Error Handling

All functions validate inputs and throw descriptive errors:

```typescript
// Invalid date
getNextCycleKey(new Date('invalid'), 20)
// Throws: Error: Invalid billing date

// Invalid cutoff day
getNextCycleKey(new Date(), 0)
// Throws: Error: Cutoff day must be between 1 and 28

// Invalid cycle key format
parseCycleKey('2026/02')
// Throws: Error: Invalid cycle key format: 2026/02. Expected YYYY-MM
```

---

## Next Steps

After creating cycle helpers:
1. ✅ **Cycle helpers created** ← You are here
2. ⏭️ **Update webhook handler** to use `getNextCycleKey()`
3. ⏭️ **Build admin UI** to filter by `getCurrentCycleKey()`
4. ⏭️ **Build customer UI** to show upcoming cycles with `getNextCycles()`

**See:** `docs/subscription-epic-audit.md` Task 1.3 for webhook implementation

