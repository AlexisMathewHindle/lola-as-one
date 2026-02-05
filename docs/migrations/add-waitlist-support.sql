-- ============================================================================
-- WAITLIST SUPPORT MIGRATION
-- ============================================================================
-- Purpose: Add comprehensive waitlist support for events and products
-- Date: 2026-02-02
-- 
-- This migration adds:
-- 1. event_waitlist_entries table - Track customers waiting for sold-out events
-- 2. product_waitlist_entries table - Track customers waiting for out-of-stock products
-- 3. waitlist_enabled column for products
-- 4. Auto-notification triggers when space/stock becomes available
-- 5. RLS policies for waitlist tables
-- ============================================================================

-- ============================================================================
-- 1. ADD WAITLIST SUPPORT TO PRODUCTS
-- ============================================================================

-- Add waitlist_enabled flag to offering_products
ALTER TABLE offering_products 
ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN DEFAULT FALSE;

-- Add index for products with waitlist enabled
CREATE INDEX IF NOT EXISTS idx_offering_products_waitlist 
ON offering_products(waitlist_enabled) 
WHERE waitlist_enabled = TRUE;

-- ============================================================================
-- 2. EVENT WAITLIST ENTRIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_event_id UUID NOT NULL REFERENCES offering_events(id) ON DELETE CASCADE,
  
  -- Customer information
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Waitlist details
  spaces_requested INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'expired', 'cancelled')),
  
  -- Notification tracking
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Notification expires after X hours (e.g., 24 hours)
  
  -- Notes
  notes TEXT, -- Admin notes or customer message
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event waitlist
CREATE INDEX idx_event_waitlist_event ON event_waitlist_entries(offering_event_id);
CREATE INDEX idx_event_waitlist_customer ON event_waitlist_entries(customer_id);
CREATE INDEX idx_event_waitlist_status ON event_waitlist_entries(status);
CREATE INDEX idx_event_waitlist_created ON event_waitlist_entries(created_at);
CREATE INDEX idx_event_waitlist_email ON event_waitlist_entries(customer_email);

-- ============================================================================
-- 3. PRODUCT WAITLIST ENTRIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_product_id UUID NOT NULL REFERENCES offering_products(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  
  -- Customer information
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  
  -- Waitlist details
  quantity_requested INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'expired', 'cancelled')),
  
  -- Notification tracking
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Notification expires after X hours (e.g., 48 hours)
  
  -- Notes
  notes TEXT, -- Admin notes or customer message
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for product waitlist
CREATE INDEX idx_product_waitlist_product ON product_waitlist_entries(offering_product_id);
CREATE INDEX idx_product_waitlist_variant ON product_waitlist_entries(product_variant_id);
CREATE INDEX idx_product_waitlist_customer ON product_waitlist_entries(customer_id);
CREATE INDEX idx_product_waitlist_status ON product_waitlist_entries(status);
CREATE INDEX idx_product_waitlist_created ON product_waitlist_entries(created_at);
CREATE INDEX idx_product_waitlist_email ON product_waitlist_entries(customer_email);

-- ============================================================================
-- 4. AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp for event waitlist
CREATE TRIGGER update_event_waitlist_updated_at 
BEFORE UPDATE ON event_waitlist_entries 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at timestamp for product waitlist
CREATE TRIGGER update_product_waitlist_updated_at 
BEFORE UPDATE ON product_waitlist_entries 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. AUTO-INCREMENT WAITLIST COUNT FOR EVENTS
-- ============================================================================

-- Function: Update event waitlist count when entry is added/removed
CREATE OR REPLACE FUNCTION update_event_waitlist_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'waiting' THEN
    -- Increment waitlist count
    UPDATE public.event_capacity
    SET waitlist_count = waitlist_count + 1
    WHERE offering_event_id = NEW.offering_event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed from waiting to something else, decrement
    IF OLD.status = 'waiting' AND NEW.status != 'waiting' THEN
      UPDATE public.event_capacity
      SET waitlist_count = waitlist_count - 1
      WHERE offering_event_id = NEW.offering_event_id;
    -- If status changed to waiting from something else, increment
    ELSIF OLD.status != 'waiting' AND NEW.status = 'waiting' THEN
      UPDATE public.event_capacity
      SET waitlist_count = waitlist_count + 1
      WHERE offering_event_id = NEW.offering_event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'waiting' THEN
    -- Decrement waitlist count
    UPDATE public.event_capacity
    SET waitlist_count = waitlist_count - 1
    WHERE offering_event_id = OLD.offering_event_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update event waitlist count
CREATE TRIGGER update_event_waitlist_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON event_waitlist_entries
FOR EACH ROW
EXECUTE FUNCTION update_event_waitlist_count();

-- ============================================================================
-- 6. AUTO-NOTIFICATION TRIGGERS
-- ============================================================================

-- Function: Notify event waitlist when booking is cancelled
CREATE OR REPLACE FUNCTION notify_event_waitlist_on_cancellation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  event_capacity_record RECORD;
  waitlist_entry RECORD;
BEGIN
  -- Only process if booking was cancelled
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    -- Get event capacity info
    SELECT * INTO event_capacity_record
    FROM public.event_capacity
    WHERE offering_event_id = NEW.offering_event_id;

    -- If waitlist is enabled and there are spaces available
    IF event_capacity_record.waitlist_enabled AND event_capacity_record.spaces_available >= NEW.number_of_attendees THEN
      -- Get the first waiting entry that fits
      SELECT * INTO waitlist_entry
      FROM public.event_waitlist_entries
      WHERE offering_event_id = NEW.offering_event_id
        AND status = 'waiting'
        AND spaces_requested <= event_capacity_record.spaces_available
      ORDER BY created_at ASC
      LIMIT 1;

      -- Update the waitlist entry to notified
      IF FOUND THEN
        UPDATE public.event_waitlist_entries
        SET status = 'notified',
            notified_at = NOW(),
            expires_at = NOW() + INTERVAL '24 hours'
        WHERE id = waitlist_entry.id;

        -- TODO: Send email notification
        -- This should be handled by a separate Edge Function or service
        -- listening to database changes (e.g., Supabase Realtime or pg_notify)
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Notify event waitlist on booking cancellation
CREATE TRIGGER notify_event_waitlist_trigger
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_event_waitlist_on_cancellation();

-- Function: Notify product waitlist when stock is replenished
CREATE OR REPLACE FUNCTION notify_product_waitlist_on_restock()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If stock quantity increased (restock) and waitlist is enabled
  IF NEW.stock_quantity > OLD.stock_quantity
     AND NEW.stock_quantity > 0
     AND NEW.waitlist_enabled = TRUE THEN

    -- Update all waiting entries to notified
    UPDATE public.product_waitlist_entries
    SET status = 'notified',
        notified_at = NOW(),
        expires_at = NOW() + INTERVAL '48 hours'
    WHERE offering_product_id = NEW.id
      AND status = 'waiting';

    -- TODO: Send email notifications
    -- This should be handled by a separate Edge Function or service
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Notify product waitlist on restock
CREATE TRIGGER notify_product_waitlist_trigger
AFTER UPDATE ON offering_products
FOR EACH ROW
EXECUTE FUNCTION notify_product_waitlist_on_restock();

-- ============================================================================
-- 7. HELPER FUNCTION: CLEAN EXPIRED WAITLIST NOTIFICATIONS
-- ============================================================================

-- Function: Clean up expired waitlist notifications (run via cron/scheduled function)
CREATE OR REPLACE FUNCTION clean_expired_waitlist_notifications()
RETURNS void
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Mark expired event waitlist notifications
  UPDATE public.event_waitlist_entries
  SET status = 'expired'
  WHERE status = 'notified'
    AND expires_at < NOW();

  -- Mark expired product waitlist notifications
  UPDATE public.product_waitlist_entries
  SET status = 'expired'
  WHERE status = 'notified'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: Schedule this function to run periodically (e.g., every hour)
-- using Supabase Edge Functions with cron or pg_cron extension

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Event Waitlist Entries: Customers can view their own, admins can manage all
ALTER TABLE event_waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own event waitlist entries"
ON event_waitlist_entries FOR SELECT
USING (
  auth.uid() = customer_id OR
  auth.jwt() ->> 'email' = customer_email
);

CREATE POLICY "Customers can insert their own event waitlist entries"
ON event_waitlist_entries FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'email' = customer_email
);

CREATE POLICY "Customers can update their own event waitlist entries"
ON event_waitlist_entries FOR UPDATE
USING (
  auth.uid() = customer_id OR
  auth.jwt() ->> 'email' = customer_email
)
WITH CHECK (
  auth.uid() = customer_id OR
  auth.jwt() ->> 'email' = customer_email
);

CREATE POLICY "Admins can manage all event waitlist entries"
ON event_waitlist_entries FOR ALL
USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Product Waitlist Entries: Customers can view their own, admins can manage all
ALTER TABLE product_waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own product waitlist entries"
ON product_waitlist_entries FOR SELECT
USING (
  auth.uid() = customer_id OR
  auth.jwt() ->> 'email' = customer_email
);

CREATE POLICY "Customers can insert their own product waitlist entries"
ON product_waitlist_entries FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'email' = customer_email
);

CREATE POLICY "Customers can update their own product waitlist entries"
ON product_waitlist_entries FOR UPDATE
USING (
  auth.uid() = customer_id OR
  auth.jwt() ->> 'email' = customer_email
)
WITH CHECK (
  auth.uid() = customer_id OR
  auth.jwt() ->> 'email' = customer_email
);

CREATE POLICY "Admins can manage all product waitlist entries"
ON product_waitlist_entries FOR ALL
USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- To apply this migration:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this entire file
-- 4. Run the query
--
-- To verify:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('event_waitlist_entries', 'product_waitlist_entries');
--
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'offering_products' AND column_name = 'waitlist_enabled';

