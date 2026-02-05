# Epic 6 — Admin CMS Interface

**Last Updated:** 2026-02-02
**Status:** 🚧 In Progress
**Goal:** Build complete admin dashboard for managing workshops, products, blog posts, orders, subscriptions, and event bookings.

---

## Overview

This epic covers building the admin CMS interface that allows administrators to:
- Create, edit, publish, and archive content (workshops, products, blog posts)
- Manage orders and fulfillment
- Manage customer subscriptions
- **Manage event bookings and attendees** (check-in, capacity tracking, attendee lists)
- Upload and manage images
- View analytics and quick stats
- Moderate product reviews

---

## 1. Admin Architecture

### 1.1 Admin Routes

**Base Route:** `/admin`

**Sub-routes:**
```
/admin                          → Dashboard (stats + quick links)
/admin/offerings                → All offerings listing (unified view with type filter)
/admin/offerings/new            → Create offering (select type first, then dynamic form)
/admin/offerings/:id/edit       → Edit offering (dynamic form based on type)
/admin/blog                     → Blog post listing
/admin/blog/new                 → Create blog post
/admin/blog/:id/edit            → Edit blog post
/admin/orders                   → Order listing
/admin/orders/:id               → Order details
/admin/subscriptions            → Customer subscription listing
/admin/subscriptions/:id        → Subscription details
/admin/events/bookings          → All event bookings listing
/admin/events/:id               → Event details with attendee list
/admin/events/:id/checkin       → Quick check-in interface for event day
/admin/bookings/:id             → Booking details with attendees
/admin/waitlists                → Waitlist dashboard (events + products)
/admin/waitlists/events         → Event waitlist entries
/admin/waitlists/products       → Product waitlist entries
/admin/waitlists/:type/:id      → Waitlist entry details
/admin/customers                → Customer listing
/admin/customers/:id            → Customer details
/admin/reviews                  → Review moderation
/admin/pages                    → Content pages (About, Contact, FAQs)
/admin/settings                 → Site settings
```

**Note on Offerings Management:**
The `/admin/offerings` section is a **unified interface** for managing ALL offering types:
- **event** — Workshops/Events (date, time, location, capacity)
- **product_physical** — Physical boxes (one-time purchase, inventory tracking)
- **subscription** — Subscription boxes (recurring, Stripe integration)
- **product_digital** — Digital products (gift cards, downloads, PDFs, videos)

**How it works:**
1. **List view** shows all offerings with a type filter (All, Events, Physical Products, Subscriptions, Digital Products)
2. **Create flow** starts with selecting the offering type, then shows a dynamic form with type-specific fields
3. **Edit flow** loads the offering and displays the appropriate form based on its type
4. **Type-specific fields** are shown/hidden based on the selected type

### 1.2 Admin Components

**Shared Components:**
- ✅ `AdminLayout.vue` — Sidebar navigation + header (COMPLETE)
- `AdminTable.vue` — Reusable data table with sorting/filtering
- `AdminForm.vue` — Form wrapper with validation
- ✅ `ImageUploader.vue` — Drag-and-drop image upload to Supabase Storage (COMPLETE)
- ✅ `RichTextEditor.vue` — WYSIWYG editor for blog posts and descriptions (COMPLETE)
- `StatusBadge.vue` — Visual status indicators (draft, published, etc.)
- `ConfirmDialog.vue` — Confirmation modal for delete actions

**Offerings Components (Unified):**
- ✅ `OfferingsList.vue` — List all offerings with type filter (COMPLETE)
- ✅ `OfferingsForm.vue` — Dynamic form that adapts based on offering type (COMPLETE)
- `OfferingTypeSelector.vue` — Type selection component (event, product_physical, subscription, product_digital)
- `EventFields.vue` — Event-specific fields (date, time, location, capacity)
- `ProductFields.vue` — Product-specific fields (SKU, price, inventory)
- `SubscriptionFields.vue` — Subscription-specific fields (billing interval, Stripe IDs)
- `DigitalProductFields.vue` — Digital product fields (download URL, file type, access duration)

**Blog Components:**
- ✅ `BlogList.vue` — List all blog posts with filters (COMPLETE)
- ✅ `BlogForm.vue` — Blog post editor with rich text (COMPLETE)

**Event/Booking Components:**
- `EventBookingsList.vue` — List all event bookings across all events
- `EventDetails.vue` — Event details with attendee list and capacity tracking
- `BookingDetails.vue` — Booking details with individual attendees
- `AttendeeCheckIn.vue` — Quick check-in interface for event day

**Waitlist Components:**
- `WaitlistDashboard.vue` — Overview of all waitlists (events and products)
- `EventWaitlistList.vue` — List all event waitlist entries
- `ProductWaitlistList.vue` — List all product waitlist entries
- `WaitlistEntryDetails.vue` — View/edit individual waitlist entry

**Other Feature Components:**
- `OrderDetails.vue` — Order information display
- `SubscriptionCard.vue` — Subscription status and actions

### 1.3 Data Flow Pattern

**Standard CRUD Pattern:**
1. **List View** — Fetch data from Supabase, display in table
2. **Create/Edit Form** — Form with validation
3. **Submit** — Insert/update via Supabase client
4. **Success** — Show toast notification, redirect to list
5. **Error** — Display error message, keep form open

**Image Upload Flow:**
1. User selects image
2. Upload to Supabase Storage bucket
3. Get public URL
4. Store URL in database field
5. Display preview

---

## 2. Offerings Management (Unified)

### 2.1 Offerings Listing (`/admin/offerings`)

**Features:**
- Table view with columns: Type Icon, Title, Type, Price, Status, Date (for events), Stock (for products), Actions
- **Type filter:** All, Events, Physical Products, Subscriptions, Digital Products
- Filter by status (draft, scheduled, published, archived)
- Search by title
- Sort by created date, title, status, type
- Quick actions: Edit, Duplicate, Archive, Delete

**Data Source:**
```sql
SELECT
  o.*,
  oe.event_date, oe.event_time, ec.max_capacity, ec.current_bookings,
  op.price_gbp, op.sku,
  ii.quantity_available,
  odp.download_url, odp.file_type
FROM offerings o
LEFT JOIN offering_events oe ON o.id = oe.offering_id
LEFT JOIN event_capacity ec ON oe.id = ec.offering_event_id
LEFT JOIN offering_products op ON o.id = op.offering_id
LEFT JOIN inventory_items ii ON op.id = ii.offering_product_id
LEFT JOIN offering_digital_products odp ON o.id = odp.offering_id
ORDER BY o.created_at DESC
```

**Type Icons:**
- 🎨 Event (workshops)
- 📦 Physical Product (boxes)
- 🔄 Subscription (recurring boxes)
- 💾 Digital Product (downloads, gift cards)

### 2.2 Offerings Form (`/admin/offerings/new`, `/admin/offerings/:id/edit`)

**Step 1: Select Offering Type** (only on create, not edit)
- Radio buttons or cards to select:
  - 🎨 **Event** — Workshops with date, time, and capacity
  - 📦 **Physical Product** — One-time purchase boxes with inventory
  - 🔄 **Subscription** — Recurring monthly boxes
  - 💾 **Digital Product** — Gift cards, downloads, PDFs, videos

**Step 2: Dynamic Form** (fields change based on type)

**Common Fields (All Types):**
- Title (required)
- Slug (auto-generated from title, editable)
- Short description (required)
- Long description (rich text)
- Featured image (upload)
- Status (draft, scheduled, published, archived)
- Scheduled publish date/time (if status = scheduled)
- Featured (checkbox)
- Meta title (optional)
- Meta description (optional)

**Type-Specific Fields:**

**If type = 'event' (Workshop):**
- Event date (required)
- Event time (required)
- Duration (minutes)
- Location/venue (required)
- Max capacity (required)
- Price (GBP, required)
- Early bird price (optional)
- Early bird deadline (optional)
- Category (dropdown: Adult, Kids, Family, Holiday, Other)
- Age group (text, e.g., "18+", "5-12")
- Difficulty level (Beginner, Intermediate, Advanced)

**If type = 'product_physical' (Physical Product):**
- SKU (auto-generated or manual)
- Price (GBP, required)
- Compare at price (optional, for sale items)
- Track inventory (checkbox)
- Quantity available (number, if tracking inventory)
- Low stock threshold (number)
- Allow backorders (checkbox)
- Product variants (optional: size, color, etc.)
- Categories (multi-select: Classic Collection, Sale Items, etc.)

**If type = 'subscription' (Subscription Product):**
- SKU (auto-generated or manual)
- Price (GBP, required — monthly amount)
- Billing interval (month, year)
- Stripe product ID (auto-created or manual)
- Stripe price ID (auto-created or manual)
- Description of what's included in the box
- Categories (multi-select)

**If type = 'product_digital' (Digital Product):**
- Price (GBP, required — can be 0 for free downloads)
- Digital product subtype:
  - Gift Card (Stripe native)
  - Download (PDF, video, etc.)
- For downloads:
  - Upload file to Supabase Storage
  - Download URL (auto-generated)
  - File size (auto-detected)
  - File type (auto-detected)
  - Access duration (days, e.g., 30 days access)
- For gift cards:
  - Stripe product ID
  - Available denominations (£10, £25, £50, etc.)

**Validation:**
- Title required, max 200 chars
- Slug required, unique, URL-safe
- Price must be >= 0
- Type-specific validation:
  - Events: date must be in future, capacity > 0
  - Physical products: if tracking inventory, quantity required
  - Subscriptions: billing interval required, Stripe IDs required
  - Digital downloads: file upload required

**Actions:**
- Save as Draft
- Publish Now
- Schedule for Later
- Cancel (return to list)

---

## 3. Blog Management ✅ COMPLETE

### 3.1 Blog Listing (`/admin/blog`) ✅

**Status:** ✅ **COMPLETE** - `BlogList.vue` implemented

**Features:**
- ✅ Responsive dual-view (desktop table, mobile cards)
- ✅ Table view: Featured Image, Title, Author, Published Date, Status, Actions
- ✅ Filter by status (draft, published, archived)
- ✅ Search by title, excerpt, or slug
- ✅ Sort by published date, title
- ✅ Quick actions: Edit, Delete (with confirmation)
- ✅ Empty states and loading states

### 3.2 Blog Post Form (`/admin/blog/new`, `/admin/blog/:id/edit`) ✅

**Status:** ✅ **COMPLETE** - `BlogForm.vue` implemented

**Fields:**
- ✅ Title (required) with auto-slug generation
- ✅ Slug (auto-generated, editable)
- ✅ Excerpt (short summary, 200 char limit with counter)
- ✅ Body (rich text editor using Tiptap)
- ✅ Featured image (ImageUploader integration)
- ✅ Author name (text, for guest authors)
- ✅ Author bio (textarea)
- ✅ Author image (ImageUploader integration)
- ✅ Status (draft, published, archived)
- ✅ Published date/time (datetime-local picker)
- ✅ Meta title (60 char limit with counter)
- ✅ Meta description (160 char limit with counter)
- ✅ Comprehensive form validation
- ✅ Error handling with dismissible alerts
- ✅ Loading states during save

### 3.3 Rich Text Editor Component ✅

**Status:** ✅ **COMPLETE** - `RichTextEditor.vue` implemented

**Features:**
- ✅ Tiptap-based WYSIWYG editor
- ✅ Toolbar with formatting buttons:
  - Bold, Italic, Strikethrough
  - Headings (H2, H3)
  - Bullet lists, Numbered lists
  - Blockquote
  - Link management (add/remove with prompt)
  - Undo/Redo
- ✅ v-model support for two-way binding
- ✅ Placeholder text support
- ✅ Active state highlighting for toolbar buttons
- ✅ Prose styling for clean content display

**Packages Installed:**
- ✅ `@tiptap/vue-3`
- ✅ `@tiptap/starter-kit`
- ✅ `@tiptap/extension-link`
- ✅ `@tiptap/extension-placeholder`

---

## 4. Event/Workshop Attendee Management

### 4.1 Overview

**Database Tables:**
- `offering_events` — Event details (date, time, location, capacity, price)
- `event_capacity` — Real-time capacity tracking with auto-calculated available spaces
- `event_capacity_holds` — Temporary reservations during checkout
- `bookings` — Event bookings (linked to orders, customer info, number_of_attendees, status)
- `booking_attendees` — Individual attendee details (first_name, last_name, email, phone, notes)

**Database Triggers:**
- Auto-update `event_capacity.spaces_booked` when bookings are created or cancelled
- Capacity validation to prevent overbooking

### 4.2 Event Bookings List (`/admin/events/bookings`)

**Component:** `EventBookingsList.vue`

**Purpose:** Master list of all event bookings across all events

**Features:**
- **Stats Cards:**
  - Total bookings
  - Total attendees
  - Upcoming events count
  - Cancellation rate

- **Table view with columns:**
  - Event name and date
  - Customer name and email
  - Number of attendees
  - Booking status (confirmed, cancelled, no_show)
  - Order number (link to order details)
  - Booking date
  - Actions (View Details, Check In, Cancel, Mark No-Show)

- **Filters:**
  - Filter by event (dropdown of all events)
  - Filter by status (confirmed, cancelled, no_show)
  - Filter by date range
  - Search by customer name or email

- **Quick Actions:**
  - Export attendee list (CSV)
  - Send reminder emails
  - Bulk check-in

**Data Query:**
```javascript
const { data: bookings } = await supabase
  .from('bookings')
  .select(`
    *,
    offering_event:offering_events(
      *,
      offering:offerings(title, slug, featured_image_url)
    ),
    customer:customers(first_name, last_name, email, phone),
    order:orders(order_number, total_gbp, payment_status)
  `)
  .order('created_at', { ascending: false })
```

### 4.3 Event Details (`/admin/events/:id`)

**Component:** `EventDetails.vue`

**Purpose:** Single event view with attendee list and capacity tracking

**Features:**

**Event Information Section:**
- Event title, date, time
- Location details (name, address, city, postcode)
- Description
- Featured image
- Price

**Capacity Tracking Section:**
- Visual progress bar showing capacity utilization
- Total capacity
- Spaces booked
- Spaces reserved (currently in checkout)
- Spaces available (auto-calculated)
- Waitlist count (if waitlist enabled)

**Attendee List Section:**
- Table of all bookings for this event
- Columns: Customer, # Attendees, Status, Check-in Status, Actions
- Expandable rows to show individual attendee details from `booking_attendees`
- Check-in checkboxes
- Filter by check-in status (all, checked-in, not checked-in)

**Actions:**
- Export attendee list (CSV with all attendee details)
- Print attendee list
- Send event reminder to all attendees
- Edit event details (link to offerings form)

**Data Query:**
```javascript
// Get event with capacity
const { data: event } = await supabase
  .from('offering_events')
  .select(`
    *,
    offering:offerings(*),
    capacity:event_capacity(*)
  `)
  .eq('id', eventId)
  .single()

// Get all bookings for this event
const { data: bookings } = await supabase
  .from('bookings')
  .select(`
    *,
    customer:customers(*),
    order:orders(order_number, payment_status),
    attendees:booking_attendees(*)
  `)
  .eq('offering_event_id', eventId)
  .order('created_at', { ascending: false })
```

### 4.4 Booking Details (`/admin/bookings/:id`)

**Component:** `BookingDetails.vue`

**Purpose:** Detailed view of a single booking with all attendees

**Features:**

**Booking Information:**
- Booking ID and date
- Event name, date, time, location
- Customer name, email, phone
- Order number (link to order)
- Payment status
- Booking status (confirmed, cancelled, no_show)
- Number of attendees

**Attendee List:**
- Table of all attendees for this booking
- Columns: Name, Email, Phone, Notes, Check-in Status
- Editable attendee information
- Add/remove attendees (if capacity allows)

**Actions:**
- Mark all as checked in
- Cancel booking (with refund option)
- Mark as no-show
- Send confirmation email
- Edit attendee details

**Data Query:**
```javascript
const { data: booking } = await supabase
  .from('bookings')
  .select(`
    *,
    offering_event:offering_events(
      *,
      offering:offerings(*)
    ),
    customer:customers(*),
    order:orders(*),
    attendees:booking_attendees(*)
  `)
  .eq('id', bookingId)
  .single()
```

### 4.5 Attendee Check-In (`/admin/events/:id/checkin`)

**Component:** `AttendeeCheckIn.vue`

**Purpose:** Quick check-in interface for event day

**Features:**

**Search Bar:**
- Search by name, email, or booking number
- Real-time filtering as you type
- Large, touch-friendly input

**Check-in List:**
- Large, touch-friendly cards for each booking
- Shows customer name, # attendees, check-in status
- One-tap check-in button
- Visual confirmation (green checkmark animation)
- Color coding:
  - Green: Checked in
  - Gray: Not checked in
  - Red: Cancelled/No-show

**Stats:**
- Checked in / Total attendees
- Progress bar
- Time-based stats (checked in last hour, etc.)

**Offline Support (Future v2):**
- Cache attendee list for offline check-in
- Sync when back online

---

## 5. Waitlist Management

### 5.1 Overview

**Purpose:** Manage customer waitlists for sold-out events and out-of-stock products

**Database Tables:**
- `event_waitlist_entries` — Customers waiting for sold-out events
- `product_waitlist_entries` — Customers waiting for out-of-stock products
- `event_capacity.waitlist_enabled` — Enable/disable waitlist for events
- `offering_products.waitlist_enabled` — Enable/disable waitlist for products

**Auto-Notification System:**
- When event booking is cancelled → Notify first person on waitlist (24-hour window)
- When product is restocked → Notify all waiting customers (48-hour window)
- Expired notifications automatically marked as 'expired'

**Waitlist Entry Statuses:**
- `waiting` — Customer is on the waitlist
- `notified` — Customer has been notified of availability
- `converted` — Customer successfully booked/purchased
- `expired` — Notification window expired without action
- `cancelled` — Customer cancelled their waitlist entry

### 5.2 Waitlist Dashboard (`/admin/waitlists`)

**Component:** `WaitlistDashboard.vue`

**Purpose:** Overview of all waitlists across events and products

**Features:**

**Stats Cards:**
- Total active waitlist entries (events + products)
- Pending notifications (status = 'notified')
- Conversion rate (converted / total notified)
- Expired notifications (last 7 days)

**Quick Lists:**
- **Events with Active Waitlists:**
  - Event name and date
  - Waitlist count
  - Spaces available
  - Action: View Waitlist

- **Products with Active Waitlists:**
  - Product name and SKU
  - Waitlist count
  - Stock quantity
  - Action: View Waitlist

**Recent Activity:**
- Latest waitlist entries (last 24 hours)
- Recent conversions
- Recent expirations

### 5.3 Event Waitlist List (`/admin/waitlists/events`)

**Component:** `EventWaitlistList.vue`

**Purpose:** List all event waitlist entries

**Features:**

**Table view with columns:**
- Event name and date
- Customer name and email
- Spaces requested
- Status (waiting, notified, converted, expired, cancelled)
- Joined date
- Notified date (if applicable)
- Expires date (if notified)
- Actions (Notify, Convert, Cancel, View Details)

**Filters:**
- Filter by event (dropdown)
- Filter by status (all, waiting, notified, converted, expired, cancelled)
- Filter by date range (joined date)
- Search by customer name or email

**Bulk Actions:**
- Notify selected entries (manual notification)
- Export to CSV
- Cancel selected entries

**Manual Actions:**
- **Notify Customer** — Manually send notification (updates status to 'notified')
- **Mark as Converted** — When customer books through other means
- **Cancel Entry** — Remove from waitlist

**Data Query:**
```javascript
const { data: waitlistEntries } = await supabase
  .from('event_waitlist_entries')
  .select(`
    *,
    offering_event:offering_events(
      *,
      offering:offerings(title, slug, featured_image_url),
      capacity:event_capacity(*)
    ),
    customer:customers(*)
  `)
  .order('created_at', { ascending: false })
```

### 5.4 Product Waitlist List (`/admin/waitlists/products`)

**Component:** `ProductWaitlistList.vue`

**Purpose:** List all product waitlist entries

**Features:**

**Table view with columns:**
- Product name and SKU
- Variant (if applicable)
- Customer name and email
- Quantity requested
- Status (waiting, notified, converted, expired, cancelled)
- Joined date
- Notified date (if applicable)
- Expires date (if notified)
- Actions (Notify, Convert, Cancel, View Details)

**Filters:**
- Filter by product (dropdown)
- Filter by status (all, waiting, notified, converted, expired, cancelled)
- Filter by date range (joined date)
- Search by customer name or email

**Bulk Actions:**
- Notify selected entries (manual notification)
- Export to CSV
- Cancel selected entries

**Manual Actions:**
- **Notify Customer** — Manually send "back in stock" notification
- **Mark as Converted** — When customer purchases
- **Cancel Entry** — Remove from waitlist

**Data Query:**
```javascript
const { data: waitlistEntries } = await supabase
  .from('product_waitlist_entries')
  .select(`
    *,
    offering_product:offering_products(
      *,
      offering:offerings(title, slug, featured_image_url)
    ),
    product_variant:product_variants(*),
    customer:customers(*)
  `)
  .order('created_at', { ascending: false })
```

### 5.5 Waitlist Entry Details (`/admin/waitlists/:type/:id`)

**Component:** `WaitlistEntryDetails.vue`

**Purpose:** View and manage individual waitlist entry

**Features:**

**Entry Information:**
- Entry ID and status
- Created date
- Event/Product details (name, date/SKU, image)
- Customer information (name, email, phone)
- Spaces/Quantity requested
- Notes (customer message or admin notes)

**Notification History:**
- Notified date (if applicable)
- Expires date (if applicable)
- Time remaining until expiration
- Email sent status

**Actions:**
- **Send Notification** — Manually notify customer
- **Mark as Converted** — Customer successfully booked/purchased
- **Cancel Entry** — Remove from waitlist
- **Edit Notes** — Add admin notes
- **Contact Customer** — Quick email link

**Status Timeline:**
- Created → Waiting
- Notified (with timestamp)
- Converted/Expired/Cancelled (with timestamp)

### 5.6 Waitlist Settings (in Event/Product Forms)

**In EventDetails.vue / OfferingsForm.vue:**

**Event Waitlist Settings:**
- ✅ Enable Waitlist (checkbox)
- Notification window (hours, default: 24)
- Auto-notify on cancellation (checkbox, default: true)

**Product Waitlist Settings:**
- ✅ Enable Waitlist (checkbox)
- Notification window (hours, default: 48)
- Auto-notify on restock (checkbox, default: true)

**Display in Forms:**
```vue
<!-- Event Waitlist Settings -->
<div v-if="form.type === 'event'" class="space-y-4">
  <h3>Waitlist Settings</h3>

  <label class="flex items-center">
    <input type="checkbox" v-model="form.waitlist_enabled" />
    <span>Enable waitlist when event is full</span>
  </label>

  <div v-if="form.waitlist_enabled">
    <label>Notification window (hours)</label>
    <input type="number" v-model="form.notification_window_hours" min="1" max="72" />
    <p class="text-sm text-gray-500">
      How long customers have to book after being notified
    </p>
  </div>
</div>
```

---

## 6. Order Management

### 6.1 Order Listing (`/admin/orders`)

**Features:**
- Table view: Order #, Customer, Date, Total, Status, Actions
- Filter by status (pending, paid, fulfilled, cancelled, refunded)
- Filter by order type (one_time, subscription_initial, subscription_renewal)
- Search by order number or customer email
- Date range filter
- Sort by date, total, status
- Quick actions: View Details, Mark Fulfilled

### 6.2 Order Details (`/admin/orders/:id`)

**Display:**
- Order number and date
- Customer information (name, email, phone)
- Shipping address
- Order items (product/workshop, quantity, price)
- Subtotal, shipping, tax, total
- Payment status and Stripe payment intent ID
- Fulfillment status
- Order timeline (created, paid, fulfilled)

**Actions:**
- Mark as Fulfilled (if status = paid)
- View in Stripe Dashboard (link)
- Send confirmation email (manual trigger)
- Print packing slip

---

## 7. Subscription Management

### 7.1 Subscription Listing (`/admin/subscriptions`)

**Features:**
- Table view: Customer, Product, Status, Next Billing, Amount, Actions
- Filter by status (active, paused, cancelled, past_due)
- Search by customer email
- Sort by next billing date, amount
- Quick actions: View Details, Pause, Resume, Cancel

### 7.2 Subscription Details (`/admin/subscriptions/:id`)

**Display:**
- Customer information
- Subscription product
- Billing interval and amount
- Current period (start/end dates)
- Next billing date
- Status and status history
- Payment history (all renewal orders)
- Stripe subscription ID (link to Stripe)

**Actions:**
- Pause subscription (set pause date)
- Resume subscription
- Cancel subscription
- Update billing date (via Stripe)
- View customer account

---

## Acceptance Criteria

### Core Features (v1)
- [x] **Admin Layout** — Sidebar navigation with responsive mobile menu ✅
- [ ] Admin dashboard with quick stats (orders, subscriptions, offerings, low stock)
- [x] **Unified Offerings CRUD** (create, read, update, delete/archive for ALL offering types) ✅
  - [x] Offerings listing with type filter (All, Events, Physical Products, Subscriptions, Digital Products) ✅
  - [x] Type selector on create (event, product_physical, subscription, product_digital) ✅
  - [x] Dynamic form that shows/hides fields based on offering type ✅
  - [x] Event-specific fields (date, time, location, capacity) ✅
  - [x] Physical product fields (SKU, inventory, variants) ✅
  - [x] Subscription fields (billing interval, Stripe integration) ✅
  - [x] Digital product fields (file upload, download URL, access duration) ✅
  - [x] Form validation and error handling ✅
  - [x] Auto-slug generation ✅
  - [x] Edit mode data loading ✅
- [x] **Blog post CRUD with rich text editor** ✅
  - [x] BlogList.vue with filters and search ✅
  - [x] BlogForm.vue with create/edit modes ✅
  - [x] RichTextEditor component (Tiptap-based) ✅
  - [x] Image upload integration for featured images and author images ✅
  - [x] Auto-slug generation ✅
  - [x] Form validation and error handling ✅
- [ ] **Event/Workshop Attendee Management**
  - [ ] EventBookingsList.vue — List all event bookings
  - [ ] EventDetails.vue — Event details with attendee list and capacity tracking
  - [ ] BookingDetails.vue — Booking details with individual attendees
  - [ ] AttendeeCheckIn.vue — Quick check-in interface for event day
  - [ ] Export attendee lists (CSV)
  - [ ] Send reminder emails to attendees
- [ ] **Waitlist Management**
  - [ ] Database migration for waitlist tables (event_waitlist_entries, product_waitlist_entries)
  - [ ] WaitlistDashboard.vue — Overview of all waitlists
  - [ ] EventWaitlistList.vue — List event waitlist entries
  - [ ] ProductWaitlistList.vue — List product waitlist entries
  - [ ] WaitlistEntryDetails.vue — View/edit individual waitlist entry
  - [ ] Auto-notification triggers (event cancellation, product restock)
  - [ ] Manual notification actions
  - [ ] Waitlist settings in event/product forms
  - [ ] Export waitlist entries (CSV)
- [ ] Order listing and details view
- [ ] Subscription listing and details view
- [x] **Image upload to Supabase Storage** ✅
  - [x] ImageUploader component with drag-and-drop ✅
  - [x] Integration with three buckets (product-images, blog-images, workshop-images) ✅
  - [x] Image preview with remove functionality ✅
  - [x] File validation (type and size) ✅
- [x] Status management (draft, published, archived) ✅
- [x] Search and filtering on list views (Offerings, Blog) ✅
- [x] Form validation and error handling (Offerings, Blog) ✅
- [ ] Success/error toast notifications
- [x] Admin-only route protection ✅

### Optional/Future (v2)
- [ ] Bulk actions (publish/archive multiple items)
- [ ] Product variants management (advanced)
- [ ] Review moderation interface
- [ ] Customer management
- [ ] Content pages editor
- [ ] Site settings
- [ ] Analytics dashboard
- [ ] Export data (CSV)

---

## Next Steps

After completing Epic 6, proceed to:
- **Epic 7:** Public Frontend Pages (replace placeholders with real data)
- **Epic 8:** Checkout + Payment Flows (Stripe integration)
- **Epic 9:** Testing + Launch



