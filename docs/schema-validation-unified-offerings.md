# Schema Validation for Unified Offerings Approach

**Date:** 2026-02-01  
**Status:** ✅ VALIDATED — Schema fully supports unified offerings interface

---

## Summary

The existing database schema is **perfectly designed** to support the unified offerings management interface. No schema changes are required.

---

## ✅ Schema Compatibility Analysis

### 1. Core Offerings Table

**Table:** `offerings`

**Type Field:**
```sql
type TEXT NOT NULL CHECK (type IN ('event', 'product_physical', 'product_digital', 'subscription'))
```

✅ **Perfect!** The type field supports all four offering types we need:
- `event` — Workshops/Events
- `product_physical` — Physical boxes (one-time purchase)
- `product_digital` — Digital products (downloads, gift cards)
- `subscription` — Subscription boxes (recurring)

**Common Fields (All Types):**
- ✅ `title`, `slug`, `description_short`, `description_long`
- ✅ `featured_image_url`
- ✅ `status` (draft, scheduled, published, archived)
- ✅ `scheduled_publish_at`, `published_at`
- ✅ `featured` (boolean)
- ✅ `metadata` (JSONB for flexible type-specific data)
- ✅ `meta_title`, `meta_description` (SEO)
- ✅ `created_by`, `updated_by` (audit trail)

**Indexes:**
- ✅ `idx_offerings_type` — Fast filtering by type
- ✅ `idx_offerings_status` — Fast filtering by status
- ✅ `idx_offerings_slug` — Fast lookups by slug
- ✅ `idx_offerings_featured` — Fast featured content queries

---

### 2. Type-Specific Extension Tables

#### **Events: `offering_events`**

✅ **One-to-one relationship** with `offerings` via `UNIQUE(offering_id)`

**Fields:**
- ✅ `event_date`, `event_start_time`, `event_end_time`
- ✅ `location_name`, `location_address`, `location_city`, `location_postcode`
- ✅ `max_capacity`, `current_bookings`
- ✅ `price_gbp`, `vat_rate`

**Indexes:**
- ✅ `idx_offering_events_date` — Sort/filter by date
- ✅ `idx_offering_events_capacity` — Check availability

---

#### **Physical Products: `offering_products`**

✅ **One-to-one relationship** with `offerings` via `UNIQUE(offering_id)`

**Fields:**
- ✅ `sku` (unique)
- ✅ `price_gbp`, `vat_rate`
- ✅ `track_inventory`, `stock_quantity`, `low_stock_threshold`
- ✅ `requires_shipping`, `weight_grams`
- ✅ `available_for_subscription` — Flag for subscription-eligible products

**Indexes:**
- ✅ `idx_offering_products_sku` — Fast SKU lookups
- ✅ `idx_offering_products_stock` — Low stock alerts
- ✅ `idx_offering_products_subscription` — Filter subscription products

**Note:** Both `product_physical` AND `subscription` types use this table!
- `product_physical` → `available_for_subscription = FALSE`
- `subscription` → `available_for_subscription = TRUE`

---

#### **Digital Products: `offering_digital_products`**

✅ **One-to-one relationship** with `offerings` via `UNIQUE(offering_id)`

**Fields:**
- ✅ `product_type` (gift_card, download)
- ✅ `price_gbp`, `vat_rate`
- ✅ `file_url`, `file_size_bytes`, `file_type`
- ✅ `download_limit`, `download_expiry_days`
- ✅ `stripe_product_id` (for gift cards)

**Indexes:**
- ✅ `idx_offering_digital_products_type` — Filter by subtype

---

### 3. Unified Query Pattern

**Fetch all offerings with type-specific data:**

```sql
SELECT 
  o.*,
  oe.event_date, oe.event_start_time, oe.max_capacity, oe.current_bookings, oe.price_gbp AS event_price,
  op.sku, op.price_gbp AS product_price, op.stock_quantity, op.available_for_subscription,
  odp.product_type AS digital_type, odp.price_gbp AS digital_price, odp.file_url, odp.file_type
FROM offerings o
LEFT JOIN offering_events oe ON o.id = oe.offering_id
LEFT JOIN offering_products op ON o.id = op.offering_id
LEFT JOIN offering_digital_products odp ON o.id = odp.offering_id
WHERE o.status != 'archived'
ORDER BY o.created_at DESC;
```

**Filter by type:**
```sql
WHERE o.type = 'event'  -- Only workshops
WHERE o.type = 'product_physical'  -- Only physical products
WHERE o.type = 'subscription'  -- Only subscriptions
WHERE o.type = 'product_digital'  -- Only digital products
```

---

### 4. Create/Update Pattern

**Creating an Event:**
```sql
-- Step 1: Insert into offerings
INSERT INTO offerings (type, title, slug, description_short, status)
VALUES ('event', 'Watercolor Workshop', 'watercolor-workshop', 'Learn watercolor basics', 'draft')
RETURNING id;

-- Step 2: Insert into offering_events
INSERT INTO offering_events (offering_id, event_date, event_start_time, location_name, max_capacity, price_gbp)
VALUES ('{offering_id}', '2026-03-15', '14:00', 'Lola Creative Space', 12, 45.00);
```

**Creating a Physical Product:**
```sql
-- Step 1: Insert into offerings
INSERT INTO offerings (type, title, slug, description_short, status)
VALUES ('product_physical', 'Classic Art Box', 'classic-art-box', 'Monthly art supplies', 'draft')
RETURNING id;

-- Step 2: Insert into offering_products
INSERT INTO offering_products (offering_id, sku, price_gbp, track_inventory, stock_quantity, available_for_subscription)
VALUES ('{offering_id}', 'BOX-CLASSIC-001', 35.00, TRUE, 50, FALSE);
```

**Creating a Subscription Product:**
```sql
-- Step 1: Insert into offerings
INSERT INTO offerings (type, title, slug, description_short, status)
VALUES ('subscription', 'Monthly Art Box Subscription', 'monthly-art-box', 'Recurring monthly box', 'published')
RETURNING id;

-- Step 2: Insert into offering_products (with subscription flag)
INSERT INTO offering_products (offering_id, sku, price_gbp, available_for_subscription)
VALUES ('{offering_id}', 'SUB-MONTHLY-001', 30.00, TRUE);
```

**Creating a Digital Product:**
```sql
-- Step 1: Insert into offerings
INSERT INTO offerings (type, title, slug, description_short, status)
VALUES ('product_digital', 'Beginner Watercolor PDF Guide', 'watercolor-guide-pdf', 'Downloadable guide', 'published')
RETURNING id;

-- Step 2: Insert into offering_digital_products
INSERT INTO offering_digital_products (offering_id, product_type, price_gbp, file_url, file_type, download_expiry_days)
VALUES ('{offering_id}', 'download', 9.99, 'https://...storage.../guide.pdf', 'application/pdf', 30);
```

---

## ✅ Validation Results

### Schema Supports:
- ✅ All four offering types (event, product_physical, subscription, product_digital)
- ✅ Unified listing with LEFT JOINs
- ✅ Type filtering via `offerings.type`
- ✅ Type-specific fields in extension tables
- ✅ One-to-one relationships (UNIQUE constraints)
- ✅ Cascade deletes (ON DELETE CASCADE)
- ✅ Proper indexing for performance
- ✅ Row Level Security (RLS) for admin access

### No Schema Changes Required:
- ✅ No new tables needed
- ✅ No new columns needed
- ✅ No constraint changes needed
- ✅ No index changes needed

---

## 🎯 Conclusion

**The schema is 100% ready for the unified offerings interface!**

You can proceed with building the admin interface without any database migrations. The polymorphic design with type-specific extension tables is exactly what we need.


