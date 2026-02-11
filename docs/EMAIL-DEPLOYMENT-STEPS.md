# Email System Deployment Steps

## Changes Made

### 1. Added Admin Notification Email Template
- Created `supabase/functions/send-email/templates/new-order-admin.ts`
- Sends email to admin when any order is placed
- Includes order details, customer info, and action items

### 2. Updated send-email Function
- Added `new-order-admin` template to the template registry
- File: `supabase/functions/send-email/index.ts`

### 3. Updated Stripe Webhook
- Added admin notification email sending (after customer emails)
- Improved error logging for customer email sending
- Better visibility into email function responses
- File: `supabase/functions/stripe-webhook/index.ts`

## Deployment Commands

Run these commands to deploy the updated functions:

```bash
# Deploy the send-email function (with new admin template)
supabase functions deploy send-email

# Deploy the stripe-webhook function (with admin email sending)
supabase functions deploy stripe-webhook
```

## Testing

After deployment, test with a real order:

1. Place a test order through your checkout flow
2. Check the Supabase function logs:
   - Go to Supabase Dashboard > Edge Functions > stripe-webhook > Logs
   - Look for email sending messages
3. Check your email inbox (customer email)
4. Check alexishindle@gmail.com (admin email)
5. Check the `email_logs` table in your database

## Troubleshooting

### If customer emails aren't sending:

1. **Check Supabase function logs** for the webhook execution
2. **Verify RESEND_API_KEY** is set in Supabase secrets:
   ```bash
   supabase secrets list
   ```
3. **Check email_logs table** for any error messages:
   ```sql
   SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
   ```
4. **Look for error messages** in the webhook logs like:
   - "Email function returned error"
   - "Error sending order confirmation email"

### If admin emails aren't sending:

1. Check the webhook logs for "Sending admin notification email"
2. Verify the admin email address is correct in the webhook code
3. Check if the `new-order-admin` template is properly registered

## What Happens Now

When a customer places an order:

1. ✅ Stripe webhook receives `checkout.session.completed` event
2. ✅ Order is created in database
3. ✅ **Customer receives order confirmation email** (if order has products)
4. ✅ **Customer receives event booking confirmation** (if order has events)
5. ✅ **Admin receives new order notification email**
6. ✅ All emails are logged in `email_logs` table

## Admin Email Details

The admin notification includes:
- Order number and total
- Customer name and email
- List of all items ordered
- Shipping address (if applicable)
- Action items (fulfill products, event bookings confirmed)
- Link to admin panel

## Next Steps

After deployment and testing:
1. Consider setting up a dedicated admin email (e.g., orders@lolaasone.com)
2. Set up email forwarding or team inbox
3. Monitor email delivery rates in Resend dashboard
4. Set up custom domain in Resend for better deliverability

