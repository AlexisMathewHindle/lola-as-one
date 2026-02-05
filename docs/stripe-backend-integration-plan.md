# Stripe Backend Integration Plan

**Created:** 2026-02-04
**Status:** Planning
**Goal:** Build Stripe checkout session, webhook handler, and order fetch endpoints using Supabase Edge Functions

---

## Overview

This document outlines the plan for implementing Stripe payment processing using Supabase Edge Functions. The integration will enable:
- Creating Stripe Checkout Sessions from the cart
- Processing payments via Stripe hosted checkout
- Creating orders in the database via webhooks
- Fetching order details for the success page

---

## Architecture

### Technology Stack
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Payment Processing:** Stripe Checkout (hosted payment page)
- **Database:** Supabase PostgreSQL
- **Frontend:** Vue 3 (already built)

### Edge Functions to Build
1. **`create-checkout-session`** - Creates Stripe Checkout Session
2. **`stripe-webhook`** - Handles Stripe webhook events
3. **`get-order-by-session`** - Fetches order details by session ID

---

## 1. Create Checkout Session Function

### Endpoint
`POST /functions/v1/create-checkout-session`

### Purpose
Create a Stripe Checkout Session from cart items and customer information.

### Request Body
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Watercolor Workshop",
      "type": "event",
      "price": 45.00,
      "quantity": 2,
      "eventDate": "2026-03-15",
      "eventTime": "14:00:00"
    }
  ],
  "customer": {
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+44 20 1234 5678"
  },
  "shipping": {
    "name": "John Doe",
    "address": {
      "line1": "123 Main Street",
      "line2": "",
      "city": "London",
      "postal_code": "SW1A 1AA",
      "country": "GB"
    }
  }
}
```

### Response
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### Logic
1. Validate request body
2. Calculate totals (subtotal, shipping, VAT, total)
3. Validate inventory/capacity (check stock and event capacity)
4. Create or retrieve Stripe customer
5. Create Stripe Checkout Session with:
   - Line items (from cart)
   - Customer email
   - Shipping address (if physical items)
   - Success URL: `/order/success?session_id={CHECKOUT_SESSION_ID}`
   - Cancel URL: `/checkout`
   - Metadata: customer info, shipping info
6. Return session ID and URL

---

## 2. Stripe Webhook Handler

### Endpoint
`POST /functions/v1/stripe-webhook`

### Purpose
Handle Stripe webhook events to create orders and update database.

### Events to Handle
- `checkout.session.completed` - Payment successful, create order
- `checkout.session.expired` - Session expired, release inventory holds
- `payment_intent.succeeded` - Payment confirmed (optional)
- `payment_intent.payment_failed` - Payment failed (optional)

### Logic for `checkout.session.completed`
1. Verify webhook signature
2. Extract session data
3. Create order in `orders` table:
   - Generate order number (ORD-YYYYMMDD-000001)
   - Store customer info
   - Store shipping info
   - Store Stripe session ID
   - Calculate totals
4. Create order items in `order_items` table
5. Decrement inventory for physical products
6. Decrement event capacity for workshops
7. Create bookings for events
8. (Optional) Send confirmation email
9. Return 200 OK to Stripe

---

## 3. Get Order by Session Function

### Endpoint
`GET /functions/v1/get-order-by-session?session_id=cs_test_...`

### Purpose
Fetch order details for the OrderSuccess.vue page.

### Response
```json
{
  "orderNumber": "ORD-20260204-000001",
  "customerEmail": "customer@example.com",
  "orderItems": [
    {
      "id": "uuid",
      "title": "Watercolor Workshop",
      "item_type": "event",
      "quantity": 2,
      "unit_price_gbp": 45.00,
      "total_price_gbp": 90.00,
      "event_date": "2026-03-15",
      "event_start_time": "14:00:00"
    }
  ],
  "subtotal": 90.00,
  "shipping": 0.00,
  "vat": 15.00,
  "total": 90.00,
  "shippingName": "John Doe",
  "shippingAddressLine1": "123 Main Street",
  "shippingAddressLine2": "",
  "shippingCity": "London",
  "shippingPostcode": "SW1A 1AA",
  "shippingCountry": "United Kingdom"
}
```

### Logic
1. Validate session_id parameter
2. Query `orders` table by `stripe_checkout_session_id`
3. Join with `order_items` table
4. Format and return order data
5. Handle not found error

---

## Implementation Steps

### Step 1: Setup Supabase Edge Functions
- [ ] Create `supabase` directory in project root
- [ ] Create `supabase/functions` directory
- [ ] Install Supabase CLI (if not installed)
- [ ] Configure environment variables

### Step 2: Build Create Checkout Session Function
- [ ] Create `supabase/functions/create-checkout-session/index.ts`
- [ ] Implement request validation
- [ ] Implement inventory/capacity validation
- [ ] Implement Stripe customer creation/retrieval
- [ ] Implement Stripe Checkout Session creation
- [ ] Test with Stripe test mode

### Step 3: Build Webhook Handler
- [ ] Create `supabase/functions/stripe-webhook/index.ts`
- [ ] Implement webhook signature verification
- [ ] Implement order creation logic
- [ ] Implement inventory decrement logic
- [ ] Implement event capacity decrement logic
- [ ] Test with Stripe CLI

### Step 4: Build Get Order Function
- [ ] Create `supabase/functions/get-order-by-session/index.ts`
- [ ] Implement order query logic
- [ ] Test with sample data

### Step 5: Frontend Integration
- [ ] Update Checkout.vue to call create-checkout-session
- [ ] Update OrderSuccess.vue to call get-order-by-session
- [ ] Test end-to-end flow

### Step 6: Documentation
- [ ] Update docs/epic-7-customer-frontend.md
- [ ] Update docs/TODO.md
- [ ] Update docs/README.md
- [ ] Mark Epic 7 as complete

---

## Environment Variables Required

### Supabase Edge Functions
```bash
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env.local)
```bash
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Testing Plan

### Unit Tests
- Test request validation
- Test total calculations
- Test inventory validation
- Test order creation logic

### Integration Tests
- Test create-checkout-session with Stripe test mode
- Test webhook handler with Stripe CLI
- Test get-order-by-session with sample data

### End-to-End Tests
1. Add items to cart
2. Navigate to checkout
3. Fill in customer info
4. Click "Proceed to Payment"
5. Complete payment on Stripe (test mode)
6. Verify redirect to success page
7. Verify order details displayed
8. Verify order created in database
9. Verify inventory decremented
10. Verify event capacity decremented

---

## Next Steps

1. Mark planning task as complete
2. Create supabase directory structure
3. Build create-checkout-session function
4. Build stripe-webhook function
5. Build get-order-by-session function
6. Integrate with frontend
7. Test end-to-end
8. Update documentation

---

## Subscription & Mixed Cart (Follow-up)

The plan above focuses on one-time payments. For curated subscription plans that share the same basket as normal products (see `docs/subscription-model.md`):

- Stripe Checkout will need to support **`mode: 'subscription'`** with:
  - A recurring line item for the chosen subscription plan (quantity = number of subscriptions)
  - Optional one-time line items for additional products in the basket
- The existing `create-checkout-session` / `stripe-webhook` functions can be extended or complemented by a dedicated subscription checkout function to:
  - Accept subscription configuration from the cart (plan, quantity, selected box IDs)
  - Encode this configuration into `checkout.session.metadata`
  - Create or update local `subscriptions`, `subscription_items`, and `orders` from webhook events.

Detailed subscription behavior, plan limits, and the `subscription_plan_boxes` table are documented in `docs/subscription-model.md`.

