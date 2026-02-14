# Subscription Implementation - Next Steps

**Quick Start Guide** | Last Updated: 2026-02-13

---

## 📋 TL;DR

Your subscription system is **30% complete**. The checkout flow works, but you're missing the **fulfillment system** that creates and ships boxes.

**Critical Missing Pieces:**
1. ❌ Extend `orders` table - Add cycle_key, tracking, shipped_at fields (we can reuse existing table!)
2. ❌ `stripe_events` table - Webhooks could create duplicates
3. ❌ `addresses` table - No reusable shipping addresses
4. ❌ Webhook handlers - Can't process recurring payments
5. ❌ Cycle logic - Can't determine when to ship boxes

**Good News:** We can use the existing `orders` table instead of creating `box_orders`! See `docs/orders-vs-box-orders-analysis.md`

---

## 🚀 Start Here (Week 1-2)

### Task 1: Database Schema (2 hours - reduced!)
**File:** `supabase/migrations/20260213_subscription_fulfillment.sql`

**Extend existing `orders` table:**
- Add `cycle_key`, `tracking_number`, `shipped_at`, `delivered_at` fields
- Extend status enum to include: `queued`, `packed`, `shipped`, `delivered`

**Create 3 new tables:**
- `plans` - Subscription plan configuration
- `addresses` - Customer shipping addresses
- `stripe_events` - Webhook idempotency

**See:** `docs/subscription-epic-audit.md` lines 502-632 for full SQL

---

### Task 2: Cycle Helper Function (2 hours)
**File:** `supabase/functions/_shared/cycle-helpers.ts`

Create function to calculate which month a box should ship:
```typescript
getNextCycleKey(billingDate, cutoffDay) → "2026-03"
```

**See:** `docs/subscription-epic-audit.md` lines 635-650 for implementation

---

### Task 3: Webhook Handlers (8 hours) ⚠️ CRITICAL
**File:** `supabase/functions/stripe-webhook/index.ts`

Add handlers for:
- `invoice.payment_succeeded` → Create box_order
- `customer.subscription.updated` → Update status
- `customer.subscription.deleted` → Mark cancelled
- `invoice.payment_failed` → Send dunning email

**See:** `docs/subscription-epic-audit.md` lines 655-730 for full code

---

## 📊 Testing After Week 1-2

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Listen to webhooks locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded

# Check database
# ✅ subscription record created
# ✅ box_order created with cycle_key
# ✅ stripe_events logged
# ✅ email sent
```

---

## 📖 Full Documentation

**Comprehensive Audit:** `docs/subscription-epic-audit.md` (1,255 lines)

**Sections:**
- Executive Summary (lines 1-30)
- Phase-by-Phase Analysis (lines 33-450)
- Updated Epic with Tasks (lines 453-925)
- Implementation Order (lines 928-1050)
- Testing Strategy (lines 1053-1150)
- Migration Path (lines 1153-1220)
- Success Metrics (lines 1223-1254)

---

## 🎯 Success Criteria

After implementing the 3 tasks above, you should be able to:

1. ✅ Customer subscribes via Stripe checkout
2. ✅ Webhook creates subscription record
3. ✅ Webhook creates order (type='subscription_renewal') for first month
4. ✅ Admin sees order in queue (once UI built)
5. ✅ Next month's payment creates another order
6. ✅ No duplicate orders (idempotency working)

---

## 🔄 What Happens Next (Week 3-4)

After the backend works, build the UI:

**Week 3: Customer UI**
- Billing portal button
- Subscriptions list page
- Address management

**Week 4: Admin UI**
- Shipments queue
- Mark as shipped
- Add tracking numbers

**See:** `docs/subscription-epic-audit.md` lines 733-925 for details

---

## ⚡ Quick Reference

| What | Where | Status |
|------|-------|--------|
| Database schema | `docs/schema.sql` | ⚠️ Need to extend `orders` + add 3 tables |
| Webhook handler | `supabase/functions/stripe-webhook/` | ⚠️ Missing subscription events |
| Checkout function | `supabase/functions/create-subscription-checkout-session/` | ✅ Working |
| Email templates | `supabase/functions/send-email/templates/` | ✅ Mostly done |
| Customer UI | `app/src/views/Account.vue` | ❌ Placeholder only |
| Admin UI | `app/src/views/admin/SubscriptionsList.vue` | ❌ Placeholder only |

---

## 🆘 Need Help?

1. **Read the audit:** `docs/subscription-epic-audit.md`
2. **Check existing code:** Look at `stripe-webhook/index.ts` for patterns
3. **Test with Stripe CLI:** Use `stripe trigger` commands
4. **Review Stripe docs:** https://stripe.com/docs/billing/subscriptions/overview

---

**Ready to start?** → Begin with Task 1 (Database Schema)

