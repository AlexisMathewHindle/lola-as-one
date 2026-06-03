# Email Notification System

This Edge Function handles all email notifications for Lola As One using Resend.

## Setup

### 1. Install Resend

Sign up for Resend at https://resend.com and get your API key.

### 2. Configure Environment Variables

Set the following environment variables in your Supabase project:

```bash
# In Supabase Dashboard > Project Settings > Edge Functions
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM="Lola As One <bookings@lotsoflovelyart.com>"
EMAIL_REPLY_TO=hello@lotsoflovelyart.com
SUPPORT_EMAIL=hello@lotsoflovelyart.com
ADMIN_EMAILS=hello@lotsoflovelyart.com
```

Or use the Supabase CLI:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
supabase secrets set EMAIL_FROM="Lola As One <bookings@lotsoflovelyart.com>"
supabase secrets set EMAIL_REPLY_TO=hello@lotsoflovelyart.com
supabase secrets set SUPPORT_EMAIL=hello@lotsoflovelyart.com
supabase secrets set ADMIN_EMAILS=hello@lotsoflovelyart.com
```

### 3. Deploy the Function

```bash
supabase functions deploy send-email
```

## Usage

### Calling the Function

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    template: 'order-confirmation',
    to: 'customer@example.com',
    data: {
      orderNumber: 'ORD-12345',
      customerName: 'Jane Doe',
      orderItems: [
        { name: 'Product 1', quantity: 2, price: 25.00 }
      ],
      subtotal: 50.00,
      shipping: 5.00,
      vat: 11.00,
      total: 66.00,
      paymentMethod: 'Card ending in 4242'
    }
  }
})
```

## Available Templates

### Templates Implemented

**Orders & Purchases**
- `order-confirmation` - Order confirmation for one-time purchases
- `order-shipped` - Order shipped notification
- `order-delivered` - Order delivered notification
- `order-cancelled` - Order cancellation notification
- `refund-processed` - Refund confirmation

**Event Bookings**
- `event-booking-confirmation` - Event/workshop booking confirmation
- `event-reminder-7-days` - Event reminder 7 days before
- `event-reminder-24-hours` - Event reminder 24 hours before
- `event-feedback-request` - Event feedback request after a workshop
- `event-cancelled` - Event cancellation notification
- `booking-cancelled` - Customer booking cancellation confirmation

**Subscriptions**
- `subscription-activated` - New subscription activated
- `subscription-renewal-success` - Subscription payment successful
- `subscription-payment-failed` - Subscription payment failed
- `subscription-paused` - Subscription pause confirmation
- `subscription-resumed` - Subscription resume confirmation
- `subscription-cancelled` - Subscription cancellation confirmation
- `subscription-ending-soon` - Subscription ending soon reminder
- `subscription-box-shipped` - Subscription box shipped notification

**Waitlist**
- `waitlist-event-available` - Event waitlist spot available
- `waitlist-product-available` - Product back in stock
- `waitlist-spot-expired` - Waitlist offer expired

**Digital, Gift Cards & Account**
- `digital-download-ready` - Digital product download ready
- `download-link-expiring-soon` - Digital download expiry reminder
- `gift-card-purchased` - Gift card purchase confirmation
- `gift-card-received` - Gift card recipient email
- `password-reset` - Password reset request
- `password-changed` - Password changed confirmation
- `email-address-changed` - Email address changed confirmation
- `welcome-email` - New account welcome email

**Contact & Newsletter**
- `contact-form-customer` - Contact form submission customer copy
- `contact-form-admin` - Contact form submission admin notification
- `newsletter-subscription-confirmed` - Newsletter subscription confirmation
- `newsletter-unsubscribed` - Newsletter unsubscribe confirmation

**Admin Notifications**
- `new-order-admin` - Admin notification for a new order or event booking
- `low-stock-alert-admin` - Low stock admin alert
- `event-capacity-full-admin` - Full event admin alert
- `subscription-payment-failed-admin` - Subscription payment failure admin alert
- `new-waitlist-entry-admin` - New waitlist entry admin alert

**Reviews & Marketing**
- `product-review-request` - Product review request
- `abandoned-cart-reminder` - Abandoned cart reminder
- `new-workshop-announcement` - New workshop announcement
- `new-product-launch` - New product announcement
- `seasonal-promotion` - Seasonal promotion
- `birthday-anniversary-email` - Birthday or anniversary message

## Event Email Automation

The `send-event-emails` Edge Function is designed to be scheduled once per day. It finds confirmed bookings and sends:

- `event-reminder-7-days` when the event is 7 days away
- `event-reminder-24-hours` when the event is 1 day away
- `event-feedback-request` when the event was 1 day ago

It records `bookingId`, `eventId`, and `automation: event-lifecycle` in `email_logs.metadata` so repeated scheduler runs do not send duplicate emails for the same booking/template.

Recommended secrets:

```bash
SITE_URL=https://www.lotsoflovelyart.com
EVENT_FEEDBACK_URL=https://www.lotsoflovelyart.com/contact
EVENT_EMAIL_TIME_ZONE=Europe/London
EVENT_EMAIL_CRON_SECRET=your-strong-secret
ADMIN_EMAILS=hello@lotsoflovelyart.com
```

`EVENT_FEEDBACK_URL` is optional. If it is not set, feedback links fall back to `/contact` on `SITE_URL`.
`ADMIN_EMAILS` is a comma-separated list used by the Stripe webhook for `new-order-admin`.

## Template Data Structures

Each template expects specific data. See the TypeScript interfaces in each template file for required fields.

## Email Logs

All sent emails are logged in the `email_logs` table for tracking and debugging.

## Testing

Test emails locally using the Supabase local development environment:

```bash
supabase functions serve send-email
```

Then call the function:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"template":"order-confirmation","to":"test@example.com","data":{...}}'
```

## Resend Domain Setup

To send emails to real customer/admin recipients, Resend must be out of testing-only mode:

1. Go to Resend Dashboard > Domains
2. Add the approved sending domain, for example `lotsoflovelyart.com`
3. Add the DNS records to your domain provider
4. Verify the domain
5. Set `EMAIL_FROM` to an address on the verified domain, for example `Lola As One <bookings@lotsoflovelyart.com>`
6. Redeploy `send-email` after setting the production secrets

## Error Handling

The function returns:
- `200` - Email sent successfully
- `400` - Invalid request or email sending failed

Check the `email_logs` table for detailed error messages.
