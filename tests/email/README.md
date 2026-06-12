# Email Template Testing

This directory contains test scripts for all email templates in the Lots of Lovely Art email notification system.

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

### Production / Deployed Function Proof

Use this after `send-email` has been deployed to Supabase. It invokes the deployed Edge Function through Supabase and checks matching `email_logs` rows using a proof run ID.

Core launch proof, covering the checkout emails:

```bash
TEST_EMAIL=your-test-inbox@example.com EMAIL_TEST_SCOPE=core node scripts/proof-email-templates.mjs
```

Full registered-template proof:

```bash
TEST_EMAIL=your-test-inbox@example.com EMAIL_TEST_SCOPE=all node scripts/proof-email-templates.mjs
```

`EMAIL_TEST_SCOPE=all` sends 45 emails to the target inbox.

### Master Test Script

**Location:** `test-email-templates.sh` (in project root)

Tests the core checkout, event, contact, subscription, waitlist, and download templates in one go:

```bash
chmod +x test-email-templates.sh
./test-email-templates.sh
```

This will send test emails for the core flow templates:
1. Order Confirmation
2. Event Booking Confirmation
3. New Order Admin
4. Subscription Activated
5. Subscription Renewal Success
6. Subscription Payment Failed
7. Password Reset
8. Contact Form - Customer Confirmation
9. Contact Form - Admin Notification
10. Digital Download Ready
11. Order Shipped
12. Event Reminder - 7 Days
13. Event Reminder - 24 Hours
14. Event Feedback Request
15. Waitlist - Event Available
16. Waitlist - Product Available

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
- Event Booking Admin notification with booking details

```bash
chmod +x tests/email/test-event-reminders.sh
./tests/email/test-event-reminders.sh
```

Tests:
- Event Reminder - 7 Days
- Event Reminder - 24 Hours

```bash
chmod +x tests/email/test-event-feedback.sh
./tests/email/test-event-feedback.sh
```

Tests:
- Event Feedback Request

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
| `order-confirmation` | Sent after successful product-only order | orderNumber, orderItems, total |
| `event-booking-confirmation` | Sent after booking a workshop | eventName, eventDate, bookingReference |
| `event-booking-admin` | Sent to admins after a new workshop booking | orderNumber, customerEmail, orderItems |
| `new-order-admin` | Sent to admins after a product-only order | orderNumber, customerEmail, orderItems |
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
| `event-feedback-request` | Feedback request after a workshop | eventName, feedbackLink |
| `waitlist-event-available` | Spot available for waitlisted event | eventName, expiryTime |
| `waitlist-product-available` | Product back in stock | productName, productLink |

Additional registered templates:
`order-delivered`, `order-cancelled`, `refund-processed`, `event-cancelled`, `booking-cancelled`, `subscription-paused`, `subscription-resumed`, `subscription-cancelled`, `subscription-ending-soon`, `subscription-box-shipped`, `waitlist-spot-expired`, `download-link-expiring-soon`, `gift-card-purchased`, `gift-card-received`, `welcome-email`, `password-changed`, `email-address-changed`, `newsletter-subscription-confirmed`, `newsletter-unsubscribed`, `low-stock-alert-admin`, `event-capacity-full-admin`, `subscription-payment-failed-admin`, `new-waitlist-entry-admin`, `product-review-request`, `abandoned-cart-reminder`, `new-workshop-announcement`, `new-product-launch`, `seasonal-promotion`, `birthday-anniversary-email`.

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

### Domain Not Verified Or Testing-Only Error

If Resend returns a domain verification or testing-only error, verify the sending domain and set the production sender secrets:

```bash
supabase secrets set EMAIL_FROM="Lots of Lovely Art <hello@lotsoflovelyart.com>"
supabase secrets set WORKSHOP_CONFIRMATION_EMAIL_FROM="Lots of Lovely Art <hello@lotsoflovelyart.com>"
supabase secrets set EMAIL_REPLY_TO=hello@lotsoflovelyart.com
supabase secrets set SUPPORT_EMAIL=hello@lotsoflovelyart.com
```

### Invalid JWT Error

Make sure you're using the local service role key in the test scripts:
```bash
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
```

## Next Steps

1. ✅ Test all email templates locally
2. 🔄 Verify sending domain on Resend
3. 🔄 Deploy to production: `supabase functions deploy send-email`
4. 🔄 Set production secrets: `RESEND_API_KEY`, `EMAIL_FROM`, `WORKSHOP_CONFIRMATION_EMAIL_FROM`, `EMAIL_REPLY_TO`, `SUPPORT_EMAIL`, and `ADMIN_EMAILS`
5. 🔄 Integrate email triggers in application code
