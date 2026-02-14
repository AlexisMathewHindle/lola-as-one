-- ============================================================================
-- SUBSCRIPTION FULFILLMENT MIGRATION
-- ============================================================================
-- Date: 2026-02-13
-- Purpose: Add subscription fulfillment capabilities to existing schema
-- 
-- Changes:
-- 1. Extend orders table with fulfillment fields (cycle_key, tracking, etc.)
-- 2. Create plans table for subscription plan configuration
-- 3. Create addresses table for reusable customer shipping addresses
-- 4. Create stripe_events table for webhook idempotency
-- ============================================================================

-- ============================================================================
-- 1. EXTEND ORDERS TABLE FOR SUBSCRIPTION FULFILLMENT
-- ============================================================================
-- The orders table already has order_type='subscription_renewal' and 
-- stripe_subscription_id, so we just need to add fulfillment tracking fields

-- Add new columns
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS cycle_key TEXT,              -- Format: "YYYY-MM" (which month to ship)
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,        -- Shipping carrier tracking number
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,      -- When marked as shipped
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;    -- When delivered to customer

-- Add indexes for subscription order queries
CREATE INDEX IF NOT EXISTS idx_orders_cycle_key ON orders(cycle_key);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);

-- Extend status values to include fulfillment statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'pending',      -- Awaiting payment (one-time orders)
    'paid',         -- Payment received
    'queued',       -- Ready to pack (subscription boxes)
    'packed',       -- Packed, ready to ship
    'shipped',      -- Shipped with tracking
    'delivered',    -- Delivered to customer
    'fulfilled',    -- Completed (legacy/general)
    'cancelled',    -- Cancelled
    'refunded'      -- Refunded
  ));

-- Add unique constraint: one order per subscription per cycle
-- This prevents duplicate box orders for the same month
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_subscription_cycle 
  ON orders(stripe_subscription_id, cycle_key) 
  WHERE order_type = 'subscription_renewal' AND stripe_subscription_id IS NOT NULL AND cycle_key IS NOT NULL;

-- Add comments
COMMENT ON COLUMN orders.cycle_key IS 'Subscription cycle in YYYY-MM format (e.g., 2026-02). Determines which month this box should ship.';
COMMENT ON COLUMN orders.tracking_number IS 'Shipping carrier tracking number (e.g., Royal Mail, DPD)';
COMMENT ON COLUMN orders.shipped_at IS 'Timestamp when order was marked as shipped and tracking email sent';
COMMENT ON COLUMN orders.delivered_at IS 'Timestamp when order was delivered to customer';

-- ============================================================================
-- 2. PLANS TABLE
-- ============================================================================
-- Subscription plan configuration (monthly, yearly, etc.)
-- Links to Stripe price IDs and defines cutoff dates for fulfillment

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                                   -- e.g., "Monthly Box", "Quarterly Box"
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  stripe_price_id TEXT NOT NULL UNIQUE,                 -- Stripe Price ID (price_xxx)
  cutoff_day INTEGER NOT NULL DEFAULT 20,               -- Day of month (1-28) after which next cycle ships
  shipping_window_text TEXT,                            -- e.g., "Ships 1st week of month"
  active BOOLEAN DEFAULT TRUE,                          -- Whether plan is available for new subscriptions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_stripe_price ON plans(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(active);

COMMENT ON TABLE plans IS 'Subscription plan configuration linked to Stripe prices';
COMMENT ON COLUMN plans.cutoff_day IS 'Day of month (1-28). Payments after this day ship in the following month.';
COMMENT ON COLUMN plans.shipping_window_text IS 'Customer-facing text describing when boxes ship (e.g., "Ships 1st week of month")';

-- ============================================================================
-- 3. ADDRESSES TABLE
-- ============================================================================
-- Reusable customer shipping addresses
-- Each order snapshots the address at time of creation

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                                   -- Full name for shipping label
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'GB',
  phone TEXT,                                           -- Contact number for delivery
  is_default BOOLEAN DEFAULT FALSE,                     -- Default shipping address
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(customer_id, is_default);

COMMENT ON TABLE addresses IS 'Reusable customer shipping addresses. Orders snapshot these at creation time.';
COMMENT ON COLUMN addresses.is_default IS 'Default address used for new subscription orders';

-- ============================================================================
-- 4. STRIPE EVENTS TABLE (Idempotency)
-- ============================================================================
-- Tracks processed Stripe webhook events to prevent duplicate processing
-- Stripe may retry webhooks, so we need to check if we've already handled an event

CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,                                  -- Stripe event ID (e.g., evt_xxx)
  type TEXT NOT NULL,                                   -- Event type (e.g., invoice.payment_succeeded)
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed_at);

COMMENT ON TABLE stripe_events IS 'Webhook idempotency - prevents duplicate processing of Stripe events';
COMMENT ON COLUMN stripe_events.id IS 'Stripe event ID from webhook payload';

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- Addresses: Users can manage their own addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = customer_id);

-- Plans: Public read access for active plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active plans"
  ON plans FOR SELECT
  USING (active = TRUE);

-- Stripe events: No RLS needed (service role only)
-- Orders table: Assuming existing RLS allows users to see their own orders

-- ============================================================================
-- 6. HELPER FUNCTION: Ensure only one default address per customer
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this address as default, unset all other defaults for this customer
  IF NEW.is_default = TRUE THEN
    UPDATE addresses 
    SET is_default = FALSE 
    WHERE customer_id = NEW.customer_id 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_address
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

COMMENT ON FUNCTION ensure_single_default_address IS 'Ensures only one address per customer is marked as default';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

