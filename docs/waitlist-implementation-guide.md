# Waitlist Implementation Guide

**Date:** 2026-02-02  
**Status:** 📋 Planned & Ready for Implementation  
**Purpose:** Comprehensive guide for implementing waitlist functionality for events and products

---

## Overview

This guide covers the complete waitlist system for Lola As One, allowing customers to join waitlists for:
- **Sold-out events/workshops** — When event capacity is full
- **Out-of-stock products** — When product inventory reaches zero

---

## 1. Database Schema

### Existing Infrastructure

**Events:**
- ✅ `event_capacity.waitlist_enabled` — Boolean flag (already exists)
- ✅ `event_capacity.waitlist_count` — Counter (already exists)

**Products:**
- ✅ `offering_products.stock_quantity` — Inventory tracking (already exists)
- ✅ `offering_products.track_inventory` — Enable inventory tracking (already exists)

### New Tables (Migration Required)

**File:** `docs/migrations/add-waitlist-support.sql`

#### 1. `event_waitlist_entries`
Tracks customers waiting for sold-out events.

**Key Fields:**
- `offering_event_id` — Which event they're waiting for
- `customer_email`, `customer_name`, `customer_phone` — Contact info
- `spaces_requested` — How many spaces they need
- `status` — waiting, notified, converted, expired, cancelled
- `notified_at`, `expires_at` — Notification tracking

#### 2. `product_waitlist_entries`
Tracks customers waiting for out-of-stock products.

**Key Fields:**
- `offering_product_id` — Which product they're waiting for
- `product_variant_id` — Specific variant (optional)
- `customer_email`, `customer_name` — Contact info
- `quantity_requested` — How many units they want
- `status` — waiting, notified, converted, expired, cancelled
- `notified_at`, `expires_at` — Notification tracking

#### 3. New Column: `offering_products.waitlist_enabled`
Boolean flag to enable/disable waitlist for products.

---

## 2. Auto-Notification System

### Event Waitlist Workflow

**Trigger:** When a booking is cancelled

1. Check if `event_capacity.waitlist_enabled = TRUE`
2. Check if `event_capacity.spaces_available >= cancelled_booking.number_of_attendees`
3. Find first waitlist entry where `status = 'waiting'` and `spaces_requested <= spaces_available`
4. Update entry:
   - `status = 'notified'`
   - `notified_at = NOW()`
   - `expires_at = NOW() + 24 hours`
5. Send email notification (via Edge Function)
6. Customer has 24 hours to book
7. If they book: `status = 'converted'`
8. If they don't book within 24 hours: `status = 'expired'`, notify next person

**Database Trigger:** `notify_event_waitlist_on_cancellation()`

### Product Waitlist Workflow

**Trigger:** When product stock is increased

1. Check if `offering_products.waitlist_enabled = TRUE`
2. Check if `stock_quantity` increased and is now > 0
3. Update ALL waiting entries:
   - `status = 'notified'`
   - `notified_at = NOW()`
   - `expires_at = NOW() + 48 hours`
4. Send email notifications to all waiting customers (via Edge Function)
5. Customers have 48 hours to purchase
6. If they purchase: `status = 'converted'`
7. If stock runs out again: remaining entries stay as `waiting`

**Database Trigger:** `notify_product_waitlist_on_restock()`

### Cleanup Function

**Function:** `clean_expired_waitlist_notifications()`

- Runs periodically (e.g., every hour via cron)
- Marks expired notifications: `status = 'expired'` where `expires_at < NOW()`

---

## 3. Customer-Facing Features (Frontend)

### Event Waitlist (Public Site)

**Location:** Event detail page (`/workshops/:slug`)

**When to Show:**
- Event is published
- `event_capacity.spaces_available = 0`
- `event_capacity.waitlist_enabled = TRUE`

**UI:**
```vue
<div v-if="event.capacity.spaces_available === 0 && event.capacity.waitlist_enabled">
  <button @click="showWaitlistModal = true" class="btn-primary">
    Join Waitlist ({{ event.capacity.waitlist_count }} waiting)
  </button>
</div>

<!-- Waitlist Modal -->
<Modal v-if="showWaitlistModal">
  <h2>Join Event Waitlist</h2>
  <p>We'll notify you if a space becomes available.</p>
  
  <form @submit.prevent="joinEventWaitlist">
    <input v-model="form.name" placeholder="Your Name" required />
    <input v-model="form.email" type="email" placeholder="Email" required />
    <input v-model="form.phone" type="tel" placeholder="Phone (optional)" />
    <input v-model="form.spaces" type="number" min="1" placeholder="# of spaces" required />
    <textarea v-model="form.notes" placeholder="Message (optional)"></textarea>
    
    <button type="submit">Join Waitlist</button>
  </form>
</Modal>
```

**Submission:**
```javascript
const joinEventWaitlist = async () => {
  const { data, error } = await supabase
    .from('event_waitlist_entries')
    .insert({
      offering_event_id: event.id,
      customer_email: form.email,
      customer_name: form.name,
      customer_phone: form.phone,
      spaces_requested: form.spaces,
      notes: form.notes,
      status: 'waiting'
    })
  
  if (!error) {
    showSuccessMessage('You've been added to the waitlist!')
  }
}
```

### Product Waitlist (Public Site)

**Location:** Product detail page (`/shop/:slug`)

**When to Show:**
- Product is published
- `offering_products.stock_quantity = 0`
- `offering_products.waitlist_enabled = TRUE`

**UI:**
```vue
<div v-if="product.stock_quantity === 0 && product.waitlist_enabled">
  <button @click="showWaitlistModal = true" class="btn-secondary">
    Notify Me When Back in Stock
  </button>
</div>

<!-- Waitlist Modal -->
<Modal v-if="showWaitlistModal">
  <h2>Get Notified</h2>
  <p>We'll email you when this product is back in stock.</p>
  
  <form @submit.prevent="joinProductWaitlist">
    <input v-model="form.email" type="email" placeholder="Email" required />
    <input v-model="form.name" placeholder="Name (optional)" />
    <input v-model="form.quantity" type="number" min="1" value="1" />
    
    <button type="submit">Notify Me</button>
  </form>
</Modal>
```

---

## 4. Admin UI Components

### 4.1 Waitlist Dashboard (`/admin/waitlists`)

**Component:** `WaitlistDashboard.vue`

**Stats Cards:**
- Total active waitlist entries
- Pending notifications (status = 'notified')
- Conversion rate
- Expired notifications (last 7 days)

**Quick Lists:**
- Events with active waitlists
- Products with active waitlists
- Recent activity

### 4.2 Event Waitlist List (`/admin/waitlists/events`)

**Component:** `EventWaitlistList.vue`

**Features:**
- Table with all event waitlist entries
- Filters: event, status, date range
- Search: customer name/email
- Actions: Notify, Convert, Cancel
- Export to CSV

### 4.3 Product Waitlist List (`/admin/waitlists/products`)

**Component:** `ProductWaitlistList.vue`

**Features:**
- Table with all product waitlist entries
- Filters: product, status, date range
- Search: customer name/email
- Actions: Notify, Convert, Cancel
- Export to CSV

### 4.4 Waitlist Entry Details (`/admin/waitlists/:type/:id`)

**Component:** `WaitlistEntryDetails.vue`

**Features:**
- Entry information
- Customer details
- Notification history
- Status timeline
- Actions: Notify, Convert, Cancel, Edit Notes

---

## 5. Implementation Steps

### Step 1: Apply Database Migration ✅ READY

1. Go to Supabase Dashboard → SQL Editor
2. Open `docs/migrations/add-waitlist-support.sql`
3. Copy and paste entire file
4. Run the migration
5. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('event_waitlist_entries', 'product_waitlist_entries');
   ```

### Step 2: Update Offerings Form (Admin)

Add waitlist settings to `OfferingsForm.vue`:
- For events: Checkbox to enable waitlist
- For products: Checkbox to enable waitlist
- Save `waitlist_enabled` to appropriate table

### Step 3: Build Admin Waitlist Components

1. `WaitlistDashboard.vue`
2. `EventWaitlistList.vue`
3. `ProductWaitlistList.vue`
4. `WaitlistEntryDetails.vue`

### Step 4: Add Waitlist to Public Site

1. Event detail page: "Join Waitlist" button + modal
2. Product detail page: "Notify Me" button + modal
3. Customer account page: "My Waitlists" section

### Step 5: Email Notification System

Create Supabase Edge Function to send emails:
- Event waitlist notification (24-hour window)
- Product restock notification (48-hour window)
- Listen to database changes or use pg_notify

---

## 6. Email Templates

### Event Waitlist Notification

**Subject:** Space Available for [Event Name]!

**Body:**
```
Hi [Customer Name],

Great news! A space has become available for:

[Event Name]
Date: [Event Date]
Time: [Event Time]
Location: [Location]

You have 24 hours to book your spot:
[Book Now Button/Link]

This offer expires on [Expiry Date/Time].

Questions? Reply to this email.

Best,
Lola As One Team
```

### Product Restock Notification

**Subject:** [Product Name] is Back in Stock!

**Body:**
```
Hi [Customer Name],

The product you were waiting for is back in stock:

[Product Name]
Price: £[Price]

[Shop Now Button/Link]

Hurry - limited quantity available!

Best,
Lola As One Team
```

---

## 7. Testing Checklist

- [ ] Apply database migration successfully
- [ ] Event waitlist: Join waitlist when event is full
- [ ] Event waitlist: Auto-notify on booking cancellation
- [ ] Event waitlist: Notification expires after 24 hours
- [ ] Product waitlist: Join waitlist when out of stock
- [ ] Product waitlist: Auto-notify on restock
- [ ] Product waitlist: Notification expires after 48 hours
- [ ] Admin: View all waitlist entries
- [ ] Admin: Manually notify customers
- [ ] Admin: Mark as converted/cancelled
- [ ] Admin: Export waitlist to CSV
- [ ] Email notifications sent correctly
- [ ] RLS policies work (customers see only their entries)

---

## Next Steps

1. **Apply the migration** (`docs/migrations/add-waitlist-support.sql`)
2. **Build admin UI components** (WaitlistDashboard, EventWaitlistList, ProductWaitlistList)
3. **Add waitlist settings** to OfferingsForm
4. **Implement public-facing waitlist** (event and product pages)
5. **Set up email notifications** (Edge Function)

Ready to implement! 🚀

