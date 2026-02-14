# Subscription Migration - Quick Start

**🎯 Goal:** Add subscription fulfillment to your existing database

---

## ⚡ Quick Apply (3 Steps)

### Step 1: Apply Migration (2 min)

```bash
cd /Users/alexishindle/repos/projects/lola-as-one
supabase db push
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy/paste `supabase/migrations/20260213_subscription_fulfillment.sql`
3. Click Run

---

### Step 2: Test Migration (1 min)

```bash
supabase db execute --file supabase/migrations/20260213_subscription_fulfillment_test.sql
```

Expected: `✅ All automated tests passed!`

---

### Step 3: Seed Plans (2 min)

1. Get your Stripe Price IDs from https://dashboard.stripe.com/prices
2. Edit `supabase/migrations/20260213_subscription_fulfillment_seed.sql`
3. Replace `price_REPLACE_WITH_YOUR_xxx_PRICE_ID` with actual IDs
4. Run:

```bash
supabase db execute --file supabase/migrations/20260213_subscription_fulfillment_seed.sql
```

---

## 📊 What Changed

### Extended `orders` Table
```sql
-- NEW FIELDS:
cycle_key          TEXT              -- "2026-02" (which month)
tracking_number    TEXT              -- Tracking number
shipped_at         TIMESTAMPTZ       -- When shipped
delivered_at       TIMESTAMPTZ       -- When delivered

-- NEW STATUS VALUES:
'queued'    -- Ready to pack
'packed'    -- Packed, ready to ship  
'shipped'   -- Shipped with tracking
'delivered' -- Delivered
```

### New Tables
```sql
plans           -- Subscription plan config (links to Stripe)
addresses       -- Customer shipping addresses
stripe_events   -- Webhook idempotency
```

---

## 🔍 Verify It Worked

```sql
-- Check orders table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'cycle_key';
-- Should return: cycle_key

-- Check new tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('plans', 'addresses', 'stripe_events');
-- Should return: 3 rows

-- Check plans
SELECT * FROM plans;
-- Should show your subscription plans
```

---

## 🚀 Next Steps

After migration is complete:

1. ✅ **Create cycle helper function** → See Task 1.2 in audit doc
2. ✅ **Update webhook handler** → See Task 1.3 in audit doc
3. ✅ **Build admin UI** → Shipments queue
4. ✅ **Build customer UI** → Address management

**Full details:** `docs/subscription-epic-audit.md`

---

## 🆘 Troubleshooting

**Error: "column already exists"**
→ Migration already applied, safe to ignore

**Error: "constraint already exists"**
→ Run: `ALTER TABLE orders DROP CONSTRAINT orders_status_check;` then retry

**No plans showing up**
→ Make sure you replaced the Stripe Price IDs in the seed file

---

## 📚 Documentation

- **Full Migration Guide:** `supabase/migrations/README_SUBSCRIPTION_MIGRATION.md`
- **Schema Analysis:** `docs/orders-vs-box-orders-analysis.md`
- **Complete Audit:** `docs/subscription-epic-audit.md`
- **Next Steps:** `docs/NEXT_STEPS.md`

---

**Estimated Time:** 5 minutes  
**Difficulty:** Easy  
**Rollback:** Available (see README_SUBSCRIPTION_MIGRATION.md)

