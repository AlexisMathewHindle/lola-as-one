-- Lola As One - Database Schema
-- Generated: 2026-01-31
-- Database: PostgreSQL 15+ (Supabase)

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COMMERCE TABLES (defined early due to foreign key dependencies)
-- ============================================================================

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  stripe_customer_id TEXT UNIQUE,
  marketing_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_stripe ON customers(stripe_customer_id);

-- ============================================================================
-- CMS TABLES
-- ============================================================================

-- Offerings (shared content shell)
-- metadata JSONB field usage examples:
-- For workshops: {"category": "Adult", "age_group": "18+", "difficulty": "Beginner"}
-- For products: {"collection": "Classic", "featured_artist": "Jane Doe"}
CREATE TABLE offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('event', 'product_physical', 'product_digital', 'subscription')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_short TEXT,
  description_long TEXT,
  featured_image_url TEXT,
  secondary_images JSONB DEFAULT '[]'::jsonb, -- Array of secondary images: [{"url": "string", "order": number}]. Max 6 images.
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  scheduled_publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- Flexible field for type-specific data (workshop categories, product collections, etc.)
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_offerings_type ON offerings(type);
CREATE INDEX idx_offerings_status ON offerings(status);
CREATE INDEX idx_offerings_slug ON offerings(slug);
CREATE INDEX idx_offerings_featured ON offerings(featured) WHERE featured = TRUE;

-- Offering Events (extends offerings)
CREATE TABLE offering_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_start_time TIME NOT NULL,
  event_end_time TIME,
  location_name TEXT,
  location_address TEXT,
  location_city TEXT,
  location_postcode TEXT,
  max_capacity INTEGER NOT NULL,
  current_bookings INTEGER DEFAULT 0,
  price_gbp DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_offering_event UNIQUE(offering_id)
);

CREATE INDEX idx_offering_events_date ON offering_events(event_date);
CREATE INDEX idx_offering_events_capacity ON offering_events(max_capacity, current_bookings);

-- Offering Products (extends offerings)
CREATE TABLE offering_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  price_gbp DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  track_inventory BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  requires_shipping BOOLEAN DEFAULT TRUE,
  weight_grams INTEGER,
  available_for_subscription BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_offering_product UNIQUE(offering_id)
);

CREATE INDEX idx_offering_products_sku ON offering_products(sku);
CREATE INDEX idx_offering_products_stock ON offering_products(stock_quantity);
CREATE INDEX idx_offering_products_subscription ON offering_products(available_for_subscription) WHERE available_for_subscription = TRUE;

-- Product Variants (for products with multiple options)
-- Example: "Stunning Space Sketchbook" vs "Stunning Space Sketchbook + Watercolour Paints"
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

-- Product Reviews (customer reviews and ratings)
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

-- Offering Digital Products (extends offerings)
CREATE TABLE offering_digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('gift_card', 'download')),
  price_gbp DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  file_url TEXT,
  file_size_bytes BIGINT,
  file_type TEXT,
  download_limit INTEGER,
  download_expiry_days INTEGER,
  stripe_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_offering_digital_product UNIQUE(offering_id)
);

CREATE INDEX idx_offering_digital_products_type ON offering_digital_products(product_type);

-- Categories
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

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);

-- Offering Categories (join table)
CREATE TABLE offering_categories (
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (offering_id, category_id)
);

CREATE INDEX idx_offering_categories_offering ON offering_categories(offering_id);
CREATE INDEX idx_offering_categories_category ON offering_categories(category_id);

-- Offering Tags (join table)
CREATE TABLE offering_tags (
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (offering_id, tag_id)
);

CREATE INDEX idx_offering_tags_offering ON offering_tags(offering_id);
CREATE INDEX idx_offering_tags_tag ON offering_tags(tag_id);

-- Product Categories (join table - reuses categories table)
-- For organizing products into collections like "Classic Collection", "Sale Items", etc.
CREATE TABLE product_categories (
  offering_product_id UUID NOT NULL REFERENCES offering_products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (offering_product_id, category_id)
);

CREATE INDEX idx_product_categories_product ON product_categories(offering_product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);

-- Navigation Items
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

-- Site Sections
CREATE TABLE site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_sections_key ON site_sections(section_key);
CREATE INDEX idx_site_sections_active ON site_sections(is_active) WHERE is_active = TRUE;

-- Content Pages (static CMS pages: About, Contact, FAQs, Policies, etc.)
CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image_url TEXT,
  hero_cta_text TEXT,
  hero_cta_url TEXT,
  body JSONB, -- Rich text content (structured blocks)
  meta_title TEXT,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_content_pages_slug ON content_pages(slug);
CREATE INDEX idx_content_pages_status ON content_pages(status);

-- Blog Posts (separate from static content pages)
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body JSONB, -- Rich text content (structured blocks)
  featured_image_url TEXT,
  author_name TEXT, -- Guest author attribution
  author_bio TEXT,
  author_image_url TEXT,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';

-- Blog Post Categories (join table)
CREATE TABLE blog_post_categories (
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, category_id)
);

CREATE INDEX idx_blog_post_categories_post ON blog_post_categories(blog_post_id);
CREATE INDEX idx_blog_post_categories_category ON blog_post_categories(category_id);

-- Blog Post Tags (join table)
CREATE TABLE blog_post_tags (
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, tag_id)
);

CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(blog_post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- URL Redirects (preserve SEO from old sites)
CREATE TABLE url_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_url TEXT NOT NULL UNIQUE,
  new_url TEXT NOT NULL,
  redirect_type INTEGER DEFAULT 301 CHECK (redirect_type IN (301, 302)),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_url_redirects_old_url ON url_redirects(old_url);
CREATE INDEX idx_url_redirects_active ON url_redirects(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- COMMERCE TABLES (continued)
-- ============================================================================

-- Carts
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  session_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_carts_customer ON carts(customer_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_carts_expires ON carts(expires_at);

-- Cart Items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_gbp DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_offering ON cart_items(offering_id);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('one_time', 'subscription_initial', 'subscription_renewal')),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  subtotal_gbp DECIMAL(10,2) NOT NULL,
  shipping_gbp DECIMAL(10,2) DEFAULT 0,
  tax_gbp DECIMAL(10,2) DEFAULT 0,
  total_gbp DECIMAL(10,2) NOT NULL,
  shipping_name TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_postcode TEXT,
  shipping_country TEXT DEFAULT 'GB',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX idx_orders_stripe_subscription ON orders(stripe_subscription_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  offering_id UUID REFERENCES offerings(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('event', 'product_physical', 'product_digital')),
  title TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_gbp DECIMAL(10,2) NOT NULL,
  total_price_gbp DECIMAL(10,2) NOT NULL,
  event_date DATE,
  event_start_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_offering ON order_items(offering_id);
CREATE INDEX idx_order_items_type ON order_items(item_type);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  amount_gbp DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Fulfillments
CREATE TABLE fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'packed', 'shipped', 'delivered', 'failed')),
  carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fulfillments_order ON fulfillments(order_id);
CREATE INDEX idx_fulfillments_status ON fulfillments(status);
CREATE INDEX idx_fulfillments_tracking ON fulfillments(tracking_number);

-- Refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  stripe_refund_id TEXT UNIQUE,
  amount_gbp DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_stripe ON refunds(stripe_refund_id);

-- ============================================================================
-- SUBSCRIPTION TABLES
-- ============================================================================

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  offering_id UUID REFERENCES offerings(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'unpaid')),
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  amount_gbp DECIMAL(10,2) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,
  resume_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_offering ON subscriptions(offering_id);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Subscription Items
CREATE TABLE subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_subscription_item_id TEXT UNIQUE,
  offering_id UUID REFERENCES offerings(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_items_subscription ON subscription_items(subscription_id);
CREATE INDEX idx_subscription_items_offering ON subscription_items(offering_id);

-- Subscription Events
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'paused', 'resumed', 'cancelled', 'renewed', 'payment_failed', 'payment_succeeded')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_subscription ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created ON subscription_events(created_at DESC);

-- Subscription Invoices
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_gbp DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_stripe ON subscription_invoices(stripe_invoice_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_subscription_invoices_date ON subscription_invoices(invoice_date DESC);

-- Subscription Plan Boxes (which boxes are available for each subscription offering)
CREATE TABLE subscription_plan_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  offering_product_id UUID NOT NULL REFERENCES offering_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_subscription_plan_box UNIQUE (subscription_offering_id, offering_product_id)
);

CREATE INDEX idx_subscription_plan_boxes_subscription
  ON subscription_plan_boxes(subscription_offering_id);

CREATE INDEX idx_subscription_plan_boxes_product
  ON subscription_plan_boxes(offering_product_id);

-- ============================================================================
-- INVENTORY TABLES
-- ============================================================================

-- Inventory Items (includes physical products AND subscription boxes)
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_product_id UUID REFERENCES offering_products(id) ON DELETE CASCADE,
  offering_id UUID REFERENCES offerings(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product_physical', 'subscription_box')),
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  last_counted_at TIMESTAMPTZ,
  last_counted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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

-- Inventory Movements
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return', 'damage', 'restock')),
  quantity_change INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_item ON inventory_movements(inventory_item_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at DESC);

-- ============================================================================
-- INGREDIENT-LEVEL STOCK CONTROL (v2)
-- ============================================================================

-- Box Components (ingredients that make up a box)
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
-- Note: Low stock monitoring requires joining with component_inventory table

-- Component Inventory (stock levels for components)
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
-- Note: Low stock monitoring should be done via a view or query joining with box_components
-- CREATE INDEX idx_component_inventory_low_stock ON component_inventory(quantity_available);

-- Component Movements (audit trail for component stock changes)
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

-- Box Recipes (bill of materials - what components make up each box)
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

-- Box Assembly Records (track when boxes are assembled from components)
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

-- ============================================================================
-- EVENT CAPACITY MANAGEMENT
-- ============================================================================

-- Event Capacity (track available spaces for workshops/events)
CREATE TABLE event_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_event_id UUID NOT NULL REFERENCES offering_events(id) ON DELETE CASCADE,
  total_capacity INTEGER NOT NULL,
  spaces_booked INTEGER NOT NULL DEFAULT 0,
  spaces_reserved INTEGER NOT NULL DEFAULT 0,
  spaces_available INTEGER GENERATED ALWAYS AS (total_capacity - spaces_booked - spaces_reserved) STORED,
  waitlist_enabled BOOLEAN DEFAULT FALSE,
  waitlist_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_event_capacity UNIQUE(offering_event_id),
  CONSTRAINT valid_capacity CHECK (spaces_booked + spaces_reserved <= total_capacity)
);

CREATE INDEX idx_event_capacity_event ON event_capacity(offering_event_id);
CREATE INDEX idx_event_capacity_available ON event_capacity(spaces_available);

-- Event Capacity Holds (temporarily reserve spaces during checkout)
CREATE TABLE event_capacity_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_capacity_id UUID NOT NULL REFERENCES event_capacity(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  spaces_held INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_capacity_holds_capacity ON event_capacity_holds(event_capacity_id);
CREATE INDEX idx_event_capacity_holds_session ON event_capacity_holds(session_id);
CREATE INDEX idx_event_capacity_holds_expires ON event_capacity_holds(expires_at);

-- ============================================================================
-- EVENT BOOKING TABLES
-- ============================================================================

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  offering_event_id UUID NOT NULL REFERENCES offering_events(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  number_of_attendees INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no_show')),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_order ON bookings(order_id);
CREATE INDEX idx_bookings_event ON bookings(offering_event_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Booking Attendees
CREATE TABLE booking_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_attendees_booking ON booking_attendees(booking_id);

-- ============================================================================
-- DIGITAL PRODUCT TABLES
-- ============================================================================

-- Digital Downloads
CREATE TABLE digital_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  offering_digital_product_id UUID NOT NULL REFERENCES offering_digital_products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_digital_downloads_order ON digital_downloads(order_id);
CREATE INDEX idx_digital_downloads_customer ON digital_downloads(customer_id);
CREATE INDEX idx_digital_downloads_product ON digital_downloads(offering_digital_product_id);
CREATE INDEX idx_digital_downloads_status ON digital_downloads(status);

-- Download Links
CREATE TABLE download_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_download_id UUID NOT NULL REFERENCES digital_downloads(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accessed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_download_links_token ON download_links(token);
CREATE INDEX idx_download_links_download ON download_links(digital_download_id);
CREATE INDEX idx_download_links_expires ON download_links(expires_at);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_offerings_updated_at BEFORE UPDATE ON offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offering_events_updated_at BEFORE UPDATE ON offering_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offering_products_updated_at BEFORE UPDATE ON offering_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offering_digital_products_updated_at BEFORE UPDATE ON offering_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON content_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plan_boxes_updated_at BEFORE UPDATE ON subscription_plan_boxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fulfillments_updated_at BEFORE UPDATE ON fulfillments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_box_components_updated_at BEFORE UPDATE ON box_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_component_inventory_updated_at BEFORE UPDATE ON component_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_box_recipes_updated_at BEFORE UPDATE ON box_recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate order number
CREATE SEQUENCE order_number_seq;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Auto-decrement inventory on order
CREATE OR REPLACE FUNCTION decrement_inventory_on_order()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  product_sku TEXT;
  product_quantity INTEGER;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    FOR product_sku, product_quantity IN
      SELECT oi.sku, oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND oi.item_type = 'product_physical'
    LOOP
      UPDATE public.inventory_items
      SET quantity_available = quantity_available - product_quantity
      WHERE sku = product_sku;

      INSERT INTO public.inventory_movements (inventory_item_id, movement_type, quantity_change, reference_type, reference_id)
      SELECT id, 'sale', -product_quantity, 'order', NEW.id
      FROM public.inventory_items
      WHERE sku = product_sku;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_inventory_trigger AFTER INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION decrement_inventory_on_order();

-- Auto-update event capacity on booking
CREATE OR REPLACE FUNCTION update_event_capacity_on_booking()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    UPDATE public.event_capacity
    SET spaces_booked = spaces_booked + NEW.number_of_attendees,
        last_updated_at = NOW()
    WHERE offering_event_id = NEW.offering_event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_capacity_on_booking_trigger AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION update_event_capacity_on_booking();

-- Auto-update event capacity on cancellation
CREATE OR REPLACE FUNCTION update_event_capacity_on_cancel()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE public.event_capacity
    SET spaces_booked = spaces_booked - NEW.number_of_attendees,
        last_updated_at = NOW()
    WHERE offering_event_id = NEW.offering_event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_capacity_on_cancel_trigger AFTER UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_event_capacity_on_cancel();

-- Auto-clean expired capacity holds (run via cron/scheduled function)
CREATE OR REPLACE FUNCTION clean_expired_capacity_holds()
RETURNS void
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.event_capacity_holds
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Offerings: Public can view published, admins can manage all
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published offerings"
ON offerings FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can manage all offerings"
ON offerings FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Customers: Users can view/update their own record, admins can view all
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer record"
ON customers FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer record"
ON customers FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all customers"
ON customers FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

CREATE POLICY "Admins can manage all customers"
ON customers FOR ALL
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Orders: Customers can view their own, admins can view all
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Subscriptions: Customers can view/update their own, admins can view all
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

-- Digital Downloads: Customers can view their own
ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own downloads"
ON digital_downloads FOR SELECT
USING (auth.uid() = customer_id);

-- Content Pages: Public can view published, admins can manage all
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published content pages"
ON content_pages FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can manage all content pages"
ON content_pages FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- URL Redirects: Public read access (for middleware), admins can manage
ALTER TABLE url_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active redirects"
ON url_redirects FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can manage all redirects"
ON url_redirects FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Blog Posts: Public can view published, admins can manage all
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published blog posts"
ON blog_posts FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can manage all blog posts"
ON blog_posts FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Product Variants: Public can view, admins can manage
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product variants"
ON product_variants FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage product variants"
ON product_variants FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Product Reviews: Public can view approved, customers can create, admins can manage
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved reviews"
ON product_reviews FOR SELECT
USING (is_approved = TRUE);

CREATE POLICY "Customers can create reviews"
ON product_reviews FOR INSERT
WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

CREATE POLICY "Customers can update their own reviews"
ON product_reviews FOR UPDATE
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all reviews"
ON product_reviews FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Ingredient-Level Stock Control (v2): Admin-only access
ALTER TABLE box_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_assemblies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage box components"
ON box_components FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage component inventory"
ON component_inventory FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage component movements"
ON component_movements FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage box recipes"
ON box_recipes FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage box assemblies"
ON box_assemblies FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Offering Events: Public can view, admins can manage
ALTER TABLE offering_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering events"
ON offering_events FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering events"
ON offering_events FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Offering Products: Public can view, admins can manage
ALTER TABLE offering_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering products"
ON offering_products FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering products"
ON offering_products FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Offering Digital Products: Public can view, admins can manage
ALTER TABLE offering_digital_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering digital products"
ON offering_digital_products FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering digital products"
ON offering_digital_products FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Categories: Public can view, admins can manage
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories"
ON categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Tags: Public can view, admins can manage
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tags"
ON tags FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage tags"
ON tags FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Offering Categories: Public can view, admins can manage
ALTER TABLE offering_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering categories"
ON offering_categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering categories"
ON offering_categories FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Offering Tags: Public can view, admins can manage
ALTER TABLE offering_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering tags"
ON offering_tags FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering tags"
ON offering_tags FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Product Categories: Public can view, admins can manage
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product categories"
ON product_categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage product categories"
ON product_categories FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Navigation Items: Public can view active items, admins can manage all
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active navigation items"
ON navigation_items FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can manage navigation items"
ON navigation_items FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Site Sections: Public can view active sections, admins can manage all
ALTER TABLE site_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active site sections"
ON site_sections FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can manage site sections"
ON site_sections FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Blog Post Categories: Public can view, admins can manage
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view blog post categories"
ON blog_post_categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage blog post categories"
ON blog_post_categories FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Blog Post Tags: Public can view, admins can manage
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view blog post tags"
ON blog_post_tags FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage blog post tags"
ON blog_post_tags FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Carts: Users can manage their own carts, or session-based carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own carts"
ON carts FOR SELECT
USING (auth.uid() = customer_id OR session_id IS NOT NULL);

CREATE POLICY "Users can manage their own carts"
ON carts FOR ALL
USING (auth.uid() = customer_id OR session_id IS NOT NULL);

CREATE POLICY "Admins can view all carts"
ON carts FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Cart Items: Users can manage items in their own carts
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart items"
ON cart_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
    AND (carts.customer_id = auth.uid() OR carts.session_id IS NOT NULL)
  )
);

CREATE POLICY "Users can manage their own cart items"
ON cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
    AND (carts.customer_id = auth.uid() OR carts.session_id IS NOT NULL)
  )
);

CREATE POLICY "Admins can view all cart items"
ON cart_items FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Order Items: Customers can view their own order items, admins can view all
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all order items"
ON order_items FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Payments: Customers can view their own payments, admins can manage all
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own payments"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = payments.order_id
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all payments"
ON payments FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Fulfillments: Customers can view their own fulfillments, admins can manage all
ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own fulfillments"
ON fulfillments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = fulfillments.order_id
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all fulfillments"
ON fulfillments FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Refunds: Customers can view their own refunds, admins can manage all
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own refunds"
ON refunds FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = refunds.order_id
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all refunds"
ON refunds FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Subscription Items: Customers can view their own subscription items, admins can manage all
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own subscription items"
ON subscription_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.id = subscription_items.subscription_id
    AND subscriptions.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscription items"
ON subscription_items FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Subscription Events: Customers can view their own subscription events, admins can manage all
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own subscription events"
ON subscription_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.id = subscription_events.subscription_id
    AND subscriptions.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscription events"
ON subscription_events FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Subscription Invoices: Customers can view their own invoices, admins can manage all
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own subscription invoices"
ON subscription_invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.id = subscription_invoices.subscription_id
    AND subscriptions.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscription invoices"
ON subscription_invoices FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Subscription Plan Boxes: Admin-only access
ALTER TABLE subscription_plan_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription plan boxes"
ON subscription_plan_boxes FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Inventory Items: Admin-only access
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory items"
ON inventory_items FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Inventory Movements: Admin-only access
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory movements"
ON inventory_movements FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Event Capacity: Public can view, admins can manage
ALTER TABLE event_capacity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view event capacity"
ON event_capacity FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage event capacity"
ON event_capacity FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Event Capacity Holds: Users can view their own holds, admins can manage all
ALTER TABLE event_capacity_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own capacity holds"
ON event_capacity_holds FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage event capacity holds"
ON event_capacity_holds FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Bookings: Customers can view their own bookings, admins can manage all
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own bookings"
ON bookings FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all bookings"
ON bookings FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Booking Attendees: Customers can view attendees for their own bookings, admins can manage all
ALTER TABLE booking_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own booking attendees"
ON booking_attendees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_attendees.booking_id
    AND bookings.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all booking attendees"
ON booking_attendees FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Download Links: Customers can view their own download links, admins can manage all
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own download links"
ON download_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM digital_downloads
    WHERE digital_downloads.id = download_links.digital_download_id
    AND digital_downloads.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all download links"
ON download_links FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

