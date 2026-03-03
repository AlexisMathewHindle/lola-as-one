-- Add missing columns to offering_events and offering_products tables
-- These columns are used in the admin UI but were missing from the database schema

-- ============================================================================
-- OFFERING_EVENTS TABLE
-- ============================================================================

-- Add waitlist_enabled column
ALTER TABLE offering_events
ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN DEFAULT FALSE;

-- Add category_id column (references categories table)
ALTER TABLE offering_events
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add index for category lookups
CREATE INDEX IF NOT EXISTS idx_offering_events_category ON offering_events(category_id);

-- Add comment to explain the columns
COMMENT ON COLUMN offering_events.waitlist_enabled IS 'When enabled, customers can join a waitlist if the event reaches max capacity';
COMMENT ON COLUMN offering_events.category_id IS 'Optional category for organizing events (e.g., Adult Workshops, Kids Classes)';

-- ============================================================================
-- OFFERING_PRODUCTS TABLE
-- ============================================================================

-- Add waitlist_enabled column
ALTER TABLE offering_products
ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN offering_products.waitlist_enabled IS 'When enabled, customers can join a waitlist when product is out of stock';

