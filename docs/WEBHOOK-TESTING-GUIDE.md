# Webhook Testing Guide

## ⚠️ Important: Why `stripe trigger` Doesn't Create Orders

When you run:
```bash
stripe trigger checkout.session.completed
```

**No orders are created** because the test event does NOT include the custom metadata your webhook needs.

### What Metadata is Required?

Your webhook expects these fields in `session.metadata`:

```javascript
{
  customer_email: "customer@example.com",
  customer_first_name: "John",
  customer_last_name: "Doe",
  customer_phone: "+44 20 1234 5678",
  items: '[{"id":"...","title":"...","type":"event","price":45.00,"quantity":2}]',
  subtotal: "90.00",
  shipping_cost: "0.00",
  vat: "15.00",
  total: "90.00",
  shipping_name: "John Doe",
  shipping_line1: "123 Main St",
  shipping_city: "London",
  shipping_postal_code: "SW1A 1AA",
  shipping_country: "GB"
}
```

### Why `stripe trigger` Fails

The `stripe trigger` command creates a **minimal** test event with Stripe's default fields only. It does NOT include your custom metadata, so:

1. ✅ Webhook receives the event
2. ✅ Signature verification passes
3. ❌ No `customer_email` in metadata → Cannot create customer
4. ❌ No `items` in metadata → Cannot create order
5. ❌ Webhook exits early (see new logging)

---

## ✅ How to Properly Test the Webhook

### Option 1: Use Your Frontend (Recommended)

This is the **only** way to test the complete flow:

1. Start your Vue app:
   ```bash
   cd app
   npm run dev
   ```

2. Add items to cart

3. Go through checkout

4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC

5. Complete payment

6. Check logs:
   ```bash
   docker logs supabase_edge_runtime_lola-as-one --tail 50 --follow
   ```

7. Verify order in database:
   ```sql
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
   ```

### Option 2: Create a Test Session with Metadata

Use the Stripe CLI to create a session with proper metadata:

```bash
stripe checkout sessions create \
  --mode=payment \
  --line-items='[{"price_data": {"currency": "gbp", "product_data": {"name": "Test Workshop"}, "unit_amount": 4500}, "quantity": 2}]' \
  --success-url='http://localhost:5173/order/success?session_id={CHECKOUT_SESSION_ID}' \
  --cancel-url='http://localhost:5173/checkout' \
  --metadata[customer_email]='test@example.com' \
  --metadata[customer_first_name]='John' \
  --metadata[customer_last_name]='Doe' \
  --metadata[items]='[{"id":"test-123","title":"Test Workshop","type":"event","price":45.00,"quantity":2}]' \
  --metadata[subtotal]='90.00' \
  --metadata[shipping_cost]='0.00' \
  --metadata[vat]='15.00' \
  --metadata[total]='90.00'
```

Then complete the payment using the returned URL.

### Option 3: Check Webhook is Receiving Events

To verify the webhook is working (even if not creating orders):

1. Watch logs:
   ```bash
   docker logs supabase_edge_runtime_lola-as-one --tail 50 --follow
   ```

2. In another terminal, trigger event:
   ```bash
   stripe trigger checkout.session.completed
   ```

3. Look for these log messages:
   ```
   🔔 Webhook request received
   ✅ Received Stripe event: checkout.session.completed
   📦 Processing checkout.session.completed
   ❌ No customer_email in metadata - cannot create order
   This is expected when using `stripe trigger`
   ```

If you see these messages, **your webhook is working correctly!** It's just that `stripe trigger` doesn't provide the data needed to create orders.

---

## 🔍 Debugging Checklist

### Webhook Not Receiving Events

- [ ] Supabase is running: `docker ps | grep supabase`
- [ ] Stripe CLI is forwarding: `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook`
- [ ] Webhook secret is set in `.env`: Check `supabase/functions/.env`

### Webhook Receiving Events But No Orders

- [ ] Check logs for "No customer_email in metadata"
- [ ] Verify you're testing with frontend, not `stripe trigger`
- [ ] Check that checkout session includes metadata
- [ ] Verify database tables exist and RLS policies allow inserts

### Database Errors

- [ ] Check `customers` table exists
- [ ] Check `orders` table exists
- [ ] Check `order_items` table exists
- [ ] Verify RLS policies allow service role to insert
- [ ] Check for foreign key constraints

---

## 📊 Monitoring

### View Webhook Logs

```bash
# Docker logs (most reliable)
docker logs supabase_edge_runtime_lola-as-one --tail 100 --follow

# Filter for errors
docker logs supabase_edge_runtime_lola-as-one 2>&1 | grep -i error

# Filter for webhook events
docker logs supabase_edge_runtime_lola-as-one 2>&1 | grep "Received Stripe event"
```

### Check Database

```sql
-- Recent orders
SELECT 
  order_number,
  customer_email,
  total_gbp,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Recent customers
SELECT 
  email,
  first_name,
  last_name,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 10;

-- Recent order items
SELECT 
  o.order_number,
  oi.title,
  oi.quantity,
  oi.total_price_gbp
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
ORDER BY oi.created_at DESC
LIMIT 20;
```

---

## ✅ Success Indicators

Your webhook is working correctly when you see:

1. ✅ "Webhook request received" in logs
2. ✅ "Received Stripe event: checkout.session.completed"
3. ✅ "Created order: ORD-20260207-000001"
4. ✅ "Order processing complete"
5. ✅ New row in `orders` table
6. ✅ New rows in `order_items` table
7. ✅ Customer created/updated in `customers` table

---

## 🎯 Next Steps

1. Test with your frontend checkout flow
2. Verify orders are created correctly
3. Check inventory is decremented
4. Verify event capacity is updated
5. Test email notifications
6. Move to production webhook endpoint

