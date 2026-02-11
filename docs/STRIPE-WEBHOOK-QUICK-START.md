# Stripe Webhook Quick Start

Get your Stripe webhooks up and running in 5 minutes.

## 🚀 Quick Setup

### 1. Get Your Stripe Keys (2 minutes)

**Stripe Secret Key:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Secret key** (starts with `sk_test_`)

**Webhook Secret (for production):**
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. URL: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
4. Events: Select `checkout.session.completed` and `checkout.session.expired`
5. Copy **Signing secret** (starts with `whsec_`)

### 2. Set Environment Variables (1 minute)

```bash
# Required secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# If not already set
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set APP_URL=https://your-app-domain.com
```

### 3. Deploy the Function (1 minute)

```bash
./scripts/deploy-stripe-webhook.sh
```

Or manually:
```bash
supabase functions deploy stripe-webhook
```

### 4. Test It (1 minute)

**Option A: Using Stripe CLI (Local)**
```bash
# Terminal 1: Start local Supabase
supabase start

# Terminal 2: Forward webhooks
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Terminal 3: Trigger test event
stripe trigger checkout.session.completed
```

**Option B: Using Stripe Dashboard (Production)**
1. Go to your webhook endpoint in Stripe Dashboard
2. Click **Send test webhook**
3. Select `checkout.session.completed`
4. Click **Send test webhook**

### 5. Verify (30 seconds)

Check the logs:
```bash
supabase functions logs stripe-webhook
```

You should see:
```
Received Stripe event: checkout.session.completed
Order processing complete: ORD-20260207-000001
```

---

## 🎯 What the Webhook Does

When a customer completes payment, the webhook automatically:

1. ✅ Creates a customer record (if new)
2. ✅ Creates an order with order number
3. ✅ Creates order items
4. ✅ Decrements inventory for physical products
5. ✅ Decrements event capacity for workshops
6. ✅ Creates bookings for events

---

## 🔍 Troubleshooting

### "Missing signature or webhook secret"
```bash
# Verify secrets are set
supabase secrets list

# If missing, set them
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### "Webhook signature verification failed"
- Make sure you're using the correct webhook secret for your environment
- Local: Use secret from `stripe listen` command
- Production: Use secret from Stripe Dashboard webhook endpoint

### "Order not created"
```bash
# Check function logs for errors
supabase functions logs stripe-webhook --follow

# Common issues:
# - Missing metadata in checkout session
# - Database RLS policies blocking insert
# - Invalid customer email
```

---

## 📚 Full Documentation

For detailed setup, configuration, and troubleshooting:
- [Full Setup Guide](./STRIPE-WEBHOOK-SETUP.md)
- [Stripe Integration Plan](./stripe-backend-integration-plan.md)

---

## 🧪 Test Cards

Use these Stripe test cards:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Declined payment |
| `4000 0025 0000 3155` | Requires authentication |

Use any future expiry date and any 3-digit CVC.

---

## 📊 Monitoring

### View Recent Webhook Events
```bash
supabase functions logs stripe-webhook --limit 50
```

### Check Stripe Dashboard
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your endpoint
3. View **Recent deliveries**

### Check Database
```sql
-- View recent orders
SELECT 
  order_number,
  customer_email,
  total_gbp,
  stripe_checkout_session_id,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎉 You're Done!

Your Stripe webhooks are now set up and ready to process payments!

**Next steps:**
1. Test a complete checkout flow in your app
2. Verify orders are created correctly
3. Check inventory updates
4. Set up production webhook endpoint
5. Monitor webhook deliveries

