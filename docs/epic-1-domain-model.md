# Epic 1 — Unified Domain Model

**Last Updated:** 2026-01-31  
**Status:** 🚧 In Progress

---

## Purpose

Design a unified database schema that supports:
- ✅ CMS content management (offerings, events, products, digital products)
- ✅ Commerce transactions (orders, payments, fulfillments)
- ✅ Subscriptions (recurring billing, pause/resume/cancel)
- ✅ Customer accounts (authentication, order history, subscription management)
- ✅ Inventory management (stock tracking, capacity management)
- ✅ Digital products (gift cards, downloads, access control)

---

## Core Principles

1. **Unified offerings model** — Events, products (physical + digital), and subscriptions share a common content shell
2. **Supabase-native** — Leverage PostgreSQL, Row Level Security (RLS), and Supabase Auth
3. **Stripe-driven commerce** — Orders created via webhooks, payments reference Stripe IDs
4. **Auditable inventory** — Track all stock movements for accountability
5. **Subscription-first** — Support existing subscription functionality (pause/resume/cancel)

---

## Tech Stack (Confirmed)

- **Database:** Supabase (PostgreSQL 15+)
- **Authentication:** Supabase Auth (email/password)
- **File Storage:** Supabase Storage (product images, digital downloads)
- **Payments:** Stripe (Checkout + Subscriptions)
- **Frontend:** Vue 3 + Tailwind CSS
- **Email:** Nodemailer (migrating from Firebase Functions to Supabase Edge Functions)

---

## Database Schema Overview

### CMS Tables
- `offerings` — Shared content shell (title, slug, images, status, SEO, metadata JSONB)
- `offering_events` — Event-specific fields (date, time, location, capacity)
- `offering_products` — Product-specific fields (SKU, stock, price, type)
- `offering_digital_products` — Digital product fields (file URL, download limits)
- `product_variants` — Product variants (e.g., "Sketchbook" vs "Sketchbook + Paints")
- `product_reviews` — Customer reviews and ratings (v1)
- `categories` — Predefined categories (reused for products, blog posts, offerings)
- `tags` — Free-form tags
- `offering_categories` — Many-to-many join (offerings ↔ categories)
- `offering_tags` — Many-to-many join (offerings ↔ tags)
- `product_categories` — Many-to-many join (products ↔ categories for collections)
- `blog_posts` — Blog posts (separate from static content pages)
- `blog_post_categories` — Many-to-many join (blog posts ↔ categories)
- `blog_post_tags` — Many-to-many join (blog posts ↔ tags)
- `navigation_items` — Admin-managed navigation
- `site_sections` — Homepage/featured content control
- `content_pages` — Static CMS pages (About, Contact, FAQs, Policies)
- `url_redirects` — SEO preservation (old URL → new URL mapping)

### Commerce Tables
- `customers` — Customer accounts (links to Supabase Auth users)
- `carts` — Shopping cart sessions (optional, can use localStorage)
- `cart_items` — Items in cart
- `orders` — Completed orders
- `order_items` — Line items in orders
- `payments` — Stripe payment references
- `fulfillments` — Shipping/delivery tracking
- `refunds` — Refund records (optional v1)

### Subscription Tables
- `subscriptions` — Stripe subscription records
- `subscription_items` — Line items in subscriptions
- `subscription_events` — Audit log (paused, resumed, cancelled)
- `subscription_invoices` — Billing history (synced from Stripe)

### Inventory Tables
- `inventory_items` — Stock by SKU (physical products + subscription boxes)
- `inventory_movements` — Auditable stock changes

### Ingredient-Level Stock Control (v2)
- `box_components` — Individual components/ingredients that make up boxes
- `component_inventory` — Stock levels for components
- `component_movements` — Audit trail for component stock changes
- `box_recipes` — Bill of materials (what components make up each box)
- `box_assemblies` — Track when boxes are assembled from components

### Event Capacity Management
- `event_capacity` — Track available spaces for workshops/events
- `event_capacity_holds` — Temporarily reserve spaces during checkout (v1)

### Event Booking Tables
- `bookings` — Event bookings (linked to orders)
- `booking_attendees` — Attendee details (v1)

### Digital Product Tables
- `digital_downloads` — Download access records
- `download_links` — Time-limited download URLs

---

## Detailed Schema

### 1. CMS Tables

#### `offerings`
**Purpose:** Shared content shell for all offering types (events, products, digital products)

**Workshop Categories in metadata JSONB:**
- Workshop categories (Open Studio, Little Ones, Adult, Holiday, Other Age Groups) are stored in the `metadata` JSONB field
- Example: `{"category": "Adult", "age_group": "18+", "difficulty": "Beginner"}`
- This allows flexible categorization without creating a separate table

```sql
CREATE TABLE offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('event', 'product_physical', 'product_digital', 'subscription')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_short TEXT,
  description_long TEXT,
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  scheduled_publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- Flexible field for type-specific data (workshop categories, product collections, etc.)

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_offerings_type ON offerings(type);
CREATE INDEX idx_offerings_status ON offerings(status);
CREATE INDEX idx_offerings_slug ON offerings(slug);
CREATE INDEX idx_offerings_featured ON offerings(featured) WHERE featured = TRUE;
```

#### `offering_events`
**Purpose:** Event-specific fields (extends `offerings`)

```sql
CREATE TABLE offering_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  
  -- Event details
  event_date DATE NOT NULL,
  event_start_time TIME NOT NULL,
  event_end_time TIME,
  location_name TEXT,
  location_address TEXT,
  location_city TEXT,
  location_postcode TEXT,
  
  -- Capacity
  max_capacity INTEGER NOT NULL,
  current_bookings INTEGER DEFAULT 0,
  
  -- Pricing
  price_gbp DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_offering_event UNIQUE(offering_id)
);

CREATE INDEX idx_offering_events_date ON offering_events(event_date);
CREATE INDEX idx_offering_events_capacity ON offering_events(max_capacity, current_bookings);
```

#### `offering_products`
**Purpose:** Product-specific fields (physical boxes, extends `offerings`)

```sql
CREATE TABLE offering_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,

  -- Product details
  sku TEXT NOT NULL UNIQUE,
  price_gbp DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,

  -- Inventory
  track_inventory BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,

  -- Shipping
  requires_shipping BOOLEAN DEFAULT TRUE,
  weight_grams INTEGER,

  -- Subscription eligibility
  available_for_subscription BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_offering_product UNIQUE(offering_id)
);

CREATE INDEX idx_offering_products_sku ON offering_products(sku);
CREATE INDEX idx_offering_products_stock ON offering_products(stock_quantity);
CREATE INDEX idx_offering_products_subscription ON offering_products(available_for_subscription) WHERE available_for_subscription = TRUE;
```

#### `offering_digital_products`
**Purpose:** Digital product fields (gift cards, downloads, extends `offerings`)

```sql
CREATE TABLE offering_digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,

  -- Digital product details
  product_type TEXT NOT NULL CHECK (product_type IN ('gift_card', 'download')),
  price_gbp DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,

  -- For downloads
  file_url TEXT, -- Supabase Storage URL
  file_size_bytes BIGINT,
  file_type TEXT, -- 'pdf', 'video', 'audio', etc.

  -- Access control
  download_limit INTEGER, -- NULL = unlimited (v2)
  download_expiry_days INTEGER, -- NULL = never expires (v2)

  -- For gift cards
  stripe_product_id TEXT, -- Stripe handles gift card logic

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_offering_digital_product UNIQUE(offering_id)
);

CREATE INDEX idx_offering_digital_products_type ON offering_digital_products(product_type);
```

#### `categories`
**Purpose:** Predefined categories for offerings

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
```

#### `tags`
**Purpose:** Free-form tags for offerings

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);
```

#### `offering_categories`
**Purpose:** Many-to-many join between offerings and categories

```sql
CREATE TABLE offering_categories (
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,

  PRIMARY KEY (offering_id, category_id)
);

CREATE INDEX idx_offering_categories_offering ON offering_categories(offering_id);
CREATE INDEX idx_offering_categories_category ON offering_categories(category_id);
```

#### `offering_tags`
**Purpose:** Many-to-many join between offerings and tags

```sql
CREATE TABLE offering_tags (
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (offering_id, tag_id)
);

CREATE INDEX idx_offering_tags_offering ON offering_tags(offering_id);
CREATE INDEX idx_offering_tags_tag ON offering_tags(tag_id);
```

#### `navigation_items`
**Purpose:** Admin-managed navigation menu

```sql
CREATE TABLE navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_navigation_items_parent ON navigation_items(parent_id);
CREATE INDEX idx_navigation_items_order ON navigation_items(display_order);
```

#### `site_sections`
**Purpose:** Homepage/featured content control

```sql
CREATE TABLE site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE, -- 'homepage_hero', 'featured_products', etc.
  title TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  config JSONB, -- Flexible config (e.g., max items, layout)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_sections_key ON site_sections(section_key);
CREATE INDEX idx_site_sections_active ON site_sections(is_active) WHERE is_active = TRUE;
```

#### `content_pages`
**Purpose:** Static CMS pages (About, Contact, FAQs, Policies, etc.)

```sql
CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,

  -- Hero section
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image_url TEXT,
  hero_cta_text TEXT,
  hero_cta_url TEXT,

  -- Content
  body JSONB, -- Rich text content (structured blocks)

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_content_pages_slug ON content_pages(slug);
CREATE INDEX idx_content_pages_status ON content_pages(status);
```

**Example pages:**
- `/about` — About Lola As One
- `/contact` — Contact form
- `/faqs` — Frequently asked questions
- `/privacy-policy` — Privacy policy
- `/terms-and-conditions` — Terms and conditions
- `/returns-policy` — Returns and refunds
- `/shipping-policy` — Shipping information

#### `blog_posts`
**Purpose:** Blog posts (separate from static content pages)

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body JSONB, -- Rich text content (structured blocks)
  featured_image_url TEXT,

  -- Guest author attribution
  author_name TEXT,
  author_bio TEXT,
  author_image_url TEXT,

  -- Publishing
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
```

**Key Features:**
- Separate from static `content_pages` for better organization
- Guest author attribution (author_name, author_bio, author_image_url)
- Categories and tags via join tables (`blog_post_categories`, `blog_post_tags`)
- Rich text content stored as JSONB (structured blocks)

**Example blog posts from Lots of Lovely Art:**
- Artist features (e.g., "Meet the Artist: Jane Doe")
- Tutorials (e.g., "How to Paint Watercolour Landscapes")
- Book recommendations (e.g., "5 Best Art Books for Kids")
- Educational content (e.g., "Understanding Colour Theory")

#### `product_variants`
**Purpose:** Product variants (e.g., "Sketchbook" vs "Sketchbook + Paints")

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_product_id UUID NOT NULL REFERENCES offering_products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL, -- e.g., "With Paints", "Without Paints", "Large", "Small"
  sku TEXT NOT NULL UNIQUE,
  price_gbp DECIMAL(10,2) NOT NULL,
  price_difference_gbp DECIMAL(10,2) DEFAULT 0, -- Difference from base product price
  stock_quantity INTEGER DEFAULT 0,
  weight_grams INTEGER,
  is_default BOOLEAN DEFAULT FALSE, -- Mark the default variant
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product ON product_variants(offering_product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_default ON product_variants(is_default) WHERE is_default = TRUE;
```

**Key Features:**
- Supports products with multiple options (size, color, bundle options)
- Each variant has its own SKU, price, and stock quantity
- `price_difference_gbp` shows the difference from the base product price
- `is_default` marks the default variant to display
- `display_order` controls the order variants are shown

**Example variants:**
- "Stunning Space Sketchbook" (base product)
  - Variant 1: "Sketchbook Only" (default, £12.00)
  - Variant 2: "Sketchbook + Watercolour Paints" (+£8.00, total £20.00)

#### `product_categories`
**Purpose:** Organize products into collections (join table)

```sql
CREATE TABLE product_categories (
  offering_product_id UUID NOT NULL REFERENCES offering_products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (offering_product_id, category_id)
);

CREATE INDEX idx_product_categories_product ON product_categories(offering_product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);
```

**Key Features:**
- Reuses the existing `categories` table
- Allows products to belong to multiple collections
- Examples: "Classic Collection", "Sale Items", "New Arrivals", "Best Sellers"

#### `product_reviews`
**Purpose:** Customer reviews and ratings for products

```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_product_id UUID NOT NULL REFERENCES offering_products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL, -- Store name even if customer deleted
  customer_email TEXT, -- Optional, for verification
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE, -- Did they actually buy this product?
  is_approved BOOLEAN DEFAULT FALSE, -- Admin moderation
  helpful_count INTEGER DEFAULT 0, -- How many found this helpful
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_reviews_product ON product_reviews(offering_product_id);
CREATE INDEX idx_product_reviews_customer ON product_reviews(customer_id);
CREATE INDEX idx_product_reviews_approved ON product_reviews(is_approved) WHERE is_approved = TRUE;
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_product_reviews_verified ON product_reviews(is_verified_purchase) WHERE is_verified_purchase = TRUE;
```

**Key Features:**
- **Rating:** 1-5 stars (required)
- **Title and review text:** Optional detailed review
- **Verified purchase:** Flag reviews from actual customers who bought the product
- **Admin moderation:** Reviews must be approved before appearing publicly
- **Helpful count:** Track how many people found the review helpful
- **Customer name preserved:** Even if customer account is deleted, review remains with name

**RLS Policies:**
- Public can view approved reviews only
- Customers can create and update their own reviews
- Admins can manage all reviews (approve, edit, delete)

**Use Cases:**
- Display product ratings on product pages
- Filter products by rating
- Show verified purchase badge
- Admin review moderation dashboard

#### `url_redirects`
**Purpose:** Preserve SEO from old sites (old URL → new URL mapping)

```sql
CREATE TABLE url_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_url TEXT NOT NULL UNIQUE,
  new_url TEXT NOT NULL,
  redirect_type INTEGER DEFAULT 301 CHECK (redirect_type IN (301, 302)), -- 301 permanent, 302 temporary
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT, -- Why this redirect exists
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_url_redirects_old_url ON url_redirects(old_url);
CREATE INDEX idx_url_redirects_active ON url_redirects(is_active) WHERE is_active = TRUE;
```

**Example redirects:**
- Old: `lolacreativespace.com/workshops/pottery` → New: `lolaasone.com/workshops/pottery`
- Old: `lotsoflovellyart.com/boxes/monthly` → New: `lolaasone.com/boxes/monthly-subscription`

---

### 2. Commerce Tables

#### `customers`
**Purpose:** Customer accounts (extends Supabase Auth users)

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,

  -- Stripe
  stripe_customer_id TEXT UNIQUE,

  -- Preferences
  marketing_opt_in BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_stripe ON customers(stripe_customer_id);
```

#### `carts`
**Purpose:** Shopping cart sessions (optional, can use localStorage)

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest carts

  -- Metadata
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_carts_customer ON carts(customer_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_carts_expires ON carts(expires_at);
```

#### `cart_items`
**Purpose:** Items in cart

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,

  quantity INTEGER NOT NULL DEFAULT 1,
  price_gbp DECIMAL(10,2) NOT NULL, -- Snapshot price at time of add

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_offering ON cart_items(offering_id);
```

#### `orders`
**Purpose:** Completed orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE, -- Human-readable order number

  -- Customer
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,

  -- Order type
  order_type TEXT NOT NULL CHECK (order_type IN ('one_time', 'subscription_initial', 'subscription_renewal')),

  -- Stripe references
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT, -- If subscription order

  -- Totals
  subtotal_gbp DECIMAL(10,2) NOT NULL,
  shipping_gbp DECIMAL(10,2) DEFAULT 0,
  tax_gbp DECIMAL(10,2) DEFAULT 0,
  total_gbp DECIMAL(10,2) NOT NULL,

  -- Shipping address
  shipping_name TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_postcode TEXT,
  shipping_country TEXT DEFAULT 'GB',

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),

  -- Fulfillment
  fulfilled_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX idx_orders_stripe_subscription ON orders(stripe_subscription_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

#### `order_items`
**Purpose:** Line items in orders

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  offering_id UUID REFERENCES offerings(id) ON DELETE SET NULL,

  -- Item details (snapshot at time of purchase)
  item_type TEXT NOT NULL CHECK (item_type IN ('event', 'product_physical', 'product_digital')),
  title TEXT NOT NULL,
  sku TEXT,

  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_gbp DECIMAL(10,2) NOT NULL,
  total_price_gbp DECIMAL(10,2) NOT NULL,

  -- For events
  event_date DATE,
  event_start_time TIME,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_offering ON order_items(offering_id);
CREATE INDEX idx_order_items_type ON order_items(item_type);
```

#### `payments`
**Purpose:** Stripe payment references

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Stripe references
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,

  -- Payment details
  amount_gbp DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method TEXT, -- 'card', 'bank_transfer', etc.

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
```

#### `fulfillments`
**Purpose:** Shipping/delivery tracking

```sql
CREATE TABLE fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Fulfillment details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'packed', 'shipped', 'delivered', 'failed')),

  -- Shipping
  carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,

  -- Dates
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fulfillments_order ON fulfillments(order_id);
CREATE INDEX idx_fulfillments_status ON fulfillments(status);
CREATE INDEX idx_fulfillments_tracking ON fulfillments(tracking_number);
```

#### `refunds`
**Purpose:** Refund records (optional v1)

```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Stripe reference
  stripe_refund_id TEXT UNIQUE,

  -- Refund details
  amount_gbp DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_stripe ON refunds(stripe_refund_id);
```

---

### 3. Subscription Tables

#### `subscriptions`
**Purpose:** Stripe subscription records

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Stripe reference
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_product_id TEXT,
  stripe_price_id TEXT,

  -- Subscription details
  offering_id UUID REFERENCES offerings(id) ON DELETE SET NULL, -- Which box they're subscribed to

  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'unpaid')),

  -- Billing
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  amount_gbp DECIMAL(10,2) NOT NULL,

  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,

  -- Pause functionality (NEW FEATURE)
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,
  resume_at TIMESTAMPTZ, -- NULL = manual resume, set date = auto-resume

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_offering ON subscriptions(offering_id);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
```

#### `subscription_items`
**Purpose:** Line items in subscriptions (for future multi-item subscriptions)

```sql
CREATE TABLE subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Stripe reference
  stripe_subscription_item_id TEXT UNIQUE,

  -- Item details
  offering_id UUID REFERENCES offerings(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_items_subscription ON subscription_items(subscription_id);
CREATE INDEX idx_subscription_items_offering ON subscription_items(offering_id);
```

#### `subscription_events`
**Purpose:** Audit log for subscription changes

```sql
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'paused', 'resumed', 'cancelled', 'renewed', 'payment_failed', 'payment_succeeded')),
  description TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_subscription ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created ON subscription_events(created_at DESC);
```

#### `subscription_invoices`
**Purpose:** Billing history (synced from Stripe)

```sql
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Stripe reference
  stripe_invoice_id TEXT NOT NULL UNIQUE,

  -- Invoice details
  amount_gbp DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),

  -- Dates
  invoice_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- PDF
  invoice_pdf_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_stripe ON subscription_invoices(stripe_invoice_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_subscription_invoices_date ON subscription_invoices(invoice_date DESC);
```

---

### 4. Inventory Tables

#### `inventory_items`
**Purpose:** Stock by SKU (includes physical products AND subscription boxes)

```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_product_id UUID REFERENCES offering_products(id) ON DELETE CASCADE,
  offering_id UUID REFERENCES offerings(id) ON DELETE CASCADE, -- For subscription boxes

  -- Inventory
  sku TEXT NOT NULL UNIQUE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product_physical', 'subscription_box')),
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0, -- For capacity holds (v2)

  -- Thresholds
  low_stock_threshold INTEGER DEFAULT 5,

  -- Audit
  last_counted_at TIMESTAMPTZ,
  last_counted_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_inventory_sku UNIQUE(sku),
  CONSTRAINT inventory_item_reference CHECK (
    (item_type = 'product_physical' AND offering_product_id IS NOT NULL) OR
    (item_type = 'subscription_box' AND offering_id IS NOT NULL)
  )
);

CREATE INDEX idx_inventory_items_product ON inventory_items(offering_product_id);
CREATE INDEX idx_inventory_items_offering ON inventory_items(offering_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_type ON inventory_items(item_type);
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(quantity_available) WHERE quantity_available <= low_stock_threshold;
```

#### `inventory_movements`
**Purpose:** Auditable stock changes

```sql
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,

  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return', 'damage', 'restock')),
  quantity_change INTEGER NOT NULL, -- Positive = increase, negative = decrease

  -- Reference
  reference_type TEXT, -- 'order', 'manual', etc.
  reference_id UUID, -- order_id, etc.

  -- Audit
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_item ON inventory_movements(inventory_item_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at DESC);
```

---

### 5. Ingredient-Level Stock Control (v2)

#### `box_components`
**Purpose:** Individual components/ingredients that make up art boxes

```sql
CREATE TABLE box_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  description TEXT,
  unit_of_measure TEXT DEFAULT 'unit', -- 'unit', 'sheet', 'meter', etc.
  unit_cost_gbp DECIMAL(10,2),
  supplier_name TEXT,
  supplier_sku TEXT,
  reorder_point INTEGER DEFAULT 10, -- When to reorder
  reorder_quantity INTEGER DEFAULT 50, -- How many to reorder
  lead_time_days INTEGER, -- Supplier lead time
  storage_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_box_components_sku ON box_components(sku);
CREATE INDEX idx_box_components_reorder ON box_components(sku) WHERE unit_cost_gbp <= reorder_point;
```

**Key Features:**
- **Component tracking:** Track individual items like "Watercolour Paint Set", "Sketchbook A5", "Brush Set"
- **Supplier management:** Track supplier name, SKU, lead time
- **Reorder automation:** Set reorder points and quantities
- **Unit of measure:** Flexible units (unit, sheet, meter, etc.)
- **Cost tracking:** Track unit cost for profitability analysis

**Use Cases:**
- Track stock of individual components (paints, brushes, paper, etc.)
- Know when to reorder from suppliers
- Calculate true cost of assembled boxes
- Identify which components are running low

#### `component_inventory`
**Purpose:** Stock levels for components

```sql
CREATE TABLE component_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES box_components(id) ON DELETE CASCADE,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0, -- Reserved for pending box assembly
  quantity_on_order INTEGER NOT NULL DEFAULT 0, -- Ordered from supplier
  last_counted_at TIMESTAMPTZ,
  last_counted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_component_inventory UNIQUE(component_id)
);

CREATE INDEX idx_component_inventory_component ON component_inventory(component_id);
CREATE INDEX idx_component_inventory_low_stock ON component_inventory(component_id)
  WHERE quantity_available <= (SELECT reorder_point FROM box_components WHERE id = component_id);
```

**Key Features:**
- **Available quantity:** Current stock on hand
- **Reserved quantity:** Components reserved for pending box assemblies
- **On order quantity:** Components ordered from suppliers but not yet received
- **Stock counting:** Track when stock was last counted and by whom

#### `component_movements`
**Purpose:** Audit trail for component stock changes

```sql
CREATE TABLE component_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES box_components(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'assembly', 'adjustment', 'return', 'damage', 'restock')),
  quantity_change INTEGER NOT NULL, -- Positive = increase, negative = decrease
  reference_type TEXT, -- 'box_assembly', 'purchase_order', 'manual', etc.
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_component_movements_component ON component_movements(component_id);
CREATE INDEX idx_component_movements_type ON component_movements(movement_type);
CREATE INDEX idx_component_movements_created ON component_movements(created_at DESC);
```

**Movement Types:**
- `purchase` — Components received from supplier
- `assembly` — Components used to assemble boxes
- `adjustment` — Manual stock adjustments
- `return` — Components returned to supplier
- `damage` — Components damaged/unusable
- `restock` — Components returned to inventory

#### `box_recipes`
**Purpose:** Bill of materials - what components make up each box

```sql
CREATE TABLE box_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_product_id UUID NOT NULL REFERENCES offering_products(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES box_components(id) ON DELETE CASCADE,
  quantity_required DECIMAL(10,2) NOT NULL DEFAULT 1, -- How many units of this component per box
  is_optional BOOLEAN DEFAULT FALSE, -- Can box be assembled without this?
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_box_recipe UNIQUE(offering_product_id, component_id)
);

CREATE INDEX idx_box_recipes_product ON box_recipes(offering_product_id);
CREATE INDEX idx_box_recipes_component ON box_recipes(component_id);
```

**Key Features:**
- **Recipe definition:** Define what components make up each box product
- **Quantity required:** Specify how many units of each component per box
- **Optional components:** Mark components as optional (e.g., bonus items)
- **Flexible quantities:** Support decimal quantities (e.g., 0.5 meters of ribbon)

**Example Recipe:**
```
"Lots of Love" Art Box:
- Watercolour Paint Set (1 unit)
- Sketchbook A5 (1 unit)
- Brush Set (1 unit)
- Project Booklet (1 unit)
- Ribbon (0.5 meters) [optional]
```

#### `box_assemblies`
**Purpose:** Track when boxes are assembled from components

```sql
CREATE TABLE box_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_product_id UUID NOT NULL REFERENCES offering_products(id) ON DELETE CASCADE,
  quantity_assembled INTEGER NOT NULL,
  assembly_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assembled_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_box_assemblies_product ON box_assemblies(offering_product_id);
CREATE INDEX idx_box_assemblies_date ON box_assemblies(assembly_date DESC);
```

**Key Features:**
- **Assembly tracking:** Record when boxes are assembled
- **Quantity tracking:** How many boxes were assembled
- **User tracking:** Who assembled the boxes
- **Date tracking:** When assembly occurred

**Workflow:**
1. Admin creates assembly record (e.g., "Assembled 50 Lots of Love boxes")
2. System automatically:
   - Decrements component inventory based on recipe
   - Creates component_movements records (type: 'assembly')
   - Increments finished box inventory
   - Creates inventory_movements record for finished boxes

---

### 6. Event Capacity Management

#### `event_capacity`
**Purpose:** Track available spaces for workshops/events (separate from product inventory)

```sql
CREATE TABLE event_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_event_id UUID NOT NULL REFERENCES offering_events(id) ON DELETE CASCADE,

  -- Capacity tracking
  total_capacity INTEGER NOT NULL, -- Max spaces available
  spaces_booked INTEGER NOT NULL DEFAULT 0, -- Currently booked
  spaces_reserved INTEGER NOT NULL DEFAULT 0, -- Temporarily held during checkout
  spaces_available INTEGER GENERATED ALWAYS AS (total_capacity - spaces_booked - spaces_reserved) STORED,

  -- Waitlist
  waitlist_enabled BOOLEAN DEFAULT FALSE,
  waitlist_count INTEGER DEFAULT 0,

  -- Audit
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_event_capacity UNIQUE(offering_event_id),
  CONSTRAINT valid_capacity CHECK (spaces_booked + spaces_reserved <= total_capacity)
);

CREATE INDEX idx_event_capacity_event ON event_capacity(offering_event_id);
CREATE INDEX idx_event_capacity_available ON event_capacity(spaces_available);
```

#### `event_capacity_holds`
**Purpose:** Temporarily reserve spaces during checkout (prevents overselling)

```sql
CREATE TABLE event_capacity_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_capacity_id UUID NOT NULL REFERENCES event_capacity(id) ON DELETE CASCADE,

  -- Hold details
  session_id TEXT NOT NULL, -- Cart/checkout session
  spaces_held INTEGER NOT NULL DEFAULT 1,

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_capacity_holds_capacity ON event_capacity_holds(event_capacity_id);
CREATE INDEX idx_event_capacity_holds_session ON event_capacity_holds(session_id);
CREATE INDEX idx_event_capacity_holds_expires ON event_capacity_holds(expires_at);
```

---

### 6. Event Booking Tables

#### `bookings`
**Purpose:** Event bookings (linked to orders)

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  offering_event_id UUID NOT NULL REFERENCES offering_events(id) ON DELETE CASCADE,

  -- Booking details
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,

  -- Attendees
  number_of_attendees INTEGER NOT NULL DEFAULT 1,

  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no_show')),

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_order ON bookings(order_id);
CREATE INDEX idx_bookings_event ON bookings(offering_event_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

#### `booking_attendees`
**Purpose:** Attendee details (optional v2)

```sql
CREATE TABLE booking_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  -- Attendee details
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Dietary requirements, etc. (optional)
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_attendees_booking ON booking_attendees(booking_id);
```

---

### 7. Digital Product Tables

#### `digital_downloads`
**Purpose:** Download access records

```sql
CREATE TABLE digital_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  offering_digital_product_id UUID NOT NULL REFERENCES offering_digital_products(id) ON DELETE CASCADE,

  -- Customer
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,

  -- Access control
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER, -- NULL = unlimited
  expires_at TIMESTAMPTZ, -- NULL = never expires

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_digital_downloads_order ON digital_downloads(order_id);
CREATE INDEX idx_digital_downloads_customer ON digital_downloads(customer_id);
CREATE INDEX idx_digital_downloads_product ON digital_downloads(offering_digital_product_id);
CREATE INDEX idx_digital_downloads_status ON digital_downloads(status);
```

#### `download_links`
**Purpose:** Time-limited download URLs

```sql
CREATE TABLE download_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_download_id UUID NOT NULL REFERENCES digital_downloads(id) ON DELETE CASCADE,

  -- Link details
  token TEXT NOT NULL UNIQUE, -- Secure random token
  file_url TEXT NOT NULL, -- Supabase Storage signed URL

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,

  -- Usage
  accessed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_download_links_token ON download_links(token);
CREATE INDEX idx_download_links_download ON download_links(digital_download_id);
CREATE INDEX idx_download_links_expires ON download_links(expires_at);
```

---

## Database Triggers & Functions

### Auto-update `updated_at` timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_offerings_updated_at BEFORE UPDATE ON offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offering_events_updated_at BEFORE UPDATE ON offering_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offering_products_updated_at BEFORE UPDATE ON offering_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offering_digital_products_updated_at BEFORE UPDATE ON offering_digital_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Add more as needed
```

### Auto-generate order number

```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_number_seq;
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();
```

### Auto-decrement inventory on order

```sql
CREATE OR REPLACE FUNCTION decrement_inventory_on_order()
RETURNS TRIGGER AS $$
DECLARE
  product_sku TEXT;
  product_quantity INTEGER;
BEGIN
  -- Only process if order is paid
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Loop through order items
    FOR product_sku, product_quantity IN
      SELECT oi.sku, oi.quantity
      FROM order_items oi
      WHERE oi.order_id = NEW.id AND oi.item_type = 'product_physical'
    LOOP
      -- Decrement inventory
      UPDATE inventory_items
      SET quantity_available = quantity_available - product_quantity
      WHERE sku = product_sku;

      -- Log movement
      INSERT INTO inventory_movements (inventory_item_id, movement_type, quantity_change, reference_type, reference_id)
      SELECT id, 'sale', -product_quantity, 'order', NEW.id
      FROM inventory_items
      WHERE sku = product_sku;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_inventory_trigger AFTER INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION decrement_inventory_on_order();
```

### Auto-update event capacity on booking

```sql
CREATE OR REPLACE FUNCTION update_event_capacity_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    -- Increment spaces_booked
    UPDATE event_capacity
    SET spaces_booked = spaces_booked + NEW.number_of_attendees,
        last_updated_at = NOW()
    WHERE offering_event_id = NEW.offering_event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_capacity_on_booking_trigger
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_event_capacity_on_booking();
```

### Auto-update event capacity on cancellation

```sql
CREATE OR REPLACE FUNCTION update_event_capacity_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    -- Decrement spaces_booked (free up spaces)
    UPDATE event_capacity
    SET spaces_booked = spaces_booked - NEW.number_of_attendees,
        last_updated_at = NOW()
    WHERE offering_event_id = NEW.offering_event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_capacity_on_cancel_trigger
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_event_capacity_on_cancel();
```

### Auto-clean expired capacity holds

```sql
CREATE OR REPLACE FUNCTION clean_expired_capacity_holds()
RETURNS void AS $$
BEGIN
  -- Release expired holds
  DELETE FROM event_capacity_holds
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run this via a cron job or scheduled function
```

---

## Row Level Security (RLS) Policies

### Public read access for published offerings

```sql
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published offerings"
ON offerings FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can manage all offerings"
ON offerings FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

### Customers can view their own data

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer record"
ON customers FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer record"
ON customers FOR UPDATE
USING (auth.uid() = id);
```

### Customers can view their own orders

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

### Customers can view their own subscriptions

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own subscriptions"
ON subscriptions FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own subscriptions"
ON subscriptions FOR UPDATE
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all subscriptions"
ON subscriptions FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

### Customers can view their own digital downloads

```sql
ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own downloads"
ON digital_downloads FOR SELECT
USING (auth.uid() = customer_id);
```

---

## Entity Relationships Summary

### Core Relationships

**Offerings (Polymorphic)**
- `offerings` (1) → (0..1) `offering_events`
- `offerings` (1) → (0..1) `offering_products`
- `offerings` (1) → (0..1) `offering_digital_products`
- `offerings` (M) ↔ (M) `categories` (via `offering_categories`)
- `offerings` (M) ↔ (M) `tags` (via `offering_tags`)

**Orders & Items**
- `customers` (1) → (M) `orders`
- `orders` (1) → (M) `order_items`
- `orders` (1) → (0..M) `payments`
- `orders` (1) → (0..M) `fulfillments`
- `orders` (1) → (0..M) `refunds`
- `orders` (1) → (0..M) `bookings`

**Subscriptions**
- `customers` (1) → (M) `subscriptions`
- `subscriptions` (1) → (M) `subscription_items`
- `subscriptions` (1) → (M) `subscription_events`
- `subscriptions` (1) → (M) `subscription_invoices`
- `subscriptions` (1) → (M) `orders` (renewal orders)

**Inventory**
- `offering_products` (1) → (0..1) `inventory_items` (physical products)
- `offerings` (1) → (0..1) `inventory_items` (subscription boxes)
- `inventory_items` (1) → (M) `inventory_movements`

**Event Capacity**
- `offering_events` (1) → (1) `event_capacity`
- `event_capacity` (1) → (M) `event_capacity_holds`

**Event Bookings**
- `offering_events` (1) → (M) `bookings`
- `bookings` (1) → (M) `booking_attendees`

**Digital Products**
- `offering_digital_products` (1) → (M) `digital_downloads`
- `digital_downloads` (1) → (M) `download_links`

---

## Key Design Decisions

### 1. Polymorphic Offerings Model
**Decision:** Use a shared `offerings` table with type-specific extension tables.

**Rationale:**
- ✅ Shared content fields (title, slug, images, status, SEO)
- ✅ Consistent publishing workflow across all types
- ✅ Unified search and filtering
- ✅ Easy to add new offering types in future

**Trade-off:**
- ⚠️ Requires joins to get full offering data
- ⚠️ Type-specific validation must be enforced at application level

### 2. Separate Checkout Flows
**Decision:** Subscriptions and one-time purchases use different Stripe Checkout sessions.

**Rationale:**
- ✅ Simpler implementation
- ✅ Clear UX distinction
- ✅ Easier to manage in Stripe
- ✅ Avoids complex cart logic

**Implementation:**
- One-time purchases: `order_type = 'one_time'`
- Subscription initial: `order_type = 'subscription_initial'`
- Subscription renewal: `order_type = 'subscription_renewal'`

### 3. Subscription Pause Functionality
**Decision:** Store pause state in `subscriptions` table with `paused_at`, `pause_reason`, and `resume_at` fields.

**Rationale:**
- ✅ Simple to implement
- ✅ Supports both manual and auto-resume
- ✅ Audit trail via `subscription_events`

**Implementation:**
- Pause: Set `status = 'paused'`, `paused_at = NOW()`, optionally set `resume_at`
- Resume: Set `status = 'active'`, clear pause fields
- Auto-resume: Cron job checks `resume_at` and updates status

### 4. Inventory Management (Products vs Events)
**Decision:** Separate inventory tracking for products vs events.

**Rationale:**
- ✅ **Products (including subscription boxes):** Use `inventory_items` table with SKU-based stock tracking
- ✅ **Events (workshops):** Use `event_capacity` table with space-based availability tracking
- ✅ Different business logic: products have "stock quantity", events have "spaces available"
- ✅ Auto-decrement via database triggers for consistency
- ✅ Subscription boxes tracked in inventory (not just one-time products)

**Implementation:**
- `inventory_items` tracks both physical products AND subscription boxes
- `event_capacity` tracks workshop/event spaces separately with computed `spaces_available` column
- Both support reservations during checkout (v2 feature)

**Trade-off:**
- ⚠️ No inventory/capacity reservations during checkout (v1)
- ⚠️ Possible overselling if multiple users checkout simultaneously

**v2 Enhancement:** Implement `event_capacity_holds` for checkout sessions

### 5. Digital Downloads
**Decision:** Generate time-limited signed URLs via Supabase Storage.

**Rationale:**
- ✅ Secure (no direct file access)
- ✅ Supabase handles URL signing
- ✅ Easy to implement expiry

**Implementation:**
- Purchase creates `digital_downloads` record
- Customer requests download → generate signed URL → store in `download_links`
- URL expires after X hours (configurable)

### 6. Customer Accounts
**Decision:** Use Supabase Auth for authentication, extend with `customers` table.

**Rationale:**
- ✅ Supabase handles auth complexity (password reset, email verification)
- ✅ `customers` table stores additional profile data
- ✅ Easy to link to Stripe customers

**Implementation:**
- User signs up → Supabase Auth creates `auth.users` record
- Trigger creates corresponding `customers` record
- Link to Stripe customer via `stripe_customer_id`

---

## Migration Considerations

### Existing Subscribers
**Challenge:** Migrate existing Stripe subscriptions to new database schema.

**Approach:**
1. Export existing Stripe subscriptions via API
2. Create `customers` records for existing subscribers
3. Create `subscriptions` records with Stripe IDs
4. Sync subscription status and billing dates
5. Create initial `subscription_events` for audit trail

**Data needed:**
- Stripe customer ID
- Stripe subscription ID
- Customer email
- Subscription status
- Current period dates
- Next billing date

### Existing Orders (if applicable)
**Challenge:** Migrate historical order data (if needed).

**Approach:**
1. Decide if historical orders are needed in new system
2. If yes: Export from current system, import to `orders` table
3. If no: Keep historical data in old system, link via external reference

---

## Next Steps

### Epic 1 Deliverables
- ✅ Database schema design (this document)
- ⬜ Supabase project setup
- ⬜ Run migrations (create all tables)
- ⬜ Set up RLS policies
- ⬜ Create database triggers
- ⬜ Seed initial data (categories, site sections)
- ⬜ Test schema with sample data

### Epic 2: API Design
- Design REST API endpoints
- Define request/response schemas
- Plan Stripe webhook handlers
- Design authentication flows

### Epic 3: Frontend Setup
- Initialize Vue 3 + Tailwind project
- Set up Supabase client
- Create authentication components
- Design component structure

---

## Questions & Decisions Needed

### Before Implementation

1. **Pause Duration:**
   - How long can customers pause subscriptions?
   - Options: 1 month, 3 months, indefinite
   - Recommendation: 3 months max, then auto-resume

2. **Resume Behavior:**
   - Auto-resume or manual?
   - Recommendation: Customer chooses when pausing (default: manual)

3. **Order Number Format:**
   - Current format: `ORD-YYYYMMDD-XXXXXX`
   - Alternative: `LOL-XXXXXX` (shorter, branded)

4. **Inventory Reservations:**
   - Implement `capacity_holds` in v1 or v2?
   - Recommendation: v2 (adds complexity)

5. **Digital Download Expiry:**
   - How long should download links be valid?
   - Recommendation: 7 days, unlimited downloads within that period

6. **Gift Card Implementation:**
   - Use Stripe's native gift cards or custom?
   - Recommendation: Stripe native (simpler)

---

## Related Documents

- [Epic 0 Summary](./epic-0-summary.md) — All confirmed decisions
- [Epic 0 Principles](./epic-0-cms-principles.md) — Detailed specifications
- [Subscription Model](./subscription-model.md) — Subscription architecture
- [Commerce Scope Guardrails](./commerce-scope-guardrails.md) — What's in/out of scope


