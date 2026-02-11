# Checkout Setup Guide

This guide explains how to set up the checkout functionality for local development.

## The Problem

You encountered the error: **"Failed to process checkout. Please try again."**

This happened because:
1. ✅ Your Vue app connects to the **remote Supabase instance** (where your data is)
2. ❌ The Edge Functions were only running **locally** (not deployed to remote)
3. ❌ When the app tried to call `create-checkout-session`, it failed because the function doesn't exist on the remote instance

## The Solution

You have two options for local development:

### Option A: Use Remote Supabase + Deploy Edge Functions (Recommended)

This is the **recommended approach** because:
- Your schema and data are already on the remote instance
- You don't need to maintain two separate databases
- It's closer to your production setup

**Steps:**

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   supabase link --project-ref hubbjhtjyubzczxengyo
   ```

4. **Set required secrets** in Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/hubbjhtjyubzczxengyo/settings/functions
   - Add these secrets:
     - `STRIPE_SECRET_KEY` = `sk_test_51SyCXJQ14lclFxHap3LJR8Yv9BWGwOj5O7HuyGVipRjQBTwc3anYRp4JpDzEhavTvQIRUKG9sqKA0DeGM6oUdB3k008xiZCvno`
     - `STRIPE_WEBHOOK_SECRET` = `whsec_a8e0b6e5603efb9ee2d1f9379626ce0b261967280c549b9a9d46b3af364b77e3`
     - `SUPABASE_URL` = `https://hubbjhtjyubzczxengyo.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY` = (get from Project Settings > API)
     - `APP_URL` = `http://localhost:5173`
     - `RESEND_API_KEY` = `re_5MmreNvU_E2nuqf5LSnJc7AnrFeNT7w6S`

5. **Deploy Edge Functions**:
   ```bash
   ./scripts/deploy-checkout-functions.sh
   ```

   Or manually:
   ```bash
   supabase functions deploy create-checkout-session --no-verify-jwt
   supabase functions deploy create-subscription-checkout-session --no-verify-jwt
   supabase functions deploy stripe-webhook --no-verify-jwt
   supabase functions deploy validate-subscription-boxes --no-verify-jwt
   ```

6. **Configure Stripe Webhook** (for production webhooks):
   - Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook`
   - Select events: `checkout.session.completed`, `checkout.session.expired`

7. **Test the checkout**:
   - Restart your Vue dev server
   - Add items to cart
   - Go to checkout
   - Fill out the form
   - Use test card: `4242 4242 4242 4242`

### Option B: Use Local Supabase (More Complex)

If you want to use local Supabase, you need to:

1. **Sync your remote schema to local**:
   ```bash
   supabase db pull
   ```

2. **Migrate your data** (optional, for testing):
   - Export data from remote
   - Import to local

3. **Update environment variables** to use local:
   ```env
   # app/.env.local
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   ```

4. **Edge Functions run automatically** when Supabase is running locally

## Current Configuration

Your app is currently configured to use:
- **Frontend**: Remote Supabase (`https://hubbjhtjyubzczxengyo.supabase.co`)
- **Edge Functions**: Need to be deployed to remote

## Environment Variables Reference

### Frontend (`app/.env.local`)
```env
VITE_SUPABASE_URL=https://hubbjhtjyubzczxengyo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=http://localhost:5173
```

### Edge Functions (Supabase Secrets)
Set these in Supabase Dashboard > Project Settings > Edge Functions > Secrets:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `RESEND_API_KEY`

## Troubleshooting

### "Invalid JWT" Error
- Make sure your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match
- If using remote, use remote keys
- If using local, use local keys

### "Edge Function returned a non-2xx status code"
- Check that functions are deployed: `supabase functions list`
- Check function logs: `supabase functions logs create-checkout-session`
- Verify secrets are set correctly

### "Could not find the table" Error
- Your local database doesn't have the schema
- Either use remote Supabase or sync schema with `supabase db pull`

## Next Steps

1. Follow **Option A** above to deploy Edge Functions
2. Restart your Vue dev server
3. Test the checkout flow
4. Check for any errors in the browser console or Supabase logs

