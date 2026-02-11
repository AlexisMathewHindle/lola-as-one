# Stripe Webhook Setup Checklist

Use this checklist to ensure your Stripe webhooks are properly configured.

## 📋 Pre-Deployment Checklist

### Stripe Account Setup
- [ ] Stripe account created
- [ ] Test mode enabled (for development)
- [ ] API keys accessible in dashboard

### Local Development Setup
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Stripe CLI installed ([installation guide](https://stripe.com/docs/stripe-cli))
- [ ] Logged in to Supabase CLI (`supabase login`)
- [ ] Logged in to Stripe CLI (`stripe login`)

### Environment Variables
- [ ] `STRIPE_SECRET_KEY` obtained from Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` ready (will get after webhook endpoint creation)
- [ ] `SUPABASE_URL` available
- [ ] `SUPABASE_SERVICE_ROLE_KEY` available
- [ ] `APP_URL` determined (your frontend URL)

---

## 🚀 Deployment Checklist

### 1. Set Supabase Secrets
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_URL=https://...supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set APP_URL=https://...
```

- [ ] All secrets set successfully
- [ ] Verified with `supabase secrets list`

### 2. Deploy Webhook Function
```bash
./scripts/deploy-stripe-webhook.sh
```

- [ ] Function deployed successfully
- [ ] No deployment errors
- [ ] Function appears in `supabase functions list`

### 3. Configure Stripe Webhook Endpoint

#### For Production:
- [ ] Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
- [ ] Click "Add endpoint"
- [ ] Enter webhook URL: `https://[project].supabase.co/functions/v1/stripe-webhook`
- [ ] Select events:
  - [ ] `checkout.session.completed`
  - [ ] `checkout.session.expired`
  - [ ] `customer.subscription.created` (if using subscriptions)
  - [ ] `customer.subscription.updated` (if using subscriptions)
  - [ ] `customer.subscription.deleted` (if using subscriptions)
- [ ] Save endpoint
- [ ] Copy webhook signing secret (whsec_...)
- [ ] Update `STRIPE_WEBHOOK_SECRET` if different from initial setup

#### For Local Development:
- [ ] Run `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook`
- [ ] Copy webhook signing secret from output
- [ ] Set as environment variable for local testing

---

## 🧪 Testing Checklist

### Local Testing
- [ ] Supabase running locally (`supabase start`)
- [ ] Stripe CLI forwarding events
- [ ] Test event triggered successfully
- [ ] Webhook received event (check logs)
- [ ] Order created in database
- [ ] Customer created/updated
- [ ] Inventory decremented (for products)
- [ ] Event capacity decremented (for events)
- [ ] Booking created (for events)
- [ ] Confirmation emails sent

### Production Testing
- [ ] Test checkout session created
- [ ] Payment completed with test card (4242 4242 4242 4242)
- [ ] Webhook event received in Stripe Dashboard
- [ ] Webhook response status 200
- [ ] Order created in production database
- [ ] All database operations completed successfully
- [ ] Emails sent to customer

---

## 📊 Verification Checklist

### Database Verification
```sql
-- Check recent orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- Check order items
SELECT * FROM order_items ORDER BY created_at DESC LIMIT 10;

-- Check customers
SELECT * FROM customers ORDER BY created_at DESC LIMIT 5;

-- Check bookings (for events)
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;
```

- [ ] Orders table populated correctly
- [ ] Order items linked to orders
- [ ] Customer records created
- [ ] Bookings created for events
- [ ] Inventory decremented
- [ ] Event capacity decremented

### Stripe Dashboard Verification
- [ ] Webhook endpoint shows "Enabled"
- [ ] Recent deliveries show successful responses (200)
- [ ] No failed deliveries or retries
- [ ] Event types match configuration

### Logs Verification
```bash
supabase functions logs stripe-webhook --limit 50
```

- [ ] No error messages in logs
- [ ] "Received Stripe event" messages present
- [ ] "Order processing complete" messages present
- [ ] Order numbers generated correctly
- [ ] Email confirmation messages present

---

## 🔒 Security Checklist

- [ ] Webhook signature verification enabled
- [ ] `STRIPE_WEBHOOK_SECRET` kept secure (not in code)
- [ ] Service role key not exposed to frontend
- [ ] HTTPS used for webhook endpoint (production)
- [ ] RLS policies enabled on database tables
- [ ] Function only accessible via POST requests

---

## 📈 Monitoring Checklist

### Set Up Monitoring
- [ ] Stripe webhook monitoring enabled in dashboard
- [ ] Email alerts configured for failed webhooks
- [ ] Log monitoring set up (if using external service)
- [ ] Database monitoring for order creation

### Regular Checks
- [ ] Weekly review of webhook delivery success rate
- [ ] Monthly review of failed webhooks
- [ ] Quarterly review of webhook performance
- [ ] Monitor for duplicate orders

---

## 🐛 Troubleshooting Checklist

If webhooks aren't working:

- [ ] Check function is deployed: `supabase functions list`
- [ ] Verify secrets are set: `supabase secrets list`
- [ ] Check webhook URL is correct in Stripe Dashboard
- [ ] Verify webhook signing secret matches
- [ ] Check function logs for errors
- [ ] Verify database RLS policies allow inserts
- [ ] Test with Stripe CLI locally first
- [ ] Check Stripe Dashboard for failed deliveries
- [ ] Verify metadata is being passed from checkout session

---

## ✅ Post-Setup Checklist

- [ ] Documentation updated with webhook URL
- [ ] Team notified of webhook setup
- [ ] Test cards documented for team
- [ ] Monitoring dashboard bookmarked
- [ ] Backup webhook endpoint configured (optional)
- [ ] Webhook secret stored in password manager
- [ ] Runbook created for common issues

---

## 📚 Reference Links

- [Stripe Webhook Quick Start](./STRIPE-WEBHOOK-QUICK-START.md)
- [Stripe Webhook Setup Guide](./STRIPE-WEBHOOK-SETUP.md)
- [Stripe Integration Plan](./stripe-backend-integration-plan.md)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 🎉 Completion

Once all items are checked:
- [ ] Webhooks fully operational
- [ ] All tests passing
- [ ] Monitoring in place
- [ ] Team trained
- [ ] Documentation complete

**Setup completed on:** _______________

**Completed by:** _______________

**Notes:**

