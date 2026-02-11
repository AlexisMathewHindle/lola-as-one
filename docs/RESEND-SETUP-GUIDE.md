# Resend Email Service Setup Guide

This guide will walk you through setting up Resend for the Lola As One email notification system.

## Step 1: Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Your API Key

1. Log in to your Resend dashboard
2. Go to **API Keys** in the sidebar
3. Click **Create API Key**
4. Give it a name (e.g., "Lola As One Production")
5. Select **Full Access** permissions
6. Copy the API key (it starts with `re_`)
7. **Important:** Save this key securely - you won't be able to see it again!

## Step 3: Configure Supabase Environment Variables

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** > **Edge Functions**
3. Scroll to **Secrets**
4. Add a new secret:
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key (e.g., `re_xxxxxxxxxxxxx`)
5. Click **Save**

### Option B: Using Supabase CLI

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Step 4: Set Up Your Domain (Optional but Recommended)

By default, Resend sends emails from `onboarding@resend.dev`. To send from your own domain (e.g., `hello@lolaasone.com`):

### 4.1 Add Your Domain

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `lolaasone.com`)
4. Click **Add**

### 4.2 Configure DNS Records

Resend will provide you with DNS records to add to your domain. You'll need to add:

1. **SPF Record** (TXT)
2. **DKIM Record** (TXT)
3. **DMARC Record** (TXT) - Optional but recommended

Example DNS records:
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@lolaasone.com
```

### 4.3 Add DNS Records to Your Domain Provider

1. Log in to your domain provider (e.g., Namecheap, GoDaddy, Cloudflare)
2. Go to DNS settings
3. Add each DNS record provided by Resend
4. Save changes

### 4.4 Verify Your Domain

1. Back in Resend dashboard, click **Verify** next to your domain
2. Wait for DNS propagation (can take up to 48 hours, usually much faster)
3. Once verified, you'll see a green checkmark

### 4.5 Update the Email Function

Once your domain is verified, update the `from` field in `supabase/functions/send-email/index.ts`:

```typescript
from: 'Lola As One <hello@lolaasone.com>',
```

## Step 5: Deploy the Email Function

```bash
# Deploy the send-email function
supabase functions deploy send-email

# Verify it's deployed
supabase functions list
```

## Step 6: Run Database Migration

Apply the email_logs table migration:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard > SQL Editor
# Copy and paste the contents of supabase/migrations/20260206_email_logs.sql
```

## Step 7: Test the Email System

### Test Locally

```bash
# Start local Supabase
supabase start

# Serve the function locally
supabase functions serve send-email

# Send a test email
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "template": "order-confirmation",
    "to": "alexishindle@gmail.com",
    "data": {
      "orderNumber": "TEST-001",
      "customerName": "Test User",
      "orderItems": [{"name": "Test Product", "quantity": 1, "price": 25.00}],
      "subtotal": 25.00,
      "shipping": 5.00,
      "vat": 6.00,
      "total": 36.00,
      "paymentMethod": "Test Card"
    }
  }'
```

### Test in Production

Use the Supabase dashboard or your application to trigger an email.

## Step 8: Monitor Email Delivery

### In Resend Dashboard

1. Go to **Emails** in the sidebar
2. View all sent emails, their status, and delivery information
3. Click on any email to see details, including:
   - Delivery status
   - Opens and clicks
   - Bounce/complaint information

### In Your Database

Query the `email_logs` table:

```sql
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
```

## Pricing

Resend offers:
- **Free Tier:** 3,000 emails/month, 100 emails/day
- **Paid Plans:** Starting at $20/month for 50,000 emails

For most small businesses, the free tier is sufficient to start.

## Troubleshooting

### Emails Not Sending

1. Check that `RESEND_API_KEY` is set correctly in Supabase
2. Check the `email_logs` table for error messages
3. Verify your Resend API key is valid and has the correct permissions
4. Check Resend dashboard for any account issues

### Emails Going to Spam

1. Set up your custom domain with proper DNS records
2. Add DMARC record
3. Warm up your domain by sending gradually increasing volumes
4. Ensure your email content isn't triggering spam filters

### Domain Not Verifying

1. Wait up to 48 hours for DNS propagation
2. Use a DNS checker tool to verify records are set correctly
3. Ensure there are no conflicting DNS records
4. Contact Resend support if issues persist

## Next Steps

1. ✅ Set up Resend account and get API key
2. ✅ Configure Supabase environment variables
3. ✅ Deploy email function
4. ✅ Run database migration
5. ✅ Test email sending
6. 🔄 Set up custom domain (optional)
7. 🔄 Implement remaining email templates
8. 🔄 Set up email triggers (webhooks, scheduled jobs)

## Support

- **Resend Documentation:** https://resend.com/docs
- **Resend Support:** support@resend.com
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

