# Subscription Fulfillment Migration Guide

**Migration Date:** 2026-02-13  
**Migration Files:**
- `20260213_subscription_fulfillment.sql` - Main migration
- `20260213_subscription_fulfillment_test.sql` - Test script
- `20260213_subscription_fulfillment_seed.sql` - Seed data for plans

---

## What This Migration Does

### 1. Extends `orders` Table
Adds subscription fulfillment tracking fields:
- `cycle_key` - Which month to ship (format: "YYYY-MM")
- `tracking_number` - Shipping carrier tracking number
- `shipped_at` - When order was shipped
- `delivered_at` - When order was delivered

Extends status enum to include:
- `queued` - Ready to pack
- `packed` - Packed, ready to ship
- `shipped` - Shipped with tracking
- `delivered` - Delivered to customer

### 2. Creates New Tables
- **`plans`** - Subscription plan configuration (links to Stripe prices)
- **`addresses`** - Reusable customer shipping addresses
- **`stripe_events`** - Webhook idempotency tracking

### 3. Adds RLS Policies
- Users can manage their own addresses
- Public can view active plans
- Existing order RLS policies remain unchanged

### 4. Adds Helper Function
- `ensure_single_default_address()` - Ensures only one default address per customer

---

## How to Apply

### Option 1: Supabase CLI (Recommended)

```bash
# Make sure you're in the project root
cd /Users/alexishindle/repos/projects/lola-as-one

# Link to your Supabase project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push

# Or apply specific migration
supabase db push --include-all
```

### Option 2: Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `20260213_subscription_fulfillment.sql`
5. Click **Run**

### Option 3: Local Development

```bash
# Start local Supabase
supabase start

# Migration will be applied automatically
# Or manually apply:
supabase db reset
```

---

## Testing the Migration

### Run the Test Script

```bash
# Using Supabase CLI
supabase db execute --file supabase/migrations/20260213_subscription_fulfillment_test.sql

# Or in SQL Editor
# Copy and paste contents of 20260213_subscription_fulfillment_test.sql
```

Expected output:
```
✅ Test 1 PASSED: Orders table has all new columns
✅ Test 2 PASSED: All new tables exist
✅ Test 3 PASSED: All indexes created
✅ Test 4 PASSED: Can insert plan
✅ Test 7 PASSED: Stripe events idempotency working
✅ All automated tests passed! Migration successful.
```

### Manual Verification

```sql
-- Check orders table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('cycle_key', 'tracking_number', 'shipped_at', 'delivered_at');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('plans', 'addresses', 'stripe_events');

-- Check status constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'orders_status_check';
```

---

## Seeding Initial Data

### 1. Get Your Stripe Price IDs

1. Go to https://dashboard.stripe.com/prices
2. Find your subscription prices
3. Copy the `price_xxx` IDs

### 2. Update Seed File

Edit `20260213_subscription_fulfillment_seed.sql`:
```sql
-- Replace these placeholders with your actual Stripe Price IDs
'price_REPLACE_WITH_YOUR_MONTHLY_PRICE_ID'
'price_REPLACE_WITH_YOUR_QUARTERLY_PRICE_ID'
'price_REPLACE_WITH_YOUR_ANNUAL_PRICE_ID'
```

### 3. Run Seed File

```bash
# Using Supabase CLI
supabase db execute --file supabase/migrations/20260213_subscription_fulfillment_seed.sql

# Or copy/paste into SQL Editor
```

---

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove new columns from orders
ALTER TABLE orders 
  DROP COLUMN IF EXISTS cycle_key,
  DROP COLUMN IF EXISTS tracking_number,
  DROP COLUMN IF EXISTS shipped_at,
  DROP COLUMN IF EXISTS delivered_at;

-- Restore original status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded'));

-- Drop new tables
DROP TABLE IF EXISTS stripe_events;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS plans;

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON addresses;
DROP FUNCTION IF EXISTS ensure_single_default_address();
```

---

## Next Steps After Migration

1. ✅ **Verify migration** - Run test script
2. ✅ **Seed plans** - Add your Stripe price IDs
3. ⏭️ **Create cycle helper function** - See `docs/subscription-epic-audit.md`
4. ⏭️ **Update webhook handler** - Add subscription event handlers
5. ⏭️ **Build admin UI** - Shipments queue view
6. ⏭️ **Build customer UI** - Address management

---

## Troubleshooting

### Error: "relation orders already has column cycle_key"
The migration has already been applied. Safe to ignore or use `IF NOT EXISTS` clauses.

### Error: "constraint orders_status_check already exists"
Drop the existing constraint first:
```sql
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
```

### Error: "duplicate key value violates unique constraint"
When seeding plans, you're trying to insert a plan with a stripe_price_id that already exists.
The seed file uses `ON CONFLICT DO UPDATE` to handle this.

---

## Support

For questions or issues:
1. Check `docs/subscription-epic-audit.md` for full context
2. Check `docs/orders-vs-box-orders-analysis.md` for design decisions
3. Review Supabase logs: `supabase logs db`

