# Stripe Webhook Setup

The Stripe webhook is required to process payments and create orders in your database after a successful checkout.

## The Problem

When you complete a checkout:
1. ✅ Stripe processes the payment
2. ✅ User is redirected to the success page
3. ❌ **Order doesn't exist yet** because Stripe hasn't notified your webhook
4. ❌ Success page shows "Order Not Found"

## The Solution

You need to configure Stripe to send webhook events to your Edge Function.

---

# Stripe Webhook Setup Guide

This guide will help you set up Stripe webhooks for your Lola As One application.

## Overview

The webhook handler processes Stripe events to:
- Create orders when payments are completed
- Update inventory and event capacity
- Create customer records
- Generate bookings for events

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Stripe account (test mode is fine for development)
- Stripe CLI installed (for local testing)

---

## Step 1: Get Your Stripe Keys

### 1.1 Get Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers → API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode)

### 1.2 Get Webhook Signing Secret

You'll get this in two different ways depending on your environment:

#### For Local Development (using Stripe CLI):
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```
This will output a webhook signing secret starting with `whsec_`

#### For Production (Stripe Dashboard):
1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://[your-project-ref].supabase.co/functions/v1/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `customer.subscription.created` (if using subscriptions)
   - `customer.subscription.updated` (if using subscriptions)
   - `customer.subscription.deleted` (if using subscriptions)
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

---

## Step 2: Configure Environment Variables

### 2.1 Set Secrets in Supabase

You need to set these environment variables for your Edge Functions:

```bash
# Set Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here

# Set Stripe Webhook Secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Set Supabase URL (if not already set)
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co

# Set Supabase Service Role Key (if not already set)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Set App URL for redirect URLs
supabase secrets set APP_URL=https://your-app-domain.com
```

### 2.2 Verify Secrets

```bash
supabase secrets list
```

You should see:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`

---

## Step 3: Deploy the Webhook Function

### 3.1 Deploy Using the Script

```bash
./scripts/deploy-stripe-webhook.sh
```

### 3.2 Or Deploy Manually

```bash
supabase functions deploy stripe-webhook
```

### 3.3 Verify Deployment

```bash
supabase functions list
```

You should see `stripe-webhook` in the list.

---

## Step 4: Test the Webhook

### 4.1 Local Testing with Stripe CLI

1. Start your local Supabase instance:
```bash
supabase start
```

2. In another terminal, forward Stripe events:
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

3. Trigger a test event:
```bash
stripe trigger checkout.session.completed
```

4. Check the logs:
```bash
supabase functions logs stripe-webhook
```

### 4.2 Production Testing

1. Create a test checkout session using your app
2. Complete the payment using Stripe test card: `4242 4242 4242 4242`
3. Check webhook logs in Stripe Dashboard:
   - Go to **Developers → Webhooks**
   - Click on your endpoint
   - View recent deliveries

---

## Step 5: Monitor Webhooks

### 5.1 View Function Logs

```bash
# View recent logs
supabase functions logs stripe-webhook

# Follow logs in real-time
supabase functions logs stripe-webhook --follow
```

### 5.2 Check Stripe Dashboard

1. Go to **Developers → Webhooks**
2. Click on your endpoint
3. View **Recent deliveries** to see:
   - Event type
   - Response status
   - Response body
   - Retry attempts

---

## Troubleshooting

### Webhook Signature Verification Failed

**Problem:** `Webhook error: No signatures found matching the expected signature for payload`

**Solutions:**
1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
2. Make sure you're using the correct secret for your environment (local vs production)
3. Check that the webhook URL matches exactly

### Missing Environment Variables

**Problem:** `Missing signature or webhook secret`

**Solutions:**
1. Run `supabase secrets list` to verify secrets are set
2. Redeploy the function after setting secrets
3. Check that variable names match exactly

### Order Not Created

**Problem:** Webhook receives event but order isn't created

**Solutions:**
1. Check function logs: `supabase functions logs stripe-webhook`
2. Verify database permissions (RLS policies)
3. Check that metadata is being passed correctly from checkout session
4. Verify customer email is in metadata

### Events Not Received

**Problem:** Stripe shows webhook sent but function doesn't receive it

**Solutions:**
1. Verify webhook URL is correct
2. Check that function is deployed: `supabase functions list`
3. Verify Supabase project is not paused
4. Check Stripe webhook endpoint status

---

## Next Steps

After setting up webhooks:

1. ✅ Test with a complete checkout flow
2. ✅ Verify orders are created in database
3. ✅ Check inventory is decremented
4. ✅ Verify event capacity is updated
5. ✅ Test with different product types (physical, digital, events)
6. ✅ Set up monitoring and alerts

---

## Common Scenarios

### Scenario 1: First Time Setup (Development)

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login to Stripe: `stripe login`
3. Start local Supabase: `supabase start`
4. Forward webhooks: `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook`
5. Copy the webhook secret from the output
6. Set local env var: `export STRIPE_WEBHOOK_SECRET=whsec_...`
7. Test: `stripe trigger checkout.session.completed`

### Scenario 2: Moving to Production

1. Deploy function: `./scripts/deploy-stripe-webhook.sh`
2. Get function URL from Supabase Dashboard
3. Create webhook endpoint in Stripe Dashboard
4. Copy production webhook secret
5. Update secret: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
6. Test with real checkout flow using test card
7. Monitor in Stripe Dashboard

### Scenario 3: Webhook Secret Rotation

If you need to rotate your webhook secret:

1. Create new webhook endpoint in Stripe Dashboard
2. Update secret: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_new_secret`
3. Redeploy function: `supabase functions deploy stripe-webhook`
4. Test the new endpoint
5. Delete old webhook endpoint in Stripe Dashboard

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Test Cards](https://stripe.com/docs/testing)

