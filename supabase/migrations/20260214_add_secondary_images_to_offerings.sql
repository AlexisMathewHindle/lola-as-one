-- ============================================================================
-- ADD SECONDARY IMAGES SUPPORT TO OFFERINGS
-- Created: 2026-02-14
-- ============================================================================

-- Add secondary_images JSONB column to offerings table
-- This will store an array of secondary image objects with URL and display order
-- Example: [{"url": "https://...", "order": 1}, {"url": "https://...", "order": 2}]

ALTER TABLE offerings 
ADD COLUMN IF NOT EXISTS secondary_images JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN offerings.secondary_images IS 'Array of secondary images with structure: [{"url": "string", "order": number}]. Maximum 6 images.';

-- Create an index for better query performance when filtering by secondary images
CREATE INDEX IF NOT EXISTS idx_offerings_secondary_images ON offerings USING GIN (secondary_images);

