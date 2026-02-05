-- ============================================================================
-- ADD WAITLIST COLUMN TO PRODUCTS
-- ============================================================================
-- Purpose: Add waitlist_enabled column to offering_products table
-- Date: 2026-02-02
-- 
-- This migration adds:
-- 1. waitlist_enabled column to offering_products (if it doesn't exist)
-- 2. Index for products with waitlist enabled
--
-- Note: The event_waitlist_entries and product_waitlist_entries tables
-- already exist in your database, so this migration only adds the missing
-- column to offering_products.
-- ============================================================================

-- Add waitlist_enabled flag to offering_products (if it doesn't exist)
ALTER TABLE offering_products 
ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN DEFAULT FALSE;

-- Add index for products with waitlist enabled (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_offering_products_waitlist 
ON offering_products(waitlist_enabled) 
WHERE waitlist_enabled = TRUE;

-- Add comment to column
COMMENT ON COLUMN offering_products.waitlist_enabled IS 
'Enable "Notify Me" waitlist when product is out of stock';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- To verify the column was added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns
-- WHERE table_name = 'offering_products' AND column_name = 'waitlist_enabled';

-- To verify the index was created:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'offering_products' AND indexname = 'idx_offering_products_waitlist';

