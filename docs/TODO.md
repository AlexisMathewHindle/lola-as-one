# TODO — Lola As One Project

**Last Updated:** 2026-02-04

---

## 🔥 Immediate Next Steps

### 1. Apply Waitlist Database Migration ⚠️
**Priority:** HIGH  
**File:** `docs/migrations/add-waitlist-support.sql`

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `docs/migrations/add-waitlist-support.sql`
3. Paste and run the migration
4. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('event_waitlist_entries', 'product_waitlist_entries');
   ```
5. Test waitlist components in admin UI

**Why:** Waitlist UI is complete but database tables don't exist yet

---

---

### 3. Build Customer-Facing Waitlist Modals
**Priority:** MEDIUM  
**Epic:** 9 - Frontend

**Components to Build:**
- [ ] `JoinEventWaitlistModal.vue` - Modal for joining event waitlist
- [ ] `JoinProductWaitlistModal.vue` - Modal for joining product waitlist (Notify Me)

**Features:**
- Form to collect customer name, email, phone
- Quantity/spaces requested
- Optional notes field
- Submit to `event_waitlist_entries` or `product_waitlist_entries` table
- Success/error messaging

**Integration Points:**
- Event detail page (when fully booked)
- Product detail page (when out of stock)

---

### 4. Set Up Email Notification System
**Priority:** MEDIUM  
**Epic:** 9 - Frontend

**Tasks:**
- [ ] Choose email service (SendGrid, Resend, or Supabase Edge Functions)
- [ ] Create email templates for waitlist notifications
  - Event waitlist notification (24-hour window)
  - Product restock notification (48-hour window)
- [ ] Implement email sending function
- [ ] Test notification workflow

**Email Templates Needed:**
- Event waitlist notification (spot available)
- Product restock notification (back in stock)
- Waitlist expiry reminder (optional)

---



## 📋 Epic 7 — Customer-Facing E-commerce ✅ COMPLETE

**Priority:** HIGH
**Status:** ✅ COMPLETE (100% - 13 of 13 components + Stripe Backend Integration)

### Product Listing Pages
- [x] Workshops.vue - Responsive calendar view (week/day) with mobile optimization
  - Week view (desktop): 7-day grid with time slots
  - Day view (mobile default): Single day with hourly slots
  - Auto-switches at 768px breakpoint
  - Color-coded workshop blocks by category
  - Touch-optimized for mobile
- [x] Boxes.vue - List all subscription boxes and one-time boxes
  - Product type tabs (All, Subscription, One-Time)
  - Search and filters (availability, sort by price/name/newest)
  - Product grid with images, pricing, stock status
  - Subscription badge for subscription boxes
  - Stock status badges (In Stock, Low Stock, Out of Stock)
  - Add to Cart / Subscribe / Join Waitlist buttons
  - Empty state and loading states
  - Responsive design for mobile
- [x] Shop.vue - List all products (boxes + digital products)
  - Product type tabs: All Products, Physical Products, Digital Products
  - Fetches from both offering_products and offering_digital_products tables
  - Search by title or description
  - Sort by newest, price (low/high), name
  - Availability filter (in stock, low stock, out of stock)
  - Product cards with:
    - Product type badge (Physical/Subscription/Digital Download/Gift Card)
    - Stock status badge (for physical products)
    - Featured image or placeholder
    - Title and short description
    - Price display
    - Action buttons (Add to Cart/Subscribe/View Details/Join Waitlist)
  - Mixed grid showing all product types together
  - Navigates to /boxes/:slug for physical products
  - Navigates to /products/:slug for digital products
  - Empty state and loading states
  - Responsive design for mobile

### Product Detail Pages
- [x] WorkshopDetail.vue - Workshop details with booking form
  - Hero section with featured image, title, date/time/location
  - Capacity progress bar with availability status
  - Full description with rich text formatting
  - Booking form with attendee details (name, email, special requirements)
  - Customer contact info (email, phone)
  - Total price calculation
  - Sold out / waitlist button (placeholder modal)
  - Related workshops section
  - Responsive design for mobile
- [x] BoxDetail.vue - Box details with add to cart
  - Hero section with product image and subscription badge
  - Stock status badge with color coding
  - Purchase mode toggle (one-time vs subscription)
  - Subscription benefits display
  - Quantity selector with stock validation
  - Total price calculation
  - Add to Cart / Subscribe / Join Waitlist buttons
  - Product details grid (SKU, stock, weight, shipping)
  - Full description section
  - Related products section (4 boxes)
  - Responsive design for mobile
- [x] ProductDetail.vue - Digital product details (440 lines)
  - Hero section with featured image and product type badge (Digital Download/Gift Card)
  - Price display (inc. VAT)
  - File information box (for downloads): file type, size, download limit, access duration
  - Gift card information box (for gift cards)
  - Instant delivery notice (green success box)
  - Add to cart button with price
  - Product details section with full description
  - Product info grid (type, price, delivery method)
  - Related products section (4 digital products)
  - Loading and error states
  - Responsive design for mobile
  - Route: /products/:slug

### Cart & Checkout
- [x] Cart.vue - Shopping cart with item management (342 lines)
  - Header with item count
  - Empty cart state with navigation links
  - Cart items list (left column, 2/3 width)
  - Cart item cards with image, title, type badge, remove button
  - Event details (date/time) for workshop items
  - Quantity selector with +/- buttons (disabled for events)
  - Line total display
  - Cart summary (right column, 1/3 width, sticky)
  - Subtotal, shipping (£5 for physical, FREE for digital/events), VAT notice, total
  - Proceed to checkout button
  - Continue shopping link
  - Security badge (Stripe)
  - Helper functions for item key, icon, badge class, type label
  - Cart calculations (hasPhysicalItems, shipping, total)
  - Quantity management (increment, decrement, update)
  - Remove item with confirmation
  - Date formatting for events
  - Responsive design (mobile: single column, desktop: 2/3 + 1/3)
  - Route: /cart
- [x] Checkout.vue - Checkout page with Stripe integration (464 lines) ✅ **COMPLETE**
  - Empty cart redirect with "Continue Shopping" button
  - Two-column layout (desktop): Form (2/3) + Summary (1/3)
  - Customer information form (first name, last name, email, phone)
  - Shipping address form (conditional - only if hasPhysicalItems)
    - Address line 1, line 2, city, postal code, country selector
  - Order summary (right column, sticky)
    - Cart items list with images, titles, quantities, prices
    - Event dates for workshops
    - Subtotal, shipping, VAT (20% included), total
  - Form validation with error messages
    - Required field validation
    - Email format validation
    - Shipping address validation (only if physical items)
    - Scroll to first error on submit
  - Stripe Checkout integration (placeholder for now)
    - loadStripe import ready
    - Commented code for creating checkout session
    - Redirect to Stripe Checkout (to be implemented)
  - Processing state with spinner
  - Security notice ("Secure checkout powered by Stripe")
  - Responsive design (mobile: single column, desktop: 2/3 + 1/3)
  - Route: /checkout
- [x] OrderSuccess.vue - Order confirmation page (390 lines) ✅ **COMPLETE**
  - Loading state with spinner
  - Error state with error message and "Continue Shopping" button
  - Success state with:
    - Success icon (green check circle)
    - "Thank You for Your Order!" heading
    - Order number display
    - Email confirmation notice (blue info box)
  - Order summary section:
    - Order items list with icons, titles, type badges, quantities, prices
    - Event dates and times for workshops
    - Subtotal, shipping, VAT (20% included), total paid
  - Shipping information section (conditional - only if hasPhysicalItems):
    - Shipping name and address
    - Estimated delivery date (5 business days)
  - Next steps section:
    - Digital downloads notice (purple box - if hasDigitalProducts)
    - Workshop confirmation notice (blue box - if hasEvents)
    - Shipping updates notice (green box - if hasPhysicalItems)
  - Action buttons:
    - "Continue Shopping" button (navigates to /shop)
    - "View My Orders" button (navigates to /account)
  - Helper functions:
    - getItemIcon() - Returns icon for item type
    - getItemTypeBadgeClass() - Returns Tailwind classes for type badges
    - getItemTypeLabel() - Returns human-readable type labels
    - formatDate() - Formats event dates
    - formatTime() - Formats event times (HH:MM)
  - Computed properties:
    - hasPhysicalItems - Detects if order has physical items
    - hasDigitalProducts - Detects if order has digital products
    - hasEvents - Detects if order has events
    - estimatedDelivery - Calculates estimated delivery date
  - Order data fetching:
    - Gets session_id from URL query params
    - Fetches order from backend API (placeholder for now)
    - Clears cart after successful order
    - Error handling for missing session or failed fetch
  - Responsive design (mobile: single column, desktop: max-w-4xl)
  - Route: /order/success

### Waitlist Modals
- [x] JoinEventWaitlistModal.vue - Join waitlist for sold-out events
  - Modal with Teleport to body
  - Form fields: First name, last name, email, phone (optional), spots requested (1-10), notes (optional)
  - Insert into event_waitlist_entries table
  - Success state with auto-close after 3 seconds
  - Error handling and validation
  - Modal transition animations
  - Responsive design
  - ✅ Integrated into WorkshopDetail.vue
  - ✅ Fixed: Uses workshop.waitlist_enabled from offering_events table
  - ✅ Refreshes waitlist count after submission
- [x] JoinProductWaitlistModal.vue - Join waitlist for out-of-stock products
  - Modal with Teleport to body
  - Form fields: First name, last name, email, phone (optional), quantity requested (1-10), notes (optional)
  - Insert into product_waitlist_entries table
  - Success state with auto-close after 3 seconds
  - Error handling and validation
  - Modal transition animations
  - Responsive design
  - ✅ Integrated into BoxDetail.vue
  - ✅ Button shows when product is out of stock and waitlist_enabled = true

### Routes
- [x] Added /shop route to router
- [x] Added /products/:slug route to router
- [x] Added /cart route to router ✅ Component built
- [x] Added /checkout route to router (component not built yet)
- [x] Added /order/success route to router (component not built yet)
- ✅ Total routes: 17 (was 12, added 5 new routes)

### Cart Store Enhancements
- [x] Add event booking support ✅ **COMPLETE**
  - Stores event date and time
  - Handles event type items
  - Quantity management (events can have multiple attendees)
- [x] Add subscription item support ✅ **COMPLETE**
  - Handles subscription type items
- [x] Add digital product support ✅ **COMPLETE**
  - Handles digital product type items
- [x] Flexible product structure handling ✅ **COMPLETE**
  - Accepts both old (productId, name) and new (id, title) structures
  - Backward compatible with existing code
- [x] Shipping calculation ✅ **COMPLETE** (implemented in Cart.vue)
  - £5 flat rate for physical items
  - FREE for digital/events
- [x] VAT display ✅ **COMPLETE** (implemented in Cart.vue)
  - 20% UK VAT included in prices notice
- [ ] Add inventory validation before checkout
- [ ] Add capacity validation for events

### Stripe Integration ✅ **COMPLETE**
- [x] Create checkout session API endpoint ✅ **COMPLETE**
  - Supabase Edge Function: `create-checkout-session`
  - Request validation (items, customer email)
  - Total calculations (subtotal, shipping £5 for physical, VAT 20%)
  - Inventory validation for physical products
  - Event capacity validation for workshops
  - Stripe customer creation/retrieval
  - Stripe Checkout Session creation with line items
  - Metadata storage (customer info, shipping, items, totals)
  - CORS headers for frontend integration
- [x] Webhook handler for `checkout.session.completed` ✅ **COMPLETE**
  - Supabase Edge Function: `stripe-webhook`
  - Webhook signature verification
  - Handles `checkout.session.completed` event
  - Creates customer record if doesn't exist
  - Creates order with auto-generated order number (ORD-YYYYMMDD-000001)
  - Creates order items
  - Decrements inventory via RPC function `decrement_inventory`
  - Decrements event capacity via RPC function `decrement_event_capacity`
  - Creates booking records for events
  - Handles `checkout.session.expired` event (placeholder)
- [x] Order fetch endpoint ✅ **COMPLETE**
  - Supabase Edge Function: `get-order-by-session`
  - Fetches order details by Stripe session ID
  - Returns formatted order data for OrderSuccess.vue
- [x] Frontend integration ✅ **COMPLETE**
  - Checkout.vue: Calls `create-checkout-session`, redirects to Stripe
  - OrderSuccess.vue: Calls `get-order-by-session`, displays order details
- [x] Order creation on successful payment ✅ **COMPLETE**
- [x] Inventory decrement on purchase ✅ **COMPLETE**
- [x] Capacity decrement on booking ✅ **COMPLETE**
- [ ] Confirmation email (optional v1)

**Documentation:**
- [x] Plan document: `docs/stripe-backend-integration-plan.md`
- [x] Updated Epic 7 documentation with Stripe integration section

**Payment Flow:**
1. User fills checkout form (Checkout.vue)
2. Frontend calls `create-checkout-session` Edge Function
3. Edge Function validates inventory/capacity, creates Stripe session
4. User redirected to Stripe hosted checkout
5. User completes payment on Stripe
6. Stripe sends webhook to `stripe-webhook` Edge Function
7. Webhook creates order, decrements inventory/capacity
8. User redirected to `/order/success?session_id=...`
9. OrderSuccess.vue calls `get-order-by-session` to fetch order details
10. Order details displayed, cart cleared

### Routes ✅ **COMPLETE**
- [x] All customer-facing routes added to router (17 total routes)

---

## 📋 Epic 8 — Content Pages

**Priority:** MEDIUM (after Epic 7)

**Pages to Build:**
- [ ] Home page
- [ ] Blog landing page
- [ ] Blog post detail page
- [ ] About page
- [ ] Contact page

---

## 📋 Epic 4 — Data Migration

**Priority:** MEDIUM (can be done in parallel)

**Tasks:**
- [ ] Migrate 80+ blog posts from existing site
- [ ] Migrate 120+ products from existing site
- [ ] Migrate workshop data
- [ ] Generate slugs for all content
- [ ] Upload images to Supabase Storage
- [ ] Create URL redirects (250+ redirects)

---

## 🔧 Technical Debt & Improvements

### Code Quality
- [ ] Add ESLint configuration
- [ ] Add Prettier configuration
- [ ] Add TypeScript (optional)
- [ ] Add unit tests for critical components
- [ ] Add E2E tests for checkout flow

### Performance
- [ ] Optimize image loading (lazy loading, responsive images)
- [ ] Add caching for frequently accessed data
- [ ] Optimize database queries
- [ ] Add pagination for large lists

### Security
- [ ] Review RLS policies
- [ ] Add rate limiting for API endpoints
- [ ] Add CSRF protection
- [ ] Add input sanitization

### Deployment
- [ ] Set up Vercel deployment
- [ ] Configure environment variables for production
- [ ] Set up CI/CD pipeline
- [ ] Add error tracking (Sentry)
- [ ] Add analytics (Google Analytics, Plausible)

---

## 📝 Documentation

- [ ] Add API documentation
- [ ] Add component documentation
- [ ] Add deployment guide
- [ ] Add troubleshooting guide
- [ ] Add user manual for admin CMS

---

## ✅ Recently Completed

- ✅ Admin Dashboard with stats and quick actions (2026-02-02)
- ✅ Offerings Management (CRUD for all types) (2026-02-01)
- ✅ Image Upload Component (2026-02-01)
- ✅ Blog Management (BlogList, BlogForm, RichTextEditor) (2026-02-01)
- ✅ Waitlist Management UI (4 admin components) (2026-02-02)
- ✅ Waitlist Settings in OfferingsForm (2026-02-02)
- ✅ Waitlist Stats on Dashboard (2026-02-02)
- ✅ Waitlist Database Migration SQL (2026-02-02)
- ✅ Waitlist Implementation Guide (2026-02-02)
- ✅ Event/Workshop Attendee Management (4 components) (2026-02-02)
  - ✅ EventBookingsList.vue - List all bookings with filters
  - ✅ EventDetails.vue - Event details with capacity tracking
  - ✅ BookingDetails.vue - Individual booking details with cancel functionality
  - ✅ AttendeeCheckIn.vue - Day-of-event check-in interface
  - ✅ Routes added to router (/admin/events/bookings, /admin/events/:id, etc.)
  - ✅ "Events" navigation link added to AdminLayout
  - ✅ Font Awesome icons added (calendar-check, arrow-left, check-circle, etc.)
- ✅ Order Management (2 components) (2026-02-02)
  - ✅ OrdersList.vue - List all orders with filters (status, type, date, search)
  - ✅ OrderDetails.vue - Individual order details with fulfillment workflow
  - ✅ Fulfillment modal (carrier, tracking number, tracking URL, notes)
  - ✅ Mark as fulfilled functionality
  - ✅ View in Stripe Dashboard link
  - ✅ Order timeline (created, paid, shipped, delivered, fulfilled)
  - ✅ Routes already existed in router (/admin/orders, /admin/orders/:id)
  - ✅ "Orders" navigation link already existed in AdminLayout
- ✅ Subscription Management (2 components) (2026-02-02)
  - ✅ SubscriptionsList.vue - List all subscriptions with filters (status, interval, search)
  - ✅ SubscriptionDetails.vue - Individual subscription details with pause/resume/cancel actions
  - ✅ Pause subscription modal (with pause reason field)
  - ✅ Resume subscription button
  - ✅ Cancel subscription modal (with cancel reason field)
  - ✅ Payment history (invoices)
  - ✅ Subscription history/events timeline
  - ✅ View in Stripe Dashboard link
  - ✅ Routes already existed in router (/admin/subscriptions, /admin/subscriptions/:id)
  - ✅ "Subscriptions" navigation link already existed in AdminLayout
- ✅ Customer Management (2 components) (2026-02-02)
  - ✅ CustomersList.vue - List all customers with filters (search, status, sort)
  - ✅ CustomerDetails.vue - Individual customer details with order/subscription/booking history
  - ✅ Customer information card (name, email, phone, member since, marketing opt-in, Stripe customer ID)
  - ✅ Stats cards (total orders, active subscriptions, lifetime value)
  - ✅ Order history table with links to order details
  - ✅ Subscriptions table with links to booking details
  - ✅ Event bookings table with links to booking details
  - ✅ View in Stripe Dashboard link
  - ✅ Lifetime value calculation
  - ✅ Routes: /admin/customers already existed, /admin/customers/:id added to router
  - ✅ "Customers" navigation link already existed in AdminLayout
- ✅ Product Inventory Management (2 components) (2026-02-02)
  - ✅ InventoryList.vue - List all inventory items with stock levels and filters
  - ✅ InventoryDetails.vue - Individual inventory item details with stock adjustment functionality
  - ✅ Comprehensive filters (search by SKU/product, filter by type, filter by stock status, sort by)
  - ✅ Stats summary cards (total items, in stock, low stock, out of stock)
  - ✅ Stock status badges with color coding (green = in stock, yellow = low stock, red = out of stock)
  - ✅ Inventory information card (product name, SKU, type, quantity available, quantity reserved, low stock threshold, last counted)
  - ✅ Stock status sidebar (available, reserved, total stock, status badge)
  - ✅ Low stock warning banner (when quantity <= threshold)
  - ✅ Out of stock warning banner (when quantity = 0)
  - ✅ Stock adjustment modal (movement type, quantity change, notes)
  - ✅ Stock movement history table (date, type, quantity change, notes)
  - ✅ Movement types: adjustment, restock, damage, return
  - ✅ Quick actions (adjust stock, view product/offering)
  - ✅ Real-time stock level preview in adjustment modal
  - ✅ Audit trail with all stock movements
  - ✅ Routes: /admin/inventory and /admin/inventory/:id added to router
  - ✅ "Inventory" navigation link added to AdminLayout sidebar
- ✅ Analytics & Reporting (1 component) (2026-02-02)
  - ✅ AnalyticsDashboard.vue - Comprehensive analytics dashboard with sales, customer, and inventory insights
  - ✅ Date range selector (7 days, 30 days, 90 days, year, all time)
  - ✅ Sales Overview section (total revenue, average order value, subscription revenue, event revenue)
  - ✅ Customer Insights section (total customers, new customers, repeat customers, average LTV)
  - ✅ Inventory Status section (total items, in stock, low stock, out of stock)
  - ✅ Top Selling Products (top 5 by revenue with quantity sold)
  - ✅ Top Events (top 5 by revenue with bookings count)
  - ✅ Recent Orders table (last 10 orders with status badges)
  - ✅ Real-time data from Supabase (orders, subscriptions, bookings, customers, inventory)
  - ✅ Calculated metrics (average order value, repeat customer rate, customer LTV)
  - ✅ Loading and error states
  - ✅ Responsive design
  - ✅ Route: /admin/analytics added to router
  - ✅ "Analytics" navigation link added to AdminLayout sidebar (with chart-line icon)
  - ✅ Breadcrumb mapping added

