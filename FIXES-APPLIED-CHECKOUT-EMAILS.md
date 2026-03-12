# Checkout & Email Fixes Applied

## Issues Fixed

### 1. ✅ Checkout Error (Non-2xx Status Code)
**Problem:** Edge function was returning errors in production  
**Cause:** Function wasn't deployed with latest changes  
**Fix:** Redeployed `create-checkout-session` with improved error logging

### 2. ✅ Localhost Redirect After Payment
**Problem:** Users redirected to `localhost:5173` after Stripe payment  
**Cause:** `APP_URL` environment variable not set  
**Fix:** 
- Set `APP_URL=https://lola-workshops.netlify.app`
- Redeployed checkout functions
- Created order success page in legacy app

### 3. ✅ 401 Errors on Stripe Webhook
**Problem:** Webhook returning 401 Unauthorized  
**Cause:** Function deployed WITH JWT verification, but Stripe can't authenticate  
**Fix:** Redeployed `stripe-webhook` with `--no-verify-jwt` flag

### 4. ✅ No Confirmation Emails Sent
**Problem:** No emails received after successful checkout  
**Cause:** Webhook was getting 401 errors, so it never ran  
**Fix:** Fixed webhook authentication (see #3)

## Deployments Made

```bash
# 1. Checkout function with better error logging
supabase functions deploy create-checkout-session --no-verify-jwt --project-ref hubbjhtjyubzczxengyo

# 2. Subscription checkout function
supabase functions deploy create-subscription-checkout-session --no-verify-jwt --project-ref hubbjhtjyubzczxengyo

# 3. Stripe webhook (CRITICAL FIX - no JWT verification)
supabase functions deploy stripe-webhook --no-verify-jwt --project-ref hubbjhtjyubzczxengyo

# 4. Email function with better logging
supabase functions deploy send-email --no-verify-jwt --project-ref hubbjhtjyubzczxengyo
```

## Environment Variables Set

```bash
APP_URL=https://lola-workshops.netlify.app
```

## Files Created/Modified

### New Files:
- `lola-workshops/src/views/OrderSuccessView.vue` - Order success page
- `scripts/set-production-url.sh` - Helper script to change domain
- `scripts/test-email-sending.sh` - Email testing script
- `scripts/check-checkout-issues.mjs` - Database diagnostic script

### Modified Files:
- `supabase/functions/create-checkout-session/index.ts` - Better error logging
- `supabase/functions/send-email/index.ts` - Better logging
- `scripts/deploy-stripe-webhook.sh` - Added `--no-verify-jwt` flag
- `lola-workshops/src/router/index.ts` - Added `/order/success` route (needs deployment)

## Testing Checklist

- [x] Checkout function deployed
- [x] Webhook deployed with no JWT verification
- [x] Email function deployed
- [x] APP_URL set correctly
- [ ] **Order success page deployed to Netlify** (PENDING)
- [ ] Test full checkout flow
- [ ] Verify emails are received

## Next Steps

### 1. Deploy Order Success Page to Netlify

The order success page exists in code but needs to be deployed:

```bash
cd lola-workshops
git add src/views/OrderSuccessView.vue src/router/index.ts
git commit -m "Add order success page for Stripe checkout"
git push origin main
```

### 2. Test the Full Flow

1. Go to https://lola-workshops.netlify.app
2. Add a workshop to cart
3. Go through checkout
4. Complete payment with test card: `4242 4242 4242 4242`
5. Verify:
   - ✅ Redirected to `/order/success` (not localhost)
   - ✅ Order success page shows
   - ✅ Cart is cleared
   - ✅ Confirmation email received
   - ✅ Admin email received
   - ✅ Event booking email received

### 3. Check Logs if Issues Occur

**Webhook logs:**
https://supabase.com/dashboard/project/hubbjhtjyubzczxengyo/functions/stripe-webhook/logs

**Email logs:**
https://supabase.com/dashboard/project/hubbjhtjyubzczxengyo/functions/send-email/logs

**Resend dashboard:**
https://resend.com/emails

## Common Issues & Solutions

### Still getting 401 on webhook?
- Check Stripe webhook configuration
- Verify webhook URL: `https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook`
- No authentication headers should be sent by Stripe

### Emails not sending?
1. Check send-email function logs
2. Verify RESEND_API_KEY is set: `supabase secrets list --project-ref hubbjhtjyubzczxengyo`
3. Check Resend dashboard for delivery status
4. Consider setting up a verified domain (currently using `onboarding@resend.dev`)

### Still redirecting to localhost?
- Verify APP_URL is set: `supabase secrets list --project-ref hubbjhtjyubzczxengyo`
- Redeploy checkout functions after setting APP_URL

## When Changing Domain

When you get your custom domain (e.g., `www.lotsoflovelyart.com`):

```bash
# Update the URL
supabase secrets set APP_URL=https://www.lotsoflovelyart.com --project-ref hubbjhtjyubzczxengyo

# Redeploy checkout functions
supabase functions deploy create-checkout-session --no-verify-jwt --project-ref hubbjhtjyubzczxengyo
supabase functions deploy create-subscription-checkout-session --no-verify-jwt --project-ref hubbjhtjyubzczxengyo
```

Or use the helper script:
```bash
./scripts/set-production-url.sh
```

## Production Email Setup (Future)

Currently using Resend's test domain (`onboarding@resend.dev`). For production:

1. Add your domain in Resend dashboard
2. Add DNS records to verify domain
3. Update `from` address in `supabase/functions/send-email/index.ts`:
   ```typescript
   from: 'Lola Workshops <hello@lotsoflovelyart.com>',
   ```
4. Redeploy send-email function

