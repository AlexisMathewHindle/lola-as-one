# Epic 7 — Customer-Facing E-commerce Frontend

**Last Updated:** 2026-02-04
**Status:** ✅ COMPLETE (100% - 13 of 13 components + Stripe Backend Integration)
**Goal:** Build customer-facing product pages, cart, and checkout flow for workshops, boxes, and digital products.

---

## Overview

This epic covers building the customer-facing e-commerce experience that allows customers to:
- Browse workshops, boxes, and products
- View detailed product/event information
- Add items to cart (mixed cart: boxes + events)
- Manage cart (update quantities, remove items)
- Checkout with Stripe
- View order confirmation
- Join waitlists for sold-out events and out-of-stock products

---

## 1. Product Listing Pages

### 1.1 Workshops Listing (`/workshops`) ✅ COMPLETE
**Component:** `Workshops.vue`

**Purpose:** Display all upcoming workshops/events in a calendar view

**Status:** ✅ Built and responsive

**Features:**
- **Calendar View:**
  - Week view (desktop default) - Shows 7 days starting from current week
  - Day view (mobile default) - Shows single day with hourly slots
  - Auto-switches between views at 768px breakpoint
  - Navigation: Previous/Next buttons (week or day), "Today" button
  - Time slots on left (9am - 6pm in 30-minute increments)
  - Workshop blocks positioned absolutely by date and time
  - Responsive: Mobile-optimized with smaller slots and touch targets

- **Workshop Blocks (Calendar Items):**
  - Time range (e.g., "09:30 - 10:30")
  - Workshop title
  - Age group/category (e.g., "all ages", "ages 2-4", "ages 5+")
  - Color-coded by category:
    - Blue/Teal: Open Studio (all ages)
    - Orange: Storytelling, Creative activities
    - Brown/Tan: Little Ones classes (ages 2-4)
    - Yellow/Gold: Private parties, special events
  - Clickable to navigate to workshop detail page
  - Visual indicator for sold out events (grayed out or strikethrough)
  - Visual indicator for waitlist available

- **View Toggle:**
  - "Week" button - Shows 7-day week view
  - "Day" button - Shows single day view

- **Filters (Optional):**
  - Category filter (all, adult, kids, family)
  - Show only available workshops (hide sold out)

- **Empty State:** When no workshops scheduled
- **Loading State:** Skeleton calendar while loading

**Calendar Layout:**
- Left column: Time labels (9am, 9:30am, 10am, etc.)
- Top row: Date headers (Mon 02 Feb, Tue 03 Feb, etc.)
- Grid cells: 30-minute time slots
- Workshop blocks: Span multiple cells based on duration
- Responsive: Stack days vertically on mobile

**Data Query:**
```javascript
// Fetch workshops for current week
const startDate = getStartOfWeek(currentDate)
const endDate = getEndOfWeek(currentDate)

const { data: workshops } = await supabase
  .from('offering_events')
  .select(`
    *,
    offering:offerings(*),
    capacity:event_capacity(*)
  `)
  .gte('event_date', startDate)
  .lte('event_date', endDate)
  .eq('offering.status', 'published')
  .order('event_date', { ascending: true })
  .order('event_start_time', { ascending: true })
```

**Calendar Library:**
- Consider using a Vue calendar library like:
  - `@fullcalendar/vue3` - Full-featured calendar
  - `v-calendar` - Lightweight Vue calendar
  - Custom implementation using CSS Grid

---

### 1.2 Boxes Listing (`/boxes`) ✅ COMPLETE
**Component:** `Boxes.vue`

**Purpose:** Display all subscription boxes and one-time box purchases

**Status:** ✅ Built and responsive

**Features:**
- **Product Type Tabs:**
  - All Boxes
  - Subscription Boxes (monthly recurring)
  - One-Time Boxes (single purchase)
- **Filters:**
  - Category filter (all categories)
  - Price range filter
  - Availability filter (in stock, out of stock, waitlist available)
- **Search:** Search by box title or description
- **Sort:** By price, newest, popularity
- **Box Cards:**
  - Featured image
  - Box title
  - Short description
  - Price (or "From £X/month" for subscriptions)
  - Stock status (In Stock, Low Stock, Out of Stock, Waitlist Available)
  - "Add to Cart" or "Subscribe" or "Notify Me" button
- **Subscription Badge:** Special badge for subscription boxes
- **Empty State:** When no boxes match filters
- **Loading State:** Skeleton cards while loading

**Data Query:**
```javascript
const { data: boxes } = await supabase
  .from('offerings')
  .select(`
    *,
    offering_product:offering_products(*),
    inventory:inventory_items(*)
  `)
  .in('type', ['product_physical', 'subscription'])
  .eq('status', 'published')
  .order('created_at', { ascending: false })
```

---

### 1.3 Shop Listing (`/shop`) ✅ COMPLETE
**Component:** `Shop.vue`

**Purpose:** Display all products (boxes + digital products + gift cards)

**Status:** ✅ Built and responsive

**Features:**
- **Product Type Tabs:**
  - All Products (combined count)
  - Physical Products (boxes + subscriptions)
  - Digital Products (downloads + gift cards)

- **Filters:**
  - Search by title or description
  - Sort by newest, price (low/high), name (A-Z)
  - Availability filter (in stock, low stock, out of stock)

- **Product Cards:**
  - Product type badge (Physical/Subscription/Digital Download/Gift Card)
  - Stock status badge (for physical products only)
  - Featured image or placeholder icon
  - Title and short description
  - Price display
  - Action buttons:
    - Physical products: "Add to Cart" or "Subscribe"
    - Digital products: "View Details"
    - Out of stock: "Join Waitlist" or "Out of Stock"

- **Mixed Grid:** Shows all product types together
- **Navigation:**
  - Physical products → `/boxes/:slug`
  - Digital products → `/products/:slug`
  - Subscription plans (subset of physical products) route to `/subscriptions/:slug` for curated plan configuration.

  - **Empty State:** When no products match filters
- **Loading State:** Skeleton cards while loading

**Data Query:**
```javascript
// Fetch physical products
const { data: physicalData } = await supabase
  .from('offering_products')
  .select(`
    *,
    offering:offerings!inner(*)
  `)
  .in('offering.type', ['product_physical', 'subscription'])
  .eq('offering.status', 'published')

// Fetch digital products
const { data: digitalData } = await supabase
  .from('offering_digital_products')
  .select(`
    *,
    offering:offerings!inner(*)
  `)
  .eq('offering.type', 'product_digital')
  .eq('offering.status', 'published')
```

---

## 2. Product Detail Pages

### 2.1 Workshop Detail (`/workshops/:slug`) ✅ COMPLETE
**Component:** `WorkshopDetail.vue`

**Purpose:** Display full workshop/event details and booking form

**Status:** ✅ Built, responsive, and integrated with waitlist modal

**Features:**
- **Hero Section:**
  - Large featured image
  - Workshop title
  - Date, time, and location
  - Price
  - Capacity status (X spots left)
  - "Book Now" button (or "Sold Out" / "Join Waitlist")

- **Workshop Information:**
  - Full description (rich text from Tiptap)
  - What's included
  - What to bring
  - Skill level required
  - Duration
  - Age restrictions (if any)

- **Event Details Card:**
  - Date and time
  - Location (with map link)
  - Instructor/host
  - Capacity (X of Y spots filled)
  - Category badge

- **Image Gallery:** Multiple images if available

- **Booking Section:**
  - Number of attendees selector (1-10)
  - Total price calculation
  - "Add to Cart" button
  - Or "Join Waitlist" button if sold out

- **Related Workshops:** Show similar upcoming workshops

**Data Query:**
```javascript
const { data: workshop } = await supabase
  .from('offering_events')
  .select(`
    *,
    offering:offerings(*),
    capacity:event_capacity(*),
    waitlist_enabled:event_capacity(waitlist_enabled)
  `)
  .eq('offering.slug', slug)
  .single()
```

---

### 2.2 Box Detail (`/boxes/:slug`) ✅ COMPLETE
**Component:** `BoxDetail.vue`

**Purpose:** Display full box/product details and purchase options

**Status:** ✅ Built and responsive

**Features:**
- **Hero Section:**
  - Large product image
  - Product title
  - Price (or subscription price)
  - Stock status
  - "Add to Cart" or "Subscribe" button

- **Product Information:**
  - Full description (rich text)
  - What's included
  - Dimensions/weight (if applicable)
  - Materials/ingredients

- **Product Details Card:**
  - SKU
  - Category
  - Stock status (In Stock, Low Stock, Out of Stock)
  - Shipping info

- **Image Gallery:** Multiple product images

- **Purchase Section:**
  - Quantity selector (1-10)
  - Stock validation
  - Total price calculation
  - "Add to Cart" button
  - Or "Notify Me" button if out of stock

- **Subscription Options (if applicable):**
  - Monthly subscription toggle
  - Subscription price
  - "Subscribe Now" button
  - Subscription benefits

- **Related Products:** Show similar boxes

**Data Query:**
```javascript
const { data: box } = await supabase
  .from('offerings')
  .select(`
    *,
    offering_product:offering_products(*),
    inventory:inventory_items(*)
  `)
  .eq('slug', slug)
  .single()
```

---

### 2.3 Digital Product Detail (`/products/:slug`) ✅ COMPLETE
**Component:** `ProductDetail.vue`

**Purpose:** Display digital product details (gift cards, downloads)

**Status:** ✅ Built and working (440 lines)

**Features Implemented:**
- ✅ **Hero Section:**
  - Large featured image or gradient placeholder
  - Product type badge (Digital Download / Gift Card)
  - Product title and short description
  - Price display (inc. VAT)

- ✅ **File Information (for downloads):**
  - File type (PDF, video, audio, etc.)
  - File size (formatted in KB/MB)
  - Download limit (if applicable)
  - Access duration (days after purchase or lifetime)
  - Purple-themed info box

- ✅ **Gift Card Information:**
  - Gift card details and usage info
  - Primary-themed info box

- ✅ **Instant Delivery Notice:**
  - Green success box
  - Email delivery confirmation message
  - Different messaging for downloads vs gift cards

- ✅ **Add to Cart:**
  - Large primary button with price
  - Adds digital product to cart
  - Success alert (can be enhanced with toast)
  - Secure checkout badge

- ✅ **Product Details Section:**
  - Full description with formatted text
  - Product info grid (type, price, delivery method)
  - Responsive layout

- ✅ **Related Products:**
  - Shows 4 related digital products
  - Product cards with images, titles, prices
  - Type badges
  - Clickable to navigate to product detail
  - Responsive grid (1/2/4 columns)

- ✅ **Loading & Error States:**
  - Skeleton loading animation
  - Error message with back button
  - Product not found handling

**Route:** `/products/:slug` (added to router)

**Icons Used:** `faDownload`, `faHeart`, `faCheckCircle`, `faShoppingCart`, `faTag`, `faPoundSign`, `faEnvelope`

---

## 3. Shopping Cart

### 3.1 Cart Store ✅ ENHANCED
**File:** `app/src/stores/cart.js`

**Current Features:**
- ✅ Add items to cart
- ✅ Remove items from cart
- ✅ Update quantities
- ✅ Clear cart
- ✅ LocalStorage persistence
- ✅ Item count computed property
- ✅ Subtotal computed property
- ✅ **Flexible product structure handling** ✅ **ADDED**
  - Accepts both `id` and `productId`
  - Accepts both `title` and `name`
  - Accepts both `price` and `price_gbp`
  - Accepts multiple image field names
  - Stores both old and new field names for backward compatibility
- ✅ **Event booking support** ✅ **ADDED**
  - Stores event date and time
  - Handles event type items
- ✅ **Subscription item support** ✅ **ADDED**
  - Handles subscription type items
- ✅ **Digital product support** ✅ **ADDED**
  - Handles digital product type items

**Enhancements Still Needed:**
- Add inventory validation before checkout
- Add capacity validation for events

---

### 3.2 Cart Page (`/cart`) ✅ COMPLETE
**Component:** `Cart.vue`

**Purpose:** Display cart contents and allow modifications

**Status:** ✅ Built and working (342 lines)

**Features Implemented:**
- ✅ **Header Section:**
  - Page title "Shopping Cart"
  - Item count display

- ✅ **Empty Cart State:**
  - Empty cart icon and message
  - "Browse Workshops" button (links to /workshops)
  - "Browse Products" button (links to /shop)
  - Centered, friendly design

- ✅ **Cart Items List (Left Column - 2/3 width):**
  - Product image or icon placeholder with gradient
  - Product title and type badge (Workshop/Digital Product/Physical Product/Subscription)
  - Subscription plan summary for subscription items (plan label + "X of Y boxes selected" from `subscriptionConfig`)
  - Remove button with confirmation
  - Event details (date/time) for workshop items
  - Quantity selector with +/- buttons (disabled for events)
  - Direct quantity input field
  - Line total display
  - Price per unit (shown when quantity > 1)
  - Responsive card layout

- ✅ **Cart Summary (Right Column - 1/3 width):**
  - Subtotal calculation
  - Shipping calculation (£5 for physical items, FREE for digital/events)
  - VAT notice (20% included in prices)
  - Total calculation (subtotal + shipping)
  - "Proceed to Checkout" button with lock icon
  - "Continue Shopping" link
  - Security badge (Stripe)
  - Sticky positioning on desktop

- ✅ **Quantity Management:**
  - Increment/decrement buttons
  - Direct input field
  - Minimum quantity: 1
  - Events always quantity = 1 (no quantity selector shown)
  - Updates cart store and localStorage

- ✅ **Helper Functions:**
  - `getItemKey()` - Handles both old (productId) and new (id) structure
  - `getItemIcon()` - Returns appropriate icon for item type
  - `getItemTypeBadgeClass()` - Returns Tailwind classes for type badges
  - `getItemTypeLabel()` - Returns human-readable type labels
  - `lineTotal()` - Calculates line total
  - `formatDate()` - Formats event dates

- ✅ **Cart Calculations:**
  - `hasPhysicalItems` - Detects if cart has physical items
  - `shipping` - £5 for physical, £0 for digital/events
  - `total` - Subtotal + shipping

- ✅ **Responsive Design:**
  - Mobile: Single column layout
  - Desktop: 2/3 items + 1/3 summary
  - Sticky summary on desktop

**Route:** `/cart` (added to router)

**Icons Used:** `faShoppingCart`, `faCalendar`, `faShoppingBag`, `faTrash`, `faClock`, `faMinus`, `faPlus`, `faLock`, `faShieldAlt`, `faDownload`, `faBox`, `faSync`

---

### 3.3 Cart Icon/Badge ✅ UPDATED
**Component:** `Navigation.vue`

**Current Features:**
- ✅ Cart icon in navigation (desktop)
- ✅ Item count badge (shows number of items)
- ✅ Clickable to navigate to `/cart` ✅ **FIXED**
- ✅ Cart link in mobile menu with item count badge ✅ **ADDED**
- ✅ Hover effect on cart icon

**Future Enhancements (v2):**
- Add cart dropdown preview on hover (optional)

---

### 3.4 Checkout Page ✅ COMPLETE
**Component:** `Checkout.vue`
**File:** `app/src/views/Checkout.vue`

**Purpose:** Checkout page with customer information, shipping address, and Stripe integration

**Status:** ✅ Built and working (464 lines)

**Features Implemented:**

- ✅ **Empty Cart Redirect:**
  - Shows empty cart message if cart is empty
  - "Continue Shopping" button to navigate to /shop
  - Cart icon with friendly message

- ✅ **Two-Column Layout:**
  - Desktop: Form (2/3 width) + Summary (1/3 width)
  - Mobile: Single column (stacked)
  - Responsive grid layout

- ✅ **Customer Information Form:**
  - First name (required)
  - Last name (required)
  - Email address (required, validated)
  - Phone number (optional)
  - Form validation with error messages
  - Red border on invalid fields
  - Helper text for email ("Order confirmation will be sent to this email")

- ✅ **Shipping Address Form (Conditional):**
  - Only shown if cart has physical items (`hasPhysicalItems` computed)
  - Address line 1 (required)
  - Address line 2 (optional)
  - City (required)
  - Postal code (required)
  - Country selector (default: GB)
    - Options: UK, US, Canada, Australia, France, Germany, Italy, Spain
  - Form validation for shipping fields

- ✅ **Order Summary (Right Column):**
  - Sticky positioning on desktop
  - Cart items list:
    - Item image or gradient icon placeholder
    - Item title
    - Quantity
    - Event date (for workshops)
    - Line total
  - Totals section:
    - Subtotal
    - Shipping (£5 for physical, FREE for digital/events)
    - VAT (20% included in prices)
    - Total (bold)
  - "Proceed to Payment" button with lock icon
  - Processing state with spinner
  - Security notice ("Secure checkout powered by Stripe")

- ✅ **Form Validation:**
  - Required field validation
  - Email format validation (regex)
  - Shipping address validation (only if physical items)
  - Error messages displayed below fields
  - Scroll to first error on submit
  - Focus on first error field

- ✅ **Stripe Checkout Integration (Placeholder):**
  - `loadStripe` imported from `@stripe/stripe-js`
  - Commented code for creating checkout session
  - Ready for API endpoint integration
  - Will redirect to Stripe Checkout when implemented

- ✅ **Helper Functions:**
  - `hasPhysicalItems` - Detects if cart has physical items
  - `shipping` - £5 for physical, £0 for digital/events
  - `vat` - Calculates VAT (20% included)
  - `total` - Subtotal + shipping
  - `formatDate()` - Formats event dates
  - `validateForm()` - Validates all form fields
  - `handleCheckout()` - Handles form submission

- ✅ **Responsive Design:**
  - Mobile: Single column layout
  - Desktop: 2/3 form + 1/3 summary
  - Sticky summary on desktop
  - Responsive text sizes

**Route:** `/checkout` (already added to router)

**Icons Used:** `faShoppingCart`, `faShoppingBag`, `faLock`, `faSpinner`, `faCalendar`, `faBox`

**Next Steps:**
1. Build Stripe backend API endpoint (`POST /api/checkout/create-session`)
2. Implement webhook handler for `checkout.session.completed`
3. Uncomment Stripe integration code in `handleCheckout()`
4. Test with Stripe test mode

---

## 4. Checkout Flow

### 4.1 Checkout Page (`/checkout`)
**Component:** `Checkout.vue`

**Purpose:** Collect customer information and process payment

**Features:**
- **Customer Information Form:**
  - Email address (required)
  - First name (required)
  - Last name (required)
  - Phone number (optional)

- **Shipping Address Form (if physical items in cart):**
  - Address line 1 (required)
  - Address line 2 (optional)
  - City (required)
  - Postcode (required)
  - Country (default: United Kingdom)

- **Order Summary:**
  - List of items
  - Subtotal
  - Shipping
  - VAT
  - Total

- **Payment Section:**
  - "Pay with Stripe" button
  - Secure payment badge
  - Accepted payment methods icons

- **Guest Checkout:**
  - Allow checkout without account
  - Option to create account after purchase

**Checkout Flow:**
1. Validate cart (inventory, capacity)
2. Collect customer info
3. Create Stripe Checkout session
4. Redirect to Stripe hosted payment page
5. Customer enters payment info on Stripe
6. Stripe processes payment
7. Stripe redirects to success page
8. Webhook creates order in database

---

### 4.2 Order Success Page (`/order/success`) ✅ COMPLETE
**Component:** `OrderSuccess.vue`
**File:** `app/src/views/OrderSuccess.vue`

**Purpose:** Order confirmation page after successful payment

**Status:** ✅ Built and working (390 lines)

**Features Implemented:**

- ✅ **Loading State:**
  - Spinner animation
  - "Loading your order details..." message
  - Centered layout

- ✅ **Error State:**
  - Red exclamation triangle icon
  - "Order Not Found" heading
  - Error message display
  - "Continue Shopping" button to navigate to /shop

- ✅ **Success State:**
  - Green check circle icon (success badge)
  - "Thank You for Your Order!" heading
  - Success message
  - Order number display (e.g., "ORD-20260203-000001")
  - Email confirmation notice (blue info box):
    - Envelope icon
    - "Confirmation Email Sent" heading
    - Customer email display
    - Message about order details and receipt

- ✅ **Order Summary Section:**
  - "Order Summary" heading
  - Order items list:
    - Item icon/image (gradient placeholder with icon)
    - Item title
    - Type badge (Workshop/Digital Product/Physical Product)
      - Purple badge for events
      - Blue badge for digital products
      - Orange badge for physical products
    - Quantity (if > 1)
    - Event date (for workshops) with calendar icon
    - Event time (for workshops) with clock icon
    - Line total price
    - Unit price (if quantity > 1)
  - Totals section:
    - Subtotal
    - Shipping (£5 for physical, FREE for digital/events)
    - VAT (20% included in prices)
    - Total paid (bold)

- ✅ **Shipping Information Section (Conditional):**
  - Only shown if order has physical items (`hasPhysicalItems`)
  - Shipping name
  - Address line 1
  - Address line 2 (if provided)
  - City and postal code
  - Country
  - Estimated delivery date (5 business days from order date)
    - Formatted as "Monday, 10 February 2026"

- ✅ **Next Steps Section:**
  - "What's Next?" heading
  - Digital downloads notice (purple box - if hasDigitalProducts):
    - Download icon
    - "Digital Downloads" heading
    - Message about checking email for download links
  - Workshop confirmation notice (blue box - if hasEvents):
    - Calendar icon
    - "Workshop Confirmation" heading
    - Message about reminder email before event
  - Shipping updates notice (green box - if hasPhysicalItems):
    - Box icon
    - "Shipping Updates" heading
    - Message about tracking information

- ✅ **Action Buttons:**
  - "Continue Shopping" button (primary orange):
    - Shopping bag icon
    - Navigates to /shop
  - "View My Orders" button (secondary gray):
    - Navigates to /account

- ✅ **Helper Functions:**
  - `getItemIcon(itemType)` - Returns appropriate icon for item type
    - 'event' → 'calendar'
    - 'product_digital' → 'download'
    - 'product_physical' → 'box'
  - `getItemTypeBadgeClass(itemType)` - Returns Tailwind classes for type badges
    - 'event' → purple badge
    - 'product_digital' → blue badge
    - 'product_physical' → orange badge
  - `getItemTypeLabel(itemType)` - Returns human-readable type labels
    - 'event' → 'Workshop'
    - 'product_digital' → 'Digital Product'
    - 'product_physical' → 'Physical Product'
  - `formatDate(dateString)` - Formats event dates
    - Format: "Mon, 15 Mar 2026"
  - `formatTime(timeString)` - Formats event times
    - Format: "14:00" (HH:MM)

- ✅ **Computed Properties:**
  - `hasPhysicalItems` - Detects if order has physical items
  - `hasDigitalProducts` - Detects if order has digital products
  - `hasEvents` - Detects if order has events
  - `estimatedDelivery` - Calculates estimated delivery date (5 business days)

- ✅ **Order Data Fetching:**
  - Gets `session_id` from URL query params
  - Validates session_id exists
  - Fetches order from backend API (placeholder for now)
    - TODO: Implement API endpoint `/api/orders/by-session/:sessionId`
  - Clears cart after successful order (`cartStore.clearCart()`)
  - Error handling:
    - Missing session_id
    - Failed API fetch
    - Shows error state with friendly message

- ✅ **Responsive Design:**
  - Mobile: Single column layout
  - Desktop: Max-width 4xl (896px)
  - Responsive padding and spacing
  - Responsive text sizes
  - Responsive icon sizes

**Route:** `/order/success` (already added to router)

**Icons Used:** `faSpinner`, `faExclamationTriangle`, `faShoppingBag`, `faCheckCircle`, `faEnvelope`, `faCalendar`, `faClock`, `faBox`, `faDownload`

**Next Steps:**
1. Build Stripe backend API endpoint (`POST /api/checkout/create-session`)
2. Implement webhook handler for `checkout.session.completed`
3. Build API endpoint to fetch order by session_id (`GET /api/orders/by-session/:sessionId`)
4. Replace mock data in `fetchOrderDetails()` with real API call
5. Test with Stripe test mode

---

**Purpose:** Confirm successful order and display order details

**Features:**
- **Success Message:**
  - "Thank you for your order!"
  - Order number
  - Confirmation email sent message

- **Order Summary:**
  - Items purchased
  - Total paid
  - Shipping address (if applicable)
  - Estimated delivery (if applicable)

- **Next Steps:**
  - "View Order Details" button (if logged in)
  - "Continue Shopping" button
  - "Create Account" button (if guest checkout)

- **Event Bookings:**
  - Calendar add button
  - Event details reminder

---

## 5. Waitlist Modals

### 5.1 Join Event Waitlist Modal ✅ COMPLETE
**Component:** `JoinEventWaitlistModal.vue`

**Purpose:** Allow customers to join waitlist for sold-out events

**Status:** ✅ Built, functional, and integrated into WorkshopDetail.vue

**Features:**
- **Form Fields:**
  - First name (required)
  - Last name (required)
  - Email (required)
  - Phone (optional)
  - Number of spots requested (1-10)
  - Notes (optional)

- **Submit Action:**
  - Insert into `event_waitlist_entries` table
  - Show success message
  - Auto-close after 3 seconds
  - Emit success event to parent

- **Validation:**
  - Email format validation
  - Required field validation
  - Error handling and display

- **UI/UX:**
  - Modal with backdrop (Teleport to body)
  - Close button and click-outside to close
  - Success state with checkmark icon
  - Loading state with spinner
  - Smooth transitions and animations
  - Responsive design

- **Integration:**
  - ✅ Integrated into WorkshopDetail.vue
  - Shows when event is sold out and `workshop.waitlist_enabled = true`
  - Refreshes waitlist count after successful submission
  - Props: modelValue, eventId, eventTitle
  - Emits: update:modelValue, success

---

### 5.2 Join Product Waitlist Modal ✅ COMPLETE
**Component:** `JoinProductWaitlistModal.vue`

**Purpose:** Allow customers to join waitlist for out-of-stock products

**Status:** ✅ Built, functional, and integrated into BoxDetail.vue

**Features:**
- **Form Fields:**
  - First name (required)
  - Last name (required)
  - Email (required)
  - Phone (optional)
  - Quantity requested (1-10)
  - Notes (optional)

- **Submit Action:**
  - Insert into `product_waitlist_entries` table
  - Show success message
  - Auto-close after 3 seconds
  - Emit success event to parent

- **Validation:**
  - Email format validation
  - Required field validation
  - Error handling and display

- **UI/UX:**
  - Modal with backdrop (Teleport to body)
  - Close button and click-outside to close
  - Success state with checkmark icon
  - Loading state with spinner
  - Smooth transitions and animations
  - Responsive design

- **Integration:**
  - ✅ Integrated into BoxDetail.vue
  - Shows when product is out of stock and `box.waitlist_enabled = true`
  - Props: modelValue, productId, productTitle
  - Emits: update:modelValue, success

---

## 6. Routes to Add

```javascript
// Customer-facing routes
{
  path: '/workshops',
  name: 'Workshops',
  component: () => import('../views/Workshops.vue')
},
{
  path: '/workshops/:slug',
  name: 'WorkshopDetail',
  component: () => import('../views/WorkshopDetail.vue')
},
{
  path: '/boxes',
  name: 'Boxes',
  component: () => import('../views/Boxes.vue')
},
{
  path: '/boxes/:slug',
  name: 'BoxDetail',
  component: () => import('../views/BoxDetail.vue')
},
{
  path: '/shop',
  name: 'Shop',
  component: () => import('../views/Shop.vue')
},
{
  path: '/products/:slug',
  name: 'ProductDetail',
  component: () => import('../views/ProductDetail.vue')
},
{
  path: '/cart',
  name: 'Cart',
  component: () => import('../views/Cart.vue')
},
{
  path: '/checkout',
  name: 'Checkout',
  component: () => import('../views/Checkout.vue')
},
{
  path: '/order/success',
  name: 'OrderSuccess',
  component: () => import('../views/OrderSuccess.vue')
}
```

---

## 7. Stripe Integration

### 7.1 Create Checkout Session
**API Endpoint:** `POST /api/checkout/create-session`

**Request Body:**
```json
{
  "items": [
    {
      "offering_id": "uuid",
      "quantity": 2,
      "price": 25.00
    }
  ],
  "customer_email": "customer@example.com",
  "shipping_address": {
    "line1": "123 Main St",
    "city": "London",
    "postal_code": "SW1A 1AA",
    "country": "GB"
  }
}
```

**Response:**
```json
{
  "session_id": "cs_test_...",
  "session_url": "https://checkout.stripe.com/..."
}
```

---

### 7.2 Webhook Handler
**Endpoint:** `POST /api/webhooks/stripe`

**Events to Handle:**
- `checkout.session.completed` - Create order, decrement inventory
- `payment_intent.succeeded` - Update payment status
- `payment_intent.payment_failed` - Handle failed payment

**Order Creation Logic:**
1. Extract session data
2. Create order record in `orders` table
3. Create order items in `order_items` table
4. Decrement inventory for physical products
5. Decrement event capacity for bookings
6. Send confirmation email
7. Return 200 OK to Stripe

---

## 8. Acceptance Criteria

### Core Features (v1)
- [x] Workshops listing page with filters and search
- [x] Boxes listing page with filters and search
- [x] Shop listing page (all products)
- [x] Workshop detail page with booking form
- [x] Box detail page with add to cart
- [x] Product detail page for digital products
- [x] Cart page with item management
- [ ] Checkout page with customer info form
- [ ] Stripe Checkout integration
- [ ] Order success page
- [x] Join event waitlist modal
- [x] Join product waitlist modal
- [x] Routes setup (added /products/:slug, /cart, /checkout, /order/success)
- [ ] Cart store enhancements (events, subscriptions, validation)
- [ ] Inventory validation before checkout
- [ ] Capacity validation before checkout
- [ ] Stripe webhook handler
- [ ] Order creation on successful payment
- [ ] Inventory decrement on purchase
- [ ] Capacity decrement on booking
- [ ] Confirmation email (optional v1)

### Optional/Future (v2)
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Cart abandonment tracking
- [ ] Related products recommendations
- [ ] Product comparison
- [ ] Advanced filtering (multi-select, price slider)
- [ ] Cart dropdown preview in navigation
- [ ] Guest order tracking
- [ ] Order history for logged-in users

---

## 9. Stripe Backend Integration ✅ COMPLETE

**Status:** ✅ Built and integrated with frontend

### 9.1 Architecture

**Technology Stack:**
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Payment Processing:** Stripe Checkout (hosted payment page)
- **Database:** Supabase PostgreSQL
- **Frontend:** Vue 3 with Supabase client

### 9.2 Edge Functions Built

#### 9.2.1 Create Checkout Session
**Location:** `supabase/functions/create-checkout-session/index.ts`
**Features:** Request validation, total calculations, inventory/capacity validation, Stripe session creation

#### 9.2.2 Stripe Webhook Handler
**Location:** `supabase/functions/stripe-webhook/index.ts`
**Features:** Webhook verification, order creation, inventory decrement, booking creation

#### 9.2.3 Get Order by Session
**Location:** `supabase/functions/get-order-by-session/index.ts`
**Features:** Fetch order details by Stripe session ID for OrderSuccess.vue

### 9.3 Frontend Integration

**Checkout.vue:** ✅ Integrated with `create-checkout-session` Edge Function
**OrderSuccess.vue:** ✅ Integrated with `get-order-by-session` Edge Function

### 9.4 Payment Flow

1. User fills checkout form → 2. Frontend calls `create-checkout-session` → 3. Validates inventory/capacity → 4. Redirects to Stripe → 5. User pays → 6. Stripe webhook creates order → 7. User redirected to success page → 8. OrderSuccess fetches order details → 9. Cart cleared

### 9.5 Documentation

**Plan Document:** `docs/stripe-backend-integration-plan.md` - Comprehensive plan with architecture, endpoints, implementation steps, testing plan

---

## 10. Next Steps

After completing Epic 7, proceed to:
- **Epic 8:** Customer accounts and authentication
- **Epic 9:** Email notifications and waitlist automation
- **Epic 10:** Content pages (home, about, contact, blog)
- **Epic 11:** Testing and launch preparation

