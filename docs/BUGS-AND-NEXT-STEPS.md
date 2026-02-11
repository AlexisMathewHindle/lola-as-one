# Bugs & Next Steps - Lola As One

**Last Updated:** 2026-02-06  
**Status:** In Progress

---

## ✅ COMPLETED ITEMS

### Subscriptions
- ✅ **Subscription flow implemented**
  - Subscription offerings can be created (`offerings.type = 'subscription'`)
  - Curated box selection via `subscription_plan_boxes` table
  - Server-side validation via `validate-subscription-boxes` Edge Function
  - Stripe Checkout integration via `create-subscription-checkout-session` Edge Function
  - Frontend: `SubscriptionDetail.vue` handles plan selection and checkout
  
- ✅ **Stripe integration**
  - `create-checkout-session` Edge Function for one-time purchases (products + events)
  - `create-subscription-checkout-session` Edge Function for subscriptions
  - `stripe-webhook` Edge Function handles `checkout.session.completed`
  - Order creation, inventory decrement, booking creation all working
  - `get-order-by-session` Edge Function for order success page

- ✅ **Checkout works with products and events**
  - Cart supports physical products, digital products, events, and subscriptions
  - Checkout.vue handles mixed cart items
  - Shipping calculation (£5 flat rate for physical items)
  - VAT display (20% included in prices)
  - Event capacity validation
  - Inventory validation for physical products

### Admin Features
- ✅ **Dashboard cards link through to associated pages**
  - Dashboard.vue has router-links to Orders, Subscriptions, Workshops, Inventory
  - Quick Actions section links to create offerings, blog posts, etc.

- ✅ **Recent activity on dashboard displays orders**
  - Shows last 5 orders with order number, customer email, total, and date
  - Currently shows orders only (not events/products separately)

### Loading States
- ✅ **Card skeletons implemented for most pages**
  - Boxes.vue, Shop.vue, ProductDetail.vue, BoxDetail.vue use skeleton loaders
  - Some pages still use spinners (WorkshopDetail.vue, BlogPost.vue, admin pages)
  - **Recommendation:** Standardize on skeleton loaders for better UX

### Categories
- ✅ **Event categories are editable**
  - `EventCategoriesList.vue` admin page exists

### Email Notifications
- ✅ **Email notification system implemented**
  - Resend integration set up
  - Base email layout template created
  - Email sending Edge Function (`send-email`) created
  - Email logs database table created
  - 14 critical email templates implemented:
    - Order Confirmation
    - Event Booking Confirmation
    - Subscription Activated
    - Subscription Renewal Success
    - Subscription Payment Failed
    - Password Reset
    - Contact Form (Customer & Admin)
    - Digital Download Ready
    - Order Shipped
    - Event Reminders (7 days & 24 hours)
    - Waitlist Notifications (Event & Product)
  - Stripe webhook sends order confirmation emails
  - Stripe webhook sends event booking confirmation emails
  - **See:** `docs/EMAIL-IMPLEMENTATION-STATUS.md` and `docs/RESEND-SETUP-GUIDE.md`
  - `CategoryModal.vue` component for create/edit
  - `useEventCategories.js` composable with CRUD operations
  - Categories stored in `event_categories` table (separate from general `categories` table)

---

## 🐛 BUGS TO FIX

### High Priority

1. **✅ Email templates implemented (MOVED TO COMPLETED)**
   - ✅ Resend chosen as email service provider
   - ✅ 14 critical email templates built
   - ✅ Edge Function for sending emails created
   - ✅ Stripe webhook integration for order/booking emails
   - 🔄 36+ additional templates to be implemented (see `docs/EMAIL-IMPLEMENTATION-STATUS.md`)
   - **Next:** Deploy to production, set up custom domain, implement remaining templates

2. **❌ Blog posts don't post (unclear issue)**
   - BlogForm.vue exists and has save functionality
   - BlogList.vue can fetch and display posts
   - Blog.vue (public) filters by `status = 'published'`
   - **Need to investigate:** What does "don't post" mean? Can't save? Can't publish? Can't display?
   - **Action:** Test blog post creation/editing flow and identify specific issue

3. **❌ Orders should only show physical orders**
   - OrdersList.vue is currently a placeholder
   - **Action:** Build OrdersList.vue to filter `orders` table by `order_type = 'one_time'` and only show orders with physical products

4. **❌ Booked workshops should show all booked workshops**
   - EventBookingsList.vue exists and shows all bookings
   - **Need clarification:** Should this be a separate page or filter on EventBookingsList?
   - **Action:** Clarify requirement and implement if needed

5. **❌ Subscriptions should show only purchased subscriptions**
   - SubscriptionsList.vue is currently a placeholder
   - **Action:** Build SubscriptionsList.vue to fetch from `subscriptions` table with filters

6. **❌ Customers should be populated with all customers**
   - CustomersList.vue is currently a placeholder
   - CustomerDetails.vue exists and works
   - `customers` table exists and is populated via webhook
   - **Action:** Build CustomersList.vue to display all customers with search/filter
   - **Note:** Currently only shows customers who have made purchases (created via webhook)

7. **❌ Admin date filtering doesn't work as expected**
   - EventBookingsList.vue has date filter but applies client-side
   - **Action:** Review all admin pages with date filters and ensure they work correctly

8. **❌ All events in event bookings showing too many events**
   - EventBookingsList.vue filters are client-side for category and date
   - **Action:** Optimize filters or clarify what "too many events" means

### Medium Priority

9. **⚠️ Add notes/gift message input at checkout for products**
   - Checkout.vue currently has no field for order notes or gift messages
   - Should be available for products (physical and digital) but NOT for events
   - **Action:** Add optional textarea field in Checkout.vue for product orders
   - **Action:** Pass notes to `create-checkout-session` Edge Function
   - **Action:** Store in order metadata or new `order_notes` field in orders table
   - **Use cases:** Gift messages, special delivery instructions, personalization requests

10. **⚠️ Make sure we can post all other offerings**
    - Physical products: ✅ Working
    - Events: ✅ Working
    - Subscriptions: ✅ Working
    - Digital products: ❓ Need to test
    - **Action:** Test creating and publishing digital products

11. **⚠️ Anywhere there is a card and loading, display card skeleton not spinner**
    - Some pages use skeletons (Boxes, Shop, Products)
    - Some pages use spinners (Workshops, Blog, Admin pages)
    - **Action:** Standardize on skeleton loaders across all pages

12. **⚠️ Recent activity on dashboard should display purchased products and booked events**
    - Currently only shows orders
    - **Action:** Enhance Dashboard.vue to show recent bookings and product purchases separately

13. **⚠️ Should quick actions include view booked workshops or anything else?**
    - Current quick actions: Create Offering, Create Blog Post, View Inventory
    - **Action:** Review and add relevant quick actions (View Bookings, View Subscriptions, etc.)

### Low Priority

14. **📋 Integrate POST Office API**
    - No implementation found
    - **Action:** Research POST Office API for shipping/address validation
    - **Note:** Currently using manual address entry with no validation

15. **📋 Add "Add to Calendar" link to event booking confirmation page**
    - OrderSuccess.vue shows event bookings but no calendar link
    - **Action:** Generate ICS file or calendar links (Google Calendar, Apple Calendar, Outlook)
    - **Libraries:** Consider using `ics` npm package

16. **📋 Categories are not currently editable (general categories)**
    - Event categories ARE editable (EventCategoriesList.vue)
    - General `categories` table has no admin UI
    - **Action:** Clarify if general categories need admin UI or if event categories are sufficient

17. **📋 Homepage should show events driven by what is on this week**
    - Home.vue currently shows featured workshops (where `featured = true`)
    - **Action:** Change to show events happening this week instead of featured events

---

## 📋 NEXT STEPS (Priority Order)

1. **Email System** (CRITICAL)
   - Choose email provider (Resend recommended)
   - Build email templates (start with order confirmation, booking confirmation)
   - Create Edge Function for sending emails
   - Integrate with webhook handler

2. **Admin Pages** (HIGH)
   - Build OrdersList.vue (filter physical orders only)
   - Build SubscriptionsList.vue (show purchased subscriptions)
   - Build CustomersList.vue (show all customers with search)

3. **Bug Fixes** (HIGH)
   - Investigate and fix blog post publishing issue
   - Fix admin date filtering
   - Optimize event bookings filter

4. **UX Improvements** (MEDIUM)
   - Standardize loading states (use skeletons everywhere)
   - Add calendar links to booking confirmations
   - Enhance dashboard recent activity

5. **Feature Additions** (LOW)
   - POST Office API integration
   - Homepage "events this week" feature
   - Additional quick actions on dashboard

---

## 📝 NOTES

- **Subscription flow is complex but working** - curated box selection, validation, Stripe integration all in place
- **Stripe integration is solid** - webhooks, order creation, inventory management all working
- **Email system is the biggest gap** - no emails are being sent for confirmations, notifications, etc.
- **Admin pages need completion** - Orders, Subscriptions, Customers are placeholders
- **Loading states are inconsistent** - mix of spinners and skeletons

---

## 🔗 RELATED DOCUMENTATION

- [Email Notification System](./email-notification-system.md) - Complete list of 50+ email templates
- [Subscription Model](./subscription-model.md) - Subscription flow and architecture
- [Stripe Backend Integration Plan](./stripe-backend-integration-plan.md) - Stripe Edge Functions
- [TODO](./TODO.md) - Original TODO list (may be outdated)
- [README](./README.md) - Project overview and epic status

