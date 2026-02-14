# Legacy Website Firebase → Supabase Migration Epic

## 🎯 Goal
Migrate the legacy Lola Workshops website (`/lola-workshops`) from Firebase to Supabase for the complete event booking flow, leveraging existing infrastructure in `lola-as-one` to stay DRY.

## 📊 Current State Analysis

### ✅ What's Already Working
- **Event Display**: Events are successfully fetched from Supabase via `fetchEventById()` and `transformSupabaseEventToLegacy()`
- **Supabase Infrastructure**: Complete schema with tables for customers, orders, bookings, payments, etc.
- **Edge Functions**: Stripe integration via `create-checkout-session`, `stripe-webhook`, `send-email`
- **New Website**: `lola-as-one/app` has full working implementation of the booking flow

### 🔥 What's Still Using Firebase
- **Shopping Basket**: Stored in Vuex state, but event capacity checks use Firebase
- **Registration**: Customer data temporarily stored in Vuex, not persisted to Supabase
- **Payment**: Uses Firebase Functions `stripe-createPaymentIntent` instead of Supabase Edge Functions
- **Booking Storage**: Saves to Firebase `bookings` collection instead of Supabase
- **Email Notifications**: Firebase Cloud Functions trigger emails on booking creation
- **Newsletter**: Firebase Functions handle newsletter signups

## 📋 Migration Tasks

### ✅ 1. Event Display & Selection (COMPLETE)
**Status**: Already migrated and working

**What's Done**:
- `EventDetailsView.vue` uses `fetchEventById()` from Supabase
- `transformSupabaseEventToLegacy()` maintains compatibility
- Calendar components can fetch from Supabase

**Files**:
- ✅ `lola-workshops/src/lib/supabase.ts`
- ✅ `lola-workshops/src/views/EventDetailsView.vue`

---

### 2. Shopping Basket / Cart Integration
**Priority**: High  
**Complexity**: Medium

**Current State**:
- Basket stored in Vuex (`store.state.basket`)
- No persistence - lost on page refresh
- Firebase used for event capacity checks in `BasketView.vue`

**Migration Options**:

**Option A: Reuse lola-as-one Cart Store (Recommended)**
- Copy `app/src/stores/cart.ts` to legacy website
- Uses localStorage for persistence
- Already compatible with Supabase structure
- Minimal changes needed

**Option B: Use Supabase Cart Tables**
- Leverage `carts` and `cart_items` tables
- Requires session management
- More complex but fully server-side

**Recommendation**: Option A - simpler, faster, and the new site already uses it successfully.

**Tasks**:
- [ ] Copy `app/src/stores/cart.ts` to `lola-workshops/src/stores/cart.ts`
- [ ] Update `BasketView.vue` to use cart store instead of Vuex basket
- [ ] Replace Firebase event capacity checks with Supabase queries
- [ ] Test basket persistence across page refreshes

**Files to Modify**:
- `lola-workshops/src/views/BasketView.vue`
- `lola-workshops/src/store/index.ts` (remove basket state)

**DRY Opportunity**: ✅ Reuse existing cart store from lola-as-one

---

### 3. Registration Form & Customer Data
**Priority**: High  
**Complexity**: Medium

**Current State**:
- `RegistrationView.vue` collects customer and attendee data
- Data stored temporarily in Vuex (`store.state.booking`)
- Not persisted to any database until payment completes

**Migration Plan**:
- Create/update customer record in Supabase `customers` table
- Store attendee information for later booking creation
- Maintain Vuex state for checkout flow continuity

**Tasks**:
- [ ] Add Supabase helper function `createOrUpdateCustomer()`
- [ ] Update `RegistrationView.vue` to save customer data on form submission
- [ ] Store customer ID in Vuex for checkout process
- [ ] Handle existing vs. new customer logic (check by email)

**Files to Modify**:
- `lola-workshops/src/views/RegistrationView.vue`
- `lola-workshops/src/lib/supabase.ts` (add customer functions)

**DRY Opportunity**: ⚠️ Consider extracting customer form component from lola-as-one

---

### 4. Payment Processing Integration
**Priority**: Critical  
**Complexity**: High

**Current State**:
- `PaymentView.vue` uses Firebase Functions `stripe-createPaymentIntent`
- Direct Stripe Elements integration (card input)
- Supports Apple Pay / Google Pay via Payment Request API
- On success, calls `saveBooking()` to Firebase

**Migration Plan**:
Replace Firebase Functions with Supabase Edge Function `create-checkout-session`.

**Key Differences**:
| Firebase Approach | Supabase Approach |
|-------------------|-------------------|
| Payment Intent → Manual confirmation | Checkout Session → Stripe hosted |
| Custom card form | Stripe Checkout page |
| Immediate booking save | Webhook creates booking |

**Tasks**:
- [ ] Update `PaymentView.vue` to call Supabase `create-checkout-session` function
- [ ] Pass cart items, customer data, and attendee info to Edge Function
- [ ] Redirect to Stripe Checkout instead of inline payment
- [ ] Create success/cancel redirect pages
- [ ] Remove inline Stripe Elements code (or keep as fallback)

**Files to Modify**:
- `lola-workshops/src/views/PaymentView.vue`
- `lola-workshops/src/router/index.ts` (add success/cancel routes)

**DRY Opportunity**: ✅ Reuse `create-checkout-session` Edge Function (already exists)

**Note**: This is a UX change - moving from inline payment to Stripe Checkout. Consider user impact.

---

### 5. Booking Creation & Storage
**Priority**: Critical
**Complexity**: High

**Current State**:
- `PaymentView.vue` has `saveBooking()` function
- Saves to Firebase `bookings` collection with `addDoc()`
- Includes attendees, parent info, basket, timestamp, price
- Triggers Firebase Cloud Function for email on creation

**Migration Plan**:
Bookings should be created by the `stripe-webhook` Edge Function (already implemented!) when payment succeeds.

**Supabase Flow**:
1. Payment succeeds → Stripe sends webhook
2. `stripe-webhook` function receives `checkout.session.completed` event
3. Creates `order` record
4. Creates `order_items` for each cart item
5. Creates `booking` record for event items
6. Decrements event capacity
7. Triggers email notification

**Tasks**:
- [ ] Review `supabase/functions/stripe-webhook/index.ts` - already handles bookings!
- [ ] Ensure `create-checkout-session` passes attendee data in metadata
- [ ] Update webhook to store attendee details in `booking_attendees` table
- [ ] Remove `saveBooking()` from `PaymentView.vue` (webhook handles it)
- [ ] Create success page that fetches booking by session ID

**Files to Modify**:
- `supabase/functions/create-checkout-session/index.ts` (add attendee metadata)
- `supabase/functions/stripe-webhook/index.ts` (add booking_attendees creation)
- `lola-workshops/src/views/PaymentView.vue` (remove saveBooking)
- Create `lola-workshops/src/views/BookingSuccessView.vue`

**DRY Opportunity**: ✅ Webhook already exists and handles bookings - just need to extend it

---

### 6. Event Capacity Management
**Priority**: High
**Complexity**: Medium

**Current State**:
- `PaymentView.vue` has `updateThemeQuantities()` function
- Updates Firebase `events` collection to decrement quantity
- No transaction safety - race conditions possible

**Migration Plan**:
Use Supabase's `decrement_event_capacity()` function (already exists!) and `event_capacity` table.

**Supabase Approach**:
- `event_capacity` table tracks spaces_booked, spaces_reserved, spaces_available
- `decrement_event_capacity(event_id, attendees)` function handles updates
- Webhook calls this function when booking is confirmed
- Generated column ensures accurate availability

**Tasks**:
- [ ] Verify `event_capacity` records exist for all events
- [ ] Update `create-checkout-session` to check capacity before creating session
- [ ] Remove `updateThemeQuantities()` from `PaymentView.vue`
- [ ] Add capacity validation in basket (prevent adding if full)
- [ ] Display available spaces in event details

**Files to Modify**:
- `lola-workshops/src/views/EventDetailsView.vue` (show capacity)
- `lola-workshops/src/views/BasketView.vue` (validate capacity)
- `supabase/functions/create-checkout-session/index.ts` (capacity check)

**DRY Opportunity**: ✅ Function already exists, just need to use it

---

### 7. Email Confirmation System
**Priority**: High
**Complexity**: Medium

**Current State**:
- Firebase Cloud Function `receiptEmail` triggers on booking creation
- Uses Nodemailer with Gmail SMTP
- Sends admin email and customer email
- Templates: `admin_receipt.html`, `user_receipt.html`

**Migration Plan**:
Use Supabase `send-email` Edge Function with Resend API (already implemented!).

**Supabase Approach**:
- Webhook creates booking → calls `send-email` function
- Resend API sends transactional emails
- Templates defined in `supabase/functions/send-email/templates/`
- Email logs stored in `email_logs` table

**Tasks**:
- [ ] Review existing email templates in `lola-workshops/functions/src/templates/`
- [ ] Port templates to Resend-compatible format in `supabase/functions/send-email/templates/`
- [ ] Add `event-booking-confirmation` template type to send-email function
- [ ] Update webhook to call send-email after booking creation
- [ ] Test email delivery with real booking data
- [ ] Migrate admin notification email

**Files to Modify**:
- `supabase/functions/send-email/index.ts` (add booking confirmation template)
- Create `supabase/functions/send-email/templates/booking-confirmation.html`
- `supabase/functions/stripe-webhook/index.ts` (call send-email)

**DRY Opportunity**: ✅ send-email function exists, just need booking templates

**Migration Note**:
- Keep Firebase Functions running during transition for existing bookings
- Gradually migrate email templates
- Consider using same templates for both systems initially

---

### 8. Booking Management & Viewing
**Priority**: Medium
**Complexity**: Low

**Current State**:
- `BookingView.vue` fetches booking by ID from Firebase
- Displays attendee info, event details, attendance status
- Admin can mark attendance

**Migration Plan**:
Update to fetch from Supabase `bookings` table with joins.

**Tasks**:
- [ ] Add `fetchBookingById()` to `lola-workshops/src/lib/supabase.ts`
- [ ] Update `BookingView.vue` to use Supabase query
- [ ] Join with `offering_events`, `offerings`, `booking_attendees`
- [ ] Update attendance tracking to use Supabase
- [ ] Add booking list view for customers (optional)

**Files to Modify**:
- `lola-workshops/src/views/BookingView.vue`
- `lola-workshops/src/lib/supabase.ts`

**DRY Opportunity**: ⚠️ Consider reusing booking views from lola-as-one admin

---

### 9. Newsletter Signup Integration
**Priority**: Low
**Complexity**: Low

**Current State**:
- `NewsletterSignupComponent.vue` uses Firebase Function `emails-subscribeToNewsletter`
- Likely integrates with Mailchimp or similar service

**Migration Options**:

**Option A: Keep Firebase Function (Recommended)**
- Newsletter is independent of booking flow
- No urgent need to migrate
- Firebase Functions can coexist with Supabase

**Option B: Create Supabase Edge Function**
- Create `supabase/functions/subscribe-newsletter/index.ts`
- Call same external service (Mailchimp/etc)
- Update component to call Supabase function

**Recommendation**: Option A - defer this migration, focus on critical booking flow first.

**Tasks** (if migrating):
- [ ] Create `supabase/functions/subscribe-newsletter/index.ts`
- [ ] Update `NewsletterSignupComponent.vue` to call Supabase function
- [ ] Test newsletter signup flow

**Files to Modify**:
- `lola-workshops/src/components/NewsletterSignupComponent.vue`

**DRY Opportunity**: ⚠️ Low priority - can defer

---

### 10. Testing & Validation
**Priority**: Critical
**Complexity**: High

**End-to-End Test Scenarios**:

1. **Happy Path - Single Event Booking**
   - [ ] Browse events from Supabase
   - [ ] Add event to cart
   - [ ] Fill registration form
   - [ ] Complete payment via Stripe Checkout
   - [ ] Verify booking created in Supabase
   - [ ] Verify email received
   - [ ] Verify capacity decremented
   - [ ] View booking details

2. **Multiple Attendees**
   - [ ] Add event with 3 attendees
   - [ ] Verify pricing calculation
   - [ ] Verify all attendees stored in booking_attendees
   - [ ] Verify capacity decremented by 3

3. **Capacity Limits**
   - [ ] Try to book event at max capacity
   - [ ] Verify error message
   - [ ] Verify no booking created

4. **Payment Failure**
   - [ ] Use Stripe test card that fails
   - [ ] Verify no booking created
   - [ ] Verify capacity not decremented
   - [ ] Verify no email sent

5. **Existing Customer**
   - [ ] Book with email that exists in customers table
   - [ ] Verify customer record updated, not duplicated
   - [ ] Verify booking linked to existing customer

6. **Admin Functions**
   - [ ] View booking in admin panel
   - [ ] Mark attendance
   - [ ] View capacity reports

**Testing Checklist**:
- [ ] Set up Supabase local development environment
- [ ] Configure Stripe test mode webhooks
- [ ] Test email delivery (use Resend test mode)
- [ ] Test with real Stripe test cards
- [ ] Verify database constraints (no orphaned records)
- [ ] Test error handling and rollback scenarios
- [ ] Performance test with multiple concurrent bookings
- [ ] Cross-browser testing (Safari, Chrome, Firefox)
- [ ] Mobile responsive testing

---

## 🔄 Migration Strategy

### Phase 1: Preparation (Week 1)
- [ ] Set up Supabase environment variables in legacy website
- [ ] Ensure all Supabase tables have test data
- [ ] Review and understand existing Edge Functions
- [ ] Create feature flag for gradual rollout

### Phase 2: Core Migration (Week 2-3)
- [ ] Implement cart store (Task 2)
- [ ] Migrate customer registration (Task 3)
- [ ] Integrate payment processing (Task 4)
- [ ] Update booking creation (Task 5)

### Phase 3: Supporting Features (Week 4)
- [ ] Implement capacity management (Task 6)
- [ ] Set up email notifications (Task 7)
- [ ] Update booking views (Task 8)

### Phase 4: Testing & Launch (Week 5)
- [ ] Complete end-to-end testing (Task 10)
- [ ] Fix bugs and edge cases
- [ ] Gradual rollout with monitoring
- [ ] Keep Firebase as fallback

### Phase 5: Cleanup (Week 6)
- [ ] Remove Firebase dependencies
- [ ] Archive Firebase Functions
- [ ] Update documentation
- [ ] Newsletter migration (Task 9) - optional

---

## 🎯 DRY Opportunities Summary

| Component | Status | Action |
|-----------|--------|--------|
| Event fetching | ✅ Done | Already using Supabase |
| Cart store | ✅ Reusable | Copy from lola-as-one |
| Checkout session | ✅ Reusable | Use existing Edge Function |
| Stripe webhook | ✅ Reusable | Extend for attendees |
| Email function | ✅ Reusable | Add booking templates |
| Capacity function | ✅ Reusable | Already exists |
| Customer forms | ⚠️ Consider | Could extract component |
| Booking views | ⚠️ Consider | Could reuse admin views |

---

## 📚 Key Files Reference

### Legacy Website (lola-workshops)
- `src/lib/supabase.ts` - Supabase client and helpers
- `src/views/EventDetailsView.vue` - Event display (✅ migrated)
- `src/views/BasketView.vue` - Shopping cart
- `src/views/RegistrationView.vue` - Customer registration
- `src/views/PaymentView.vue` - Payment processing
- `src/views/BookingView.vue` - Booking details
- `src/components/NewsletterSignupComponent.vue` - Newsletter

### Supabase Edge Functions
- `supabase/functions/create-checkout-session/` - Stripe checkout
- `supabase/functions/stripe-webhook/` - Payment webhooks
- `supabase/functions/send-email/` - Email notifications
- `supabase/functions/get-order-by-session/` - Order retrieval

### New Website (app) - Reference Implementation
- `app/src/stores/cart.ts` - Cart store (reusable)
- `app/src/views/Checkout.vue` - Checkout flow
- `app/src/views/OrderSuccess.vue` - Success page

### Database Schema
- `docs/schema.sql` - Complete Supabase schema
- Tables: `customers`, `orders`, `order_items`, `bookings`, `booking_attendees`, `event_capacity`

---

## 🚨 Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment flow UX change | High | User testing, clear messaging |
| Data loss during migration | Critical | Keep Firebase running, dual-write initially |
| Email delivery issues | High | Test thoroughly, monitor logs |
| Capacity race conditions | Medium | Use database transactions |
| Webhook failures | High | Implement retry logic, monitoring |
| Customer confusion | Medium | Clear communication, support ready |

---

## ✅ Success Criteria

- [ ] Zero Firebase dependencies in booking flow
- [ ] All bookings stored in Supabase
- [ ] Email confirmations working reliably
- [ ] Event capacity accurately tracked
- [ ] Payment success rate maintained or improved
- [ ] Page load times maintained or improved
- [ ] Zero data loss
- [ ] Admin can manage bookings in new system

---

## 📞 Next Steps

1. **Review this epic** with the team
2. **Prioritize tasks** based on business needs
3. **Set up development environment** with Supabase local
4. **Start with Task 2** (Cart Integration) as foundation
5. **Implement incrementally** with feature flags
6. **Test thoroughly** at each stage

---

**Questions? Concerns?**
This is a comprehensive migration that touches critical business functionality. Let's discuss any concerns before starting implementation.

