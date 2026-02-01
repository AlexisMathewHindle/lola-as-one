# Commerce Scope Guardrails: Don't Rebuild Shopify

**Last Updated:** 2026-01-31

## Purpose
Define the absolute minimum commerce functionality needed for v1 launch. **This is not an e-commerce platform — it's a simple CMS with payment capability.**

---

## The Golden Rule

> **If Shopify does it, we probably don't need it in v1.**

Focus: Sell boxes and book events. Nothing more.

---

## v1 Commerce Architecture

### Required Stack (UPDATED)
```
User → Frontend → Custom Cart → Stripe Checkout → Webhook → Backend → Order Created
                                                                    ↓
                                                            Inventory Updated
```

**Key Components:**
1. **Frontend:** Display products/events, cart UI
2. **Custom Cart:** Session-based cart holding mixed items (boxes + events)
3. **Stripe Checkout:** Hosted payment page with cart line items
4. **Webhook:** Stripe notifies backend when payment succeeds
5. **Backend:** Creates order, decrements inventory (boxes + event capacity)
6. **Admin:** Views orders, marks as fulfilled

**What we BUILD in v1:**
- ✅ Custom shopping cart (mixed products + events)
- ✅ Inventory management (auto-decrement on purchase)
- ✅ Event capacity tracking (auto-decrement on booking)
- ✅ Multi-item checkout

**What we DON'T build in v1:**
- ❌ Custom payment form UI (still use Stripe Checkout)
- ❌ Shipping label generation (manual fulfillment)
- ❌ Customer accounts with order history (nice-to-have for v2)

---

## Payment Flow: v1 (UPDATED)

### v1: Custom Cart + Stripe Checkout
**How it works:**
1. User browses products and events
2. User adds items to cart (boxes, events, or both)
3. Cart stored in session (cookie or localStorage)
4. User clicks "Checkout"
5. Backend creates Stripe Checkout session with all cart line items
6. User redirected to Stripe-hosted payment page
7. User enters payment info on Stripe's secure page
8. Stripe processes payment
9. Stripe redirects user back to success page
10. Stripe webhook notifies backend
11. Backend creates order record with all items
12. Backend decrements inventory (boxes) and event capacity
13. Confirmation email sent

**Why Custom Cart is Required:**
- ✅ Users can buy multiple boxes in one order
- ✅ Users can book multiple events in one order
- ✅ Users can mix boxes + events in one order
- ✅ Single payment for everything
- ✅ Single shipping charge (if applicable)

**What We Still Use Stripe For:**
- ✅ Payment processing (Stripe Checkout)
- ✅ PCI compliance
- ✅ Fraud detection
- ✅ Apple Pay, Google Pay

**What We Build:**
- ✅ Cart UI (add, remove, update quantity)
- ✅ Cart persistence (session-based)
- ✅ Cart → Stripe Checkout session conversion
- ✅ Inventory validation before checkout

### v2: Stripe Elements (Optional)
**Deferred to v2.** Only build this if:
- You need fully custom checkout UI embedded on your site
- You want more control over payment form styling

---

## Product Scope: v1 (UPDATED)

### What We Sell
| Product Type | v1 Status | Notes |
|--------------|-----------|-------|
| Physical products (Boxes) | ✅ Yes | One-time purchase |
| Subscriptions (Recurring Boxes) | ✅ Yes | **CRITICAL: Existing feature, must migrate** |
| Digital gift cards | ✅ Yes | Stripe supports this, adding to v1 |
| Digital downloads (PDFs, videos) | ✅ Yes | Requires file hosting (Supabase Storage) |
| Memberships | ❌ No | Different from subscriptions |
| Product bundles | ❌ No | "Buy 3 get 1 free" logic |
| Product variants (size, color) | ❌ No | Adds inventory complexity |

**v1 Decision:** Physical boxes (one-time + subscription) + digital products (gift cards, downloads).

**See:** [Subscription Model](./subscription-model.md) for detailed subscription architecture.

---

## Shipping: v1

### What We Support
- ✅ **UK domestic only**
- ✅ **Flat rate shipping** (e.g., £4.95 per order)
- ✅ **Free shipping threshold** (optional, e.g., free over £50)
- ❌ **NOT in v1:** Real-time carrier rates, international, weight-based

### Shipping Flow
1. User adds product to cart (or clicks "Buy Now")
2. Stripe Checkout shows product price + flat shipping rate
3. User pays
4. Admin receives order notification
5. Admin manually ships via preferred carrier (Royal Mail, etc.)
6. Admin marks order as "fulfilled" in CMS

**v2 Enhancements:**
- Shipping label generation (Shippo, EasyPost)
- Real-time carrier rates
- International shipping with customs forms
- Weight-based pricing

---

## Tax/VAT: v1

### Approach
- ✅ **Prices include VAT** (UK standard 20%)
- ✅ **Stripe Tax** (optional) — Auto-calculate and remit VAT
- ❌ **NOT in v1:** Tax exemptions, multi-region tax rules, VAT invoices

### Implementation Options

**Option A: VAT-inclusive pricing (simplest)**
- Product price: £25.00 (includes £4.17 VAT)
- Display: "£25.00 (inc. VAT)"
- Stripe receives £25.00
- You manually calculate VAT for accounting

**Option B: Stripe Tax (automated)**
- Enable Stripe Tax in dashboard
- Stripe calculates VAT based on customer location
- Stripe can file VAT returns (if configured)

**v1 Recommendation:** Option A (VAT-inclusive) unless you need automated compliance.

---

## Event Bookings: v1

### Flow
- ✅ **Pay-to-book** — Payment confirms booking immediately
- ❌ **NOT in v1:** Request booking, waitlists, deposits, installment payments

### Booking Flow
1. User views event page
2. User clicks "Book Now"
3. Redirected to Stripe Checkout
4. User pays full event price
5. Webhook creates booking record
6. Confirmation email sent with event details
7. Admin sees booking in CMS

### Capacity Management
- ✅ **Simple capacity tracking** — Max attendees per event
- ✅ **Sold out state** — Disable "Book Now" when full
- ❌ **NOT in v1:** Waitlists, overbooking, tiered pricing (early bird)

---

## Order Management: v1 (UPDATED)

### What Admins Can Do
- ✅ View all orders (filterable by status, date, customer)
- ✅ See order details (customer info, items, shipping address, payment status)
- ✅ Mark order as "fulfilled" (for physical products)
- ✅ Mark event booking as "confirmed" (auto-confirmed on payment)
- ✅ View inventory impact (which items decremented stock/capacity)
- ✅ Send confirmation email (auto-triggered by webhook)
- ❌ **NOT in v1:** Refunds (manual via Stripe Dashboard), order editing, partial fulfillment

### Order States
```
paid → fulfilled (for products)
paid → confirmed (for events, auto-set)
```

- **paid** — Payment successful, awaiting fulfillment (products) or auto-confirmed (events)
- **fulfilled** — Physical products shipped/delivered
- **confirmed** — Event booking confirmed (set automatically on payment)

**Note:** No "pending" state in v1. Orders only created after successful payment.

### Order Data Model
Each order contains:
- Order ID (unique)
- Customer info (name, email, shipping address)
- Line items (mixed products + events)
  - Product: name, quantity, price, stock decremented
  - Event: name, date/time, price, capacity decremented
- Payment info (Stripe payment intent ID, amount, status)
- Shipping info (address, method, cost)
- Timestamps (created_at, fulfilled_at)
- Status (paid, fulfilled)

### Mixed Order Example
```json
{
  "order_id": "ORD-2026-001",
  "customer": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "shipping_address": "123 Main St, London, UK"
  },
  "line_items": [
    {
      "type": "product",
      "name": "Wellness Box",
      "quantity": 2,
      "price": 25.00,
      "total": 50.00
    },
    {
      "type": "event",
      "name": "Yoga Workshop",
      "date": "2026-02-15 10:00",
      "quantity": 1,
      "price": 40.00,
      "total": 40.00
    }
  ],
  "shipping": {
    "method": "UK Standard",
    "cost": 4.95
  },
  "total": 94.95,
  "status": "paid",
  "stripe_payment_id": "pi_xxx",
  "created_at": "2026-01-31T14:30:00Z"
}
```

**v2 Enhancements:**
- Refund processing (in-app, auto-increment inventory)
- Order cancellation (before fulfillment)
- Partial fulfillment (split shipments)
- Order editing (change address, add/remove items)
- Shipping label generation (nice-to-have, deferred)

---

## Customer Accounts: v1 (UPDATED - REQUIRED)

### v1 Approach: Customer Accounts Required for Subscriptions

**Why accounts are required:**
- ✅ Subscriptions need pause/resume/cancel functionality
- ✅ Billing cycle management requires customer access
- ✅ Customers need to view subscription status and next billing date
- ✅ Customers need to manage payment methods

**v1 Features:**
- ✅ Customer registration (email/password)
- ✅ Customer login
- ✅ Subscription management dashboard
- ✅ View subscription status, next billing date, billing history
- ✅ Pause/resume/cancel subscription
- ✅ Update payment method
- ✅ View order history (subscriptions + one-time purchases)
- ✅ Guest checkout still available for one-time purchases (no account required)

**How it works:**
- **Subscribers:** Must create account to manage subscription
- **One-time buyers:** Can checkout as guest OR create account (optional)
- **After guest purchase:** Option to create account to view order history

**v2 Enhancements:**
- Saved addresses for faster checkout
- Wishlist / favorites
- Reorder previous purchases
- Social login (Google, Facebook)
- Two-factor authentication

---

## Inventory Management: v1 (UPDATED)

### v1 Approach: Automatic Inventory Tracking
- ✅ **Stock count** — Number field per product (boxes)
- ✅ **Event capacity** — Max attendees per event
- ✅ **Auto-decrement on purchase** — Inventory updated when payment succeeds
- ✅ **Out of stock state** — Disable "Add to Cart" when stock = 0 or event full
- ✅ **Cart validation** — Check inventory before creating Stripe Checkout session
- ❌ **NOT in v1:** Low stock alerts, SKU management, inventory reservations during checkout

### How It Works: Products (Boxes)
1. Admin sets stock count (e.g., 50 boxes)
2. Customer adds 2 boxes to cart
3. Customer proceeds to checkout
4. Backend validates: `stock_count >= cart_quantity`
5. If valid, create Stripe Checkout session
6. On successful payment (webhook), decrement stock: `stock_count -= 2`
7. If stock = 0, "Add to Cart" button disabled on frontend

### How It Works: Events
1. Admin sets event capacity (e.g., 20 attendees)
2. Customer adds event to cart (quantity always = 1 per booking)
3. Customer proceeds to checkout
4. Backend validates: `current_bookings < capacity`
5. If valid, create Stripe Checkout session
6. On successful payment (webhook), increment bookings: `current_bookings += 1`
7. If `current_bookings >= capacity`, event shows "Sold Out"

### Mixed Cart Example
**Cart contents:**
- 3x "Wellness Box" (£25 each)
- 1x "Yoga Workshop" event (£40)

**Checkout validation:**
1. Check "Wellness Box" stock: `stock_count >= 3` ✅
2. Check "Yoga Workshop" capacity: `current_bookings < capacity` ✅
3. Create Stripe Checkout session with 2 line items
4. Total: £115 (£75 for boxes + £40 for event + shipping if applicable)

**On payment success:**
1. Decrement "Wellness Box" stock by 3
2. Increment "Yoga Workshop" bookings by 1
3. Create order record with both items
4. Send confirmation email

### Race Condition Handling
**Problem:** Two users checkout simultaneously for the last item.

**v1 Solution:**
- Webhook handler uses database transaction
- First webhook to commit wins
- Second webhook fails gracefully (refund issued manually if needed)

**v2 Enhancement:**
- Reserve inventory when Checkout session created
- Release reservation if payment fails or session expires (15 min timeout)

### Inventory Edge Cases

| Scenario | v1 Behavior |
|----------|-------------|
| User adds item to cart, stock runs out before checkout | Checkout validation fails, show error message |
| Payment succeeds but webhook fails | Manual reconciliation (admin checks Stripe dashboard) |
| Refund issued | Admin manually increments stock count |
| Event cancelled | Admin manually updates capacity or archives event |

**v2 Enhancements:**
- Low stock alerts (email admin when stock < 5)
- Inventory reservations during checkout
- Automatic refund handling (auto-increment stock)
- SKU/barcode tracking
- Inventory sync with external systems

---

## What We're NOT Building

### Shopify Features We Don't Need
- ❌ Multi-currency support
- ❌ Discount codes / coupons
- ❌ Abandoned cart recovery
- ❌ Product reviews / ratings
- ❌ Wishlist / favorites
- ❌ Related products / upsells
- ❌ Gift wrapping options
- ❌ Customer accounts
- ❌ Loyalty points
- ❌ Affiliate tracking
- ❌ Multi-vendor marketplace
- ❌ Dropshipping integrations
- ❌ POS (point of sale) system

**If you need these, use Shopify.**

---

## Summary: v1 Commerce Stack (UPDATED)

| Component | v1 Solution | v2 Enhancement |
|-----------|-------------|----------------|
| Cart | ✅ Custom cart (mixed products + events) | Saved carts, wishlist |
| Payments | ✅ Stripe Checkout (hosted) | Stripe Elements (embedded) |
| Products | ✅ Physical boxes (one-time + subscription) | + Digital, variants |
| Subscriptions | ✅ Monthly via Stripe Subscriptions | Skip deliveries, swap box types, gift subs |
| Subscription Mgmt | ✅ Custom UI (pause/resume/cancel) | Advanced features (skip, swap) |
| Shipping | ✅ UK flat rate | Weight-based, international |
| Tax | ✅ VAT-inclusive pricing | Stripe Tax, multi-region |
| Events | ✅ Pay-to-book, capacity tracking | Waitlists, deposits |
| Orders | ✅ View + mark fulfilled | Refunds, editing |
| Customers | ✅ Accounts required for subscriptions | Social login, 2FA |
| Inventory | ✅ Auto-decrement on purchase | Low stock alerts, reservations |
| Shipping Labels | ❌ Manual fulfillment | Label generation (nice-to-have) |

**v1 Goal:** Sell boxes (one-time + monthly subscription), book events, with custom cart, customer accounts, subscription management, automatic inventory, and Stripe-powered billing. Preserve existing subscription functionality.

**v2 Goal:** Add advanced subscription features (skip, swap), shipping labels, and enhanced features only when user demand justifies the complexity.

---

## Key v1 Requirements (CONFIRMED)

✅ **Must Have:**
1. Custom shopping cart (session-based, for one-time purchases)
2. Mixed cart support (boxes + events in one order)
3. **Monthly subscription support** ✅ CRITICAL
4. **Customer accounts** (required for subscription management)
5. **Subscription management UI** (pause/resume/cancel, billing cycle)
6. Automatic inventory decrement (boxes)
7. Automatic capacity decrement (events)
8. Stripe Checkout integration (hosted payment page)
9. Stripe Subscriptions integration (recurring billing)
10. Webhook-driven order creation (one-time + subscription)
11. UK flat rate shipping
12. VAT-inclusive pricing
13. Admin order management (view, fulfill)
14. Admin subscription management (view active subscriptions)
15. Guest checkout for one-time purchases
16. Separate checkout flows (subscription vs one-time)

✅ **Subscription Features (v1):**
- Subscribe to monthly boxes
- Pause subscription (temporarily stop deliveries)
- Resume subscription (restart deliveries)
- Cancel subscription (end recurring billing)
- Update payment method
- View subscription status and next billing date
- View billing history
- Subscribers can also buy one-time boxes (separate transaction)

❌ **Not in v1:**
1. Shipping label generation (nice-to-have for v2)
2. Refund processing in-app (manual via Stripe Dashboard)
3. Inventory reservations during checkout
4. Product variants (size, color)
5. Discount codes
6. Abandoned cart recovery
7. Skip individual deliveries (v2)
8. Swap box types mid-subscription (v2)
9. Gift subscriptions (v2)
10. Combined checkout (subscription + one-time items in same cart) (v2)

**Philosophy:** Build the minimum viable commerce system that supports the core use case (selling boxes one-time + monthly subscription + booking events). Preserve existing subscription functionality. Use Stripe for billing infrastructure. Defer advanced features until proven necessary.

