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
```

Or use the Supabase CLI:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
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

### Critical Templates (Implemented)
1. `order-confirmation` - Order confirmation for one-time purchases
2. `event-booking-confirmation` - Event/workshop booking confirmation
3. `subscription-activated` - New subscription activated
4. `subscription-renewal-success` - Subscription payment successful
5. `subscription-payment-failed` - Subscription payment failed
6. `password-reset` - Password reset request
7. `contact-form-customer` - Contact form submission (customer copy)
8. `contact-form-admin` - Contact form submission (admin notification)
9. `digital-download-ready` - Digital product download ready
10. `order-shipped` - Order shipped notification
11. `event-reminder-7-days` - Event reminder 7 days before
12. `event-reminder-24-hours` - Event reminder 24 hours before
13. `waitlist-event-available` - Event waitlist spot available
14. `waitlist-product-available` - Product back in stock

### Templates To Be Implemented
See `docs/email-notification-system.md` for the complete list of 50+ templates.

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

To send emails from your custom domain (e.g., hello@lolaasone.com):

1. Go to Resend Dashboard > Domains
2. Add your domain
3. Add the DNS records to your domain provider
4. Verify the domain
5. Update the `from` field in `index.ts` to use your domain

## Error Handling

The function returns:
- `200` - Email sent successfully
- `400` - Invalid request or email sending failed

Check the `email_logs` table for detailed error messages.

