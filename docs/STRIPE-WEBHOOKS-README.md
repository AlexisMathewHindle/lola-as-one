# Stripe Webhooks - Complete Setup Guide

This is your central hub for setting up and managing Stripe webhooks for Lola As One.

## 🎯 What You Need

Your Stripe webhook handler is **already implemented** at `supabase/functions/stripe-webhook/index.ts`. You just need to configure and deploy it!

## 🚀 Quick Start (5 Minutes)

Follow these steps to get webhooks working:

### 1. Get Your Stripe Keys
- **Secret Key**: [Stripe Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)
- **Webhook Secret**: You'll get this after creating the webhook endpoint (Step 3)

### 2. Set Environment Variables
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set APP_URL=https://your-app-domain.com
```

### 3. Deploy the Webhook Function
```bash
./scripts/deploy-stripe-webhook.sh
```

### 4. Configure Stripe Webhook Endpoint
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. URL: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
4. Events: Select `checkout.session.completed` and `checkout.session.expired`
5. Copy the **Signing secret** and update your environment variable

### 5. Test It
```bash
./scripts/test-stripe-webhook.sh
```

**Done!** 🎉

---

## 📚 Documentation

### For Different Needs:

| If you want to... | Read this |
|-------------------|-----------|
| **Get started quickly** | [Quick Start Guide](docs/STRIPE-WEBHOOK-QUICK-START.md) |
| **Detailed setup instructions** | [Full Setup Guide](docs/STRIPE-WEBHOOK-SETUP.md) |
| **Track your progress** | [Setup Checklist](docs/STRIPE-WEBHOOK-CHECKLIST.md) |
| **Understand the implementation** | [Webhook Function README](supabase/functions/stripe-webhook/README.md) |
| **See the overall plan** | [Stripe Integration Plan](docs/stripe-backend-integration-plan.md) |

---

## 🛠️ Available Scripts

### Deployment
```bash
./scripts/deploy-stripe-webhook.sh
```
Deploys the webhook function to Supabase with guided setup.

### Testing
```bash
./scripts/test-stripe-webhook.sh
```
Interactive menu for testing webhooks locally:
- Listen for webhook events
- Trigger test events
- View logs

---

## 🔍 What the Webhook Does

When a customer completes a payment, the webhook automatically:

1. ✅ Verifies the webhook signature (security)
2. ✅ Creates/updates customer record
3. ✅ Creates order with unique order number
4. ✅ Creates order items
5. ✅ Decrements inventory (for products)
6. ✅ Decrements event capacity (for workshops)
7. ✅ Creates booking records (for events)
8. ✅ Sends order confirmation email
9. ✅ Sends event booking confirmation emails

---

## 🧪 Testing

### Local Testing (Recommended First)
```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Forward Stripe events
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Terminal 3: Trigger test event
stripe trigger checkout.session.completed
```

### Production Testing
1. Create a test checkout session in your app
2. Use test card: `4242 4242 4242 4242`
3. Check Stripe Dashboard for webhook delivery
4. Verify order created in database

---

## 📊 Monitoring

### View Logs
```bash
# Recent logs
supabase functions logs stripe-webhook

# Follow in real-time
supabase functions logs stripe-webhook --follow
```

### Check Stripe Dashboard
[Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
- View recent deliveries
- Check response status
- See retry attempts

### Check Database
```sql
SELECT 
  order_number,
  customer_email,
  total_gbp,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Common Issues

### "Missing signature or webhook secret"
```bash
# Verify secrets are set
supabase secrets list

# Set if missing
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### "Webhook signature verification failed"
- Make sure you're using the correct webhook secret for your environment
- Local: Use secret from `stripe listen` command
- Production: Use secret from Stripe Dashboard webhook endpoint

### "Order not created"
```bash
# Check logs for errors
supabase functions logs stripe-webhook

# Common causes:
# - Missing metadata in checkout session
# - Database RLS policies blocking insert
# - Invalid customer email
```

---

## 📁 File Structure

```
lola-as-one/
├── supabase/functions/stripe-webhook/
│   ├── index.ts              # Webhook handler implementation
│   └── README.md             # Function documentation
├── scripts/
│   ├── deploy-stripe-webhook.sh    # Deployment script
│   └── test-stripe-webhook.sh      # Testing script
├── docs/
│   ├── STRIPE-WEBHOOK-QUICK-START.md   # 5-minute setup
│   ├── STRIPE-WEBHOOK-SETUP.md         # Detailed guide
│   ├── STRIPE-WEBHOOK-CHECKLIST.md     # Progress tracker
│   └── stripe-backend-integration-plan.md  # Overall plan
└── STRIPE-WEBHOOKS-README.md   # This file
```

---

## 🎓 Next Steps

After setting up webhooks:

1. ✅ Test complete checkout flow
2. ✅ Verify all database operations
3. ✅ Test with different product types
4. ✅ Set up monitoring alerts
5. ✅ Document for your team
6. ✅ Move to production

---

## 🆘 Need Help?

1. Check the [troubleshooting section](docs/STRIPE-WEBHOOK-SETUP.md#troubleshooting) in the setup guide
2. Review [Stripe's webhook documentation](https://stripe.com/docs/webhooks)
3. Check function logs: `supabase functions logs stripe-webhook`
4. Review Stripe Dashboard webhook deliveries

---

## ✅ Checklist

- [ ] Stripe account set up
- [ ] Environment variables configured
- [ ] Webhook function deployed
- [ ] Stripe webhook endpoint created
- [ ] Local testing completed
- [ ] Production testing completed
- [ ] Monitoring set up
- [ ] Team documentation updated

---

**Ready to get started?** → [Quick Start Guide](docs/STRIPE-WEBHOOK-QUICK-START.md)

