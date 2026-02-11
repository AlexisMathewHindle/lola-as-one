-- ============================================================================
-- ADD AVAILABLE SPACES TO OFFERING EVENTS
-- ============================================================================
-- Purpose: Add available_spaces field to offering_events for manual inventory control
-- Date: 2026-02-09
-- 
-- This migration adds:
-- 1. available_spaces column to offering_events (similar to stock_quantity for products)
-- 2. Allows admins to manually control how many spaces are available for booking
-- 3. Defaults to max_capacity if not set
-- ============================================================================

-- ============================================================================
-- 1. ADD AVAILABLE_SPACES COLUMN
-- ============================================================================

-- Add available_spaces column to offering_events
ALTER TABLE offering_events 
ADD COLUMN IF NOT EXISTS available_spaces INTEGER;

-- Set default value to max_capacity for existing events
UPDATE offering_events 
SET available_spaces = max_capacity 
WHERE available_spaces IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE offering_events 
ALTER COLUMN available_spaces SET NOT NULL;

-- Set default for new events
ALTER TABLE offering_events 
ALTER COLUMN available_spaces SET DEFAULT 0;

-- Add check constraint to ensure available_spaces doesn't exceed max_capacity
ALTER TABLE offering_events
ADD CONSTRAINT check_available_spaces_within_capacity 
CHECK (available_spaces >= 0 AND available_spaces <= max_capacity);

-- Add check constraint to ensure available_spaces is not less than current_bookings
ALTER TABLE offering_events
ADD CONSTRAINT check_available_spaces_not_below_bookings 
CHECK (available_spaces >= current_bookings);

-- ============================================================================
-- 2. ADD INDEX
-- ============================================================================

-- Add index for querying events with available spaces
CREATE INDEX IF NOT EXISTS idx_offering_events_available_spaces 
ON offering_events(available_spaces) 
WHERE available_spaces > 0;

-- ============================================================================
-- 3. ADD COMMENT
-- ============================================================================

COMMENT ON COLUMN offering_events.available_spaces IS 
'Number of spaces available for booking. Can be set lower than max_capacity to control inventory. Similar to stock_quantity for products.';

-- ============================================================================
-- 4. UPDATE EVENT_CAPACITY TABLE TO USE AVAILABLE_SPACES
-- ============================================================================

-- Note: The event_capacity.total_capacity should sync with offering_events.available_spaces
-- This can be handled in application logic or via triggers if needed

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify the column was added:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'offering_events' AND column_name = 'available_spaces';

-- To view events with their capacity info:
-- SELECT 
--   o.title,
--   oe.max_capacity,
--   oe.available_spaces,
--   oe.current_bookings,
--   (oe.available_spaces - oe.current_bookings) as spaces_remaining
-- FROM offering_events oe
-- JOIN offerings o ON o.id = oe.offering_id
-- ORDER BY oe.event_date;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

