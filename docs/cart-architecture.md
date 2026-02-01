# Shopping Cart Architecture

**Last Updated:** 2026-01-31

## Purpose
Define how the custom shopping cart works for mixed-item orders (boxes + events).

---

## Requirements

### Must Support
- ✅ Add products (boxes) to cart with quantity
- ✅ Add events to cart (quantity always = 1 per booking)
- ✅ Mix products and events in same cart
- ✅ Update quantities
- ✅ Remove items
- ✅ Persist cart across page refreshes (session-based)
- ✅ Calculate totals (items + shipping + VAT)
- ✅ Validate inventory before checkout

### Not Required in v1
- ❌ Save cart for logged-in users (no accounts in v1)
- ❌ Cart abandonment tracking
- ❌ "Save for later" functionality
- ❌ Cart sharing / gift registry

---

## Cart Storage: Session-Based

### Option A: Browser localStorage (Recommended for v1)
**How it works:**
- Cart stored as JSON in browser's localStorage
- Persists across page refreshes
- Cleared when user completes checkout or manually clears cart
- No server-side storage needed

**Pros:**
- ✅ Simple implementation
- ✅ No database required
- ✅ Works without user accounts
- ✅ Fast (no server round-trips)

**Cons:**
- ⚠️ Cart lost if user switches devices
- ⚠️ Cart lost if user clears browser data
- ⚠️ No cart recovery if user abandons

**Data Structure:**
```json
{
  "cart_id": "uuid-v4",
  "items": [
    {
      "type": "product",
      "id": "prod_123",
      "name": "Wellness Box",
      "slug": "wellness-box",
      "price": 25.00,
      "quantity": 2,
      "image_url": "/images/wellness-box.jpg"
    },
    {
      "type": "event",
      "id": "evt_456",
      "name": "Yoga Workshop",
      "slug": "yoga-workshop-feb-2026",
      "date": "2026-02-15T10:00:00Z",
      "price": 40.00,
      "quantity": 1,
      "image_url": "/images/yoga-workshop.jpg"
    }
  ],
  "created_at": "2026-01-31T14:30:00Z",
  "updated_at": "2026-01-31T14:35:00Z"
}
```

### Option B: Server-Side Session (Alternative)
**How it works:**
- Cart stored in database or Redis
- Session ID stored in cookie
- Cart persists server-side

**Pros:**
- ✅ Cart survives browser data clearing
- ✅ Can track abandoned carts
- ✅ Can recover carts across devices (if we add accounts later)

**Cons:**
- ⚠️ Requires database/Redis
- ⚠️ More complex implementation
- ⚠️ Slower (server round-trips)

**v1 Recommendation:** Use localStorage. Switch to server-side in v2 if needed.

---

## Cart Operations

### Add to Cart
**Frontend:**
1. User clicks "Add to Cart" on product/event page
2. Validate: Check if item already in cart
3. If product: Increment quantity or add new line item
4. If event: Check if already booked (prevent duplicates)
5. Update localStorage
6. Show confirmation (toast notification or cart icon badge)

**Backend (optional validation):**
- API endpoint: `POST /api/cart/validate`
- Check current inventory/capacity
- Return error if out of stock/sold out

### Update Quantity
**Frontend:**
1. User changes quantity in cart UI
2. Update localStorage
3. Recalculate totals

**Validation:**
- Minimum quantity: 1
- Maximum quantity: Current stock (check before checkout)

### Remove Item
**Frontend:**
1. User clicks "Remove" on cart item
2. Remove from localStorage
3. Recalculate totals

### Clear Cart
**Frontend:**
1. User completes checkout (success page)
2. Clear localStorage
3. Show order confirmation

---

## Checkout Flow

### Step 1: Review Cart
**Frontend:**
- Display all cart items
- Show subtotal, shipping, VAT, total
- "Proceed to Checkout" button

### Step 2: Validate Inventory
**Backend API:** `POST /api/checkout/validate`

**Request:**
```json
{
  "items": [
    {"type": "product", "id": "prod_123", "quantity": 2},
    {"type": "event", "id": "evt_456", "quantity": 1}
  ]
}
```

**Response (success):**
```json
{
  "valid": true
}
```

**Response (failure):**
```json
{
  "valid": false,
  "errors": [
    {
      "item_id": "prod_123",
      "message": "Only 1 in stock (requested 2)"
    }
  ]
}
```

**Frontend handling:**
- If valid: Proceed to Step 3
- If invalid: Show error, update cart quantities, prevent checkout

### Step 3: Create Stripe Checkout Session
**Backend API:** `POST /api/checkout/create-session`

**Request:**
```json
{
  "items": [
    {"type": "product", "id": "prod_123", "quantity": 2},
    {"type": "event", "id": "evt_456", "quantity": 1}
  ],
  "customer_email": "jane@example.com" // optional pre-fill
}
```

**Backend logic:**
1. Re-validate inventory (race condition protection)
2. Calculate line items for Stripe:
   - Product: "Wellness Box x2" — £50.00
   - Event: "Yoga Workshop (Feb 15)" — £40.00
   - Shipping: "UK Standard" — £4.95
3. Create Stripe Checkout session
4. Return session URL

**Response:**
```json
{
  "session_url": "https://checkout.stripe.com/c/pay/cs_xxx"
}
```

**Frontend:**
- Redirect user to `session_url`

### Step 4: Stripe Checkout
- User enters payment info on Stripe's hosted page
- Stripe processes payment
- Stripe redirects to success URL: `https://yoursite.com/order/success?session_id=cs_xxx`

### Step 5: Webhook Processing
**Stripe webhook:** `checkout.session.completed`

**Backend logic:**
1. Verify webhook signature
2. Extract session data (line items, customer info, payment intent)
3. Create order record in database
4. Decrement inventory:
   - Product: `stock_count -= quantity`
   - Event: `current_bookings += 1`
5. Send confirmation email
6. Return 200 OK to Stripe

### Step 6: Success Page
**Frontend:**
- Display order confirmation
- Show order number, items, total
- Clear cart from localStorage
- Provide "Continue Shopping" link

---

## Pricing Calculation

### Cart Totals
```
Subtotal = Sum of (item.price × item.quantity)
Shipping = Flat rate (£4.95) if cart contains products, else £0
VAT = Included in prices (no separate calculation in v1)
Total = Subtotal + Shipping
```

### Example Calculation
**Cart:**
- 2x Wellness Box @ £25.00 = £50.00
- 1x Yoga Workshop @ £40.00 = £40.00

**Totals:**
- Subtotal: £90.00
- Shipping: £4.95 (cart contains physical products)
- Total: £94.95

**Note:** Events don't require shipping, but if cart has any physical products, shipping applies to entire order.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User adds item, stock runs out before checkout | Validation fails at checkout, show error |
| User adds event, event sells out before checkout | Validation fails at checkout, show error |
| User has cart open in 2 tabs, checks out in one | Second tab's checkout will fail validation |
| Payment succeeds but webhook fails | Manual reconciliation (admin checks Stripe Dashboard, creates order manually) |
| User abandons cart | Cart persists in localStorage until cleared or checkout completes |
| User clears browser data | Cart lost (acceptable in v1) |

---

## UI/UX Considerations

### Cart Icon Badge
- Show item count (total quantity of all items)
- Update in real-time when items added/removed

### Cart Page
- List all items with thumbnail, name, price, quantity
- Allow quantity updates (products only, events always qty=1)
- Show subtotal per line item
- Show totals breakdown
- "Continue Shopping" and "Checkout" buttons

### Empty Cart State
- Message: "Your cart is empty"
- Link to products/events pages

### Mobile Optimization
- Responsive cart UI
- Sticky "Checkout" button
- Swipe to remove items (optional)

---

## Summary

**v1 Cart Architecture:**
- localStorage-based (no server-side storage)
- Mixed products + events support
- Inventory validation before checkout
- Stripe Checkout for payment
- Webhook-driven order creation
- Auto-decrement inventory on success

**v2 Enhancements:**
- Server-side cart storage
- Cart abandonment tracking
- Save for later
- Cart sharing
- Inventory reservations during checkout

