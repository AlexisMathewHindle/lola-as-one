# Stripe Webhook Handler

This Edge Function handles Stripe webhook events for payment processing.

## What It Does

When a customer completes a payment, this webhook:

1. ✅ **Verifies** the webhook signature for security
2. ✅ **Creates/updates** customer records
3. ✅ **Creates** orders with unique order numbers
4. ✅ **Creates** order items for each product/event
5. ✅ **Decrements** inventory for physical products
6. ✅ **Decrements** event capacity for workshops
7. ✅ **Creates** booking records for events
8. ✅ **Sends** order confirmation emails
9. ✅ **Sends** event booking confirmation emails

## Events Handled

- `checkout.session.completed` - Payment successful, creates order
- `checkout.session.expired` - Session expired (logged only)
- Subscription events are currently skipped (handled separately)

## Environment Variables Required

```bash
STRIPE_SECRET_KEY=sk_test_...           # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook signing secret
SUPABASE_URL=https://...supabase.co     # Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...           # Service role key for database access
```

## Setup

### 1. Set Environment Variables

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Deploy the Function

```bash
supabase functions deploy stripe-webhook
```

Or use the deployment script:
```bash
./scripts/deploy-stripe-webhook.sh
```

### 3. Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter URL: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Copy the **Signing secret** and update your environment variable

## Testing

### Local Testing

```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Forward Stripe events
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Terminal 3: Trigger test event
stripe trigger checkout.session.completed
```

Or use the test script:
```bash
./scripts/test-stripe-webhook.sh
```

### View Logs

```bash
# View recent logs
supabase functions logs stripe-webhook

# Follow logs in real-time
supabase functions logs stripe-webhook --follow
```

## Expected Metadata

The webhook expects the following metadata from the checkout session:

```javascript
{
  customer_email: "customer@example.com",
  customer_first_name: "John",
  customer_last_name: "Doe",
  customer_phone: "+44 20 1234 5678",
  shipping_name: "John Doe",
  shipping_line1: "123 Main St",
  shipping_line2: "Apt 4",
  shipping_city: "London",
  shipping_postal_code: "SW1A 1AA",
  shipping_country: "GB",
  items: JSON.stringify([...]),  // Array of cart items
  subtotal: "90.00",
  shipping_cost: "5.00",
  vat: "19.00",
  total: "114.00"
}
```

## Item Format

Each item in the `items` array should have:

```javascript
{
  id: "uuid",              // Offering ID
  title: "Product Name",
  type: "product_physical" | "product_digital" | "event",
  price: 45.00,
  quantity: 2,
  eventDate: "2026-03-15", // For events only
  eventTime: "14:00:00"    // For events only
}
```

## Database Operations

### Tables Modified

**One-Time Orders:**
- `customers` - Creates new customer if doesn't exist
- `orders` - Creates new order with generated order number
- `order_items` - Creates items for each product/event
- `bookings` - Creates booking records for events
- `inventory_items` - Decrements stock via RPC function
- `offering_events` - Decrements capacity via RPC function

**Subscriptions:**
- `customers` - Creates new customer if doesn't exist
- `subscriptions` - Creates/updates subscription records
- `plans` - Reads plan configuration (cutoff_day)
- `addresses` - Reads customer's default shipping address
- `orders` - Creates subscription renewal orders with cycle_key
- `stripe_events` - Logs processed events for idempotency

### RPC Functions Used

- `decrement_inventory(p_offering_id, p_quantity)` - Decrements product stock
- `decrement_event_capacity(p_offering_event_id, p_attendees)` - Decrements event capacity

## Event Handlers

### One-Time Checkout Events

- `checkout.session.completed` - Creates order, order items, bookings, decrements inventory
- `checkout.session.expired` - Logs expired session (optional cleanup)

### Subscription Events

- `customer.subscription.created` - Creates subscription record in database
- `customer.subscription.updated` - Updates subscription status and dates
- `customer.subscription.deleted` - Marks subscription as canceled
- `invoice.payment_succeeded` - **Creates subscription order with cycle_key**
- `invoice.payment_failed` - Marks subscription as past_due

### Idempotency

All events are checked against the `stripe_events` table to prevent duplicate processing when Stripe retries webhooks.

## Error Handling

- Webhook signature verification failures return 400
- Database errors are logged and thrown (Stripe will retry)
- Email failures are logged but don't fail the webhook
- Duplicate events are detected and return 200 (cached)

## Monitoring

### Check Webhook Status in Stripe

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your endpoint
3. View **Recent deliveries**
4. Check response status and retry attempts

### Check Database

```sql
-- View recent orders (all types)
SELECT
  order_number,
  order_type,
  cycle_key,
  customer_email,
  total_gbp,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- View subscription orders only
SELECT
  order_number,
  cycle_key,
  customer_email,
  total_gbp,
  status,
  created_at
FROM orders
WHERE order_type = 'subscription_renewal'
ORDER BY created_at DESC
LIMIT 10;

-- View processed webhook events
SELECT
  id,
  type,
  created_at
FROM stripe_events
ORDER BY created_at DESC
LIMIT 20;

-- View order items
SELECT
  o.order_number,
  oi.title,
  oi.quantity,
  oi.total_price_gbp
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
ORDER BY o.created_at DESC
LIMIT 20;
```

## Troubleshooting

See [STRIPE-WEBHOOK-SETUP.md](../../../docs/STRIPE-WEBHOOK-SETUP.md) for detailed troubleshooting.

## Related Documentation

- [Quick Start Guide](../../../docs/STRIPE-WEBHOOK-QUICK-START.md)
- [Full Setup Guide](../../../docs/STRIPE-WEBHOOK-SETUP.md)
- [Stripe Integration Plan](../../../docs/stripe-backend-integration-plan.md)

