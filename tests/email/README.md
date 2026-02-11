# Email Template Testing

This directory contains test scripts for all email templates in the Lola As One email notification system.

## Prerequisites

1. **Start Supabase locally:**
   ```bash
   supabase start
   ```

2. **Start the Edge Functions server:**
   ```bash
   supabase functions serve --env-file supabase/functions/.env
   ```

3. **Ensure environment variables are set:**
   - `RESEND_API_KEY` in `supabase/functions/.env`
   - Function server should be running on `http://127.0.0.1:54321`

## Test Scripts

### Master Test Script

**Location:** `test-email-templates.sh` (in project root)

Tests all 14 email templates in one go:

```bash
chmod +x test-email-templates.sh
./test-email-templates.sh
```

This will send test emails for:
1. Order Confirmation
2. Event Booking Confirmation
3. Subscription Activated
4. Subscription Renewal Success
5. Subscription Payment Failed
6. Password Reset
7. Contact Form - Customer Confirmation
8. Contact Form - Admin Notification
9. Digital Download Ready
10. Order Shipped
11. Event Reminder - 7 Days
12. Event Reminder - 24 Hours
13. Waitlist - Event Available
14. Waitlist - Product Available

### Individual Category Tests

#### Order-Related Emails
```bash
chmod +x tests/email/test-order-emails.sh
./tests/email/test-order-emails.sh
```

Tests:
- Order Confirmation
- Order Shipped
- Digital Download Ready

#### Event-Related Emails
```bash
chmod +x tests/email/test-event-booking.sh
./tests/email/test-event-booking.sh
```

Tests:
- Event Booking Confirmation

```bash
chmod +x tests/email/test-event-reminders.sh
./tests/email/test-event-reminders.sh
```

Tests:
- Event Reminder - 7 Days
- Event Reminder - 24 Hours

#### Subscription Emails
```bash
chmod +x tests/email/test-subscription.sh
./tests/email/test-subscription.sh
```

Tests:
- Subscription Activated
- Subscription Renewal Success
- Subscription Payment Failed

#### Waitlist Emails
```bash
chmod +x tests/email/test-waitlist.sh
./tests/email/test-waitlist.sh
```

Tests:
- Waitlist - Event Available
- Waitlist - Product Available

#### Contact & Password Emails
```bash
chmod +x tests/email/test-contact-password.sh
./tests/email/test-contact-password.sh
```

Tests:
- Password Reset
- Contact Form - Customer Confirmation
- Contact Form - Admin Notification

## Custom Email Address

All test scripts accept an optional email address parameter:

```bash
./test-email-templates.sh your-email@example.com
./tests/email/test-order-emails.sh your-email@example.com
```

Default email: `alexishindle@gmail.com`

## Viewing Test Results

### 1. Check Your Email Inbox
All test emails will be sent to the specified email address.

### 2. Resend Dashboard
View delivery status and email content:
- https://resend.com/emails

### 3. Email Logs Database
Query the `email_logs` table in your Supabase database:
```sql
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
```

### 4. Function Logs
Check the terminal where `supabase functions serve` is running for real-time logs.

## Email Templates Overview

| Template | Purpose | Key Data Fields |
|----------|---------|----------------|
| `order-confirmation` | Sent after successful order | orderNumber, orderItems, total |
| `event-booking-confirmation` | Sent after booking a workshop | eventName, eventDate, bookingReference |
| `subscription-activated` | Sent when subscription starts | subscriptionName, pricePerCycle |
| `subscription-renewal-success` | Sent after successful renewal | amountCharged, nextBillingDate |
| `subscription-payment-failed` | Sent when payment fails | failedAmount, updatePaymentLink |
| `password-reset` | Sent for password reset requests | resetLink, expiryMinutes |
| `contact-form-customer` | Confirmation to customer | subject, message, referenceNumber |
| `contact-form-admin` | Notification to admin | customerEmail, message |
| `digital-download-ready` | Sent when download is ready | downloadLinks, expiryDate |
| `order-shipped` | Sent when order ships | trackingNumber, trackingUrl |
| `event-reminder-7-days` | Reminder 7 days before event | eventName, eventDate |
| `event-reminder-24-hours` | Reminder 24 hours before event | eventName, eventTime |
| `waitlist-event-available` | Spot available for waitlisted event | eventName, expiryTime |
| `waitlist-product-available` | Product back in stock | productName, productLink |

## Troubleshooting

### Emails Not Sending

1. **Check function server is running:**
   ```bash
   curl http://127.0.0.1:54321/functions/v1/send-email
   ```

2. **Verify RESEND_API_KEY is set:**
   ```bash
   cat supabase/functions/.env | grep RESEND_API_KEY
   ```

3. **Check function logs** for error messages

### Domain Not Verified Error

If you see "domain is not verified" error, the function is using `hello@lolaasone.com`. 

The code has been updated to use `onboarding@resend.dev` for testing. Check:
```typescript
// supabase/functions/send-email/index.ts
from: 'Lola As One <onboarding@resend.dev>'
```

### Invalid JWT Error

Make sure you're using the local service role key in the test scripts:
```bash
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
```

## Next Steps

1. ✅ Test all email templates locally
2. 🔄 Verify domain on Resend (optional)
3. 🔄 Deploy to production: `supabase functions deploy send-email`
4. 🔄 Set production secrets: `supabase secrets set RESEND_API_KEY=your_key`
5. 🔄 Integrate email triggers in application code

