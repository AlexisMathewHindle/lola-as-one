-- Add featured_image_url column to event_categories table
-- This allows categories to have a featured image displayed on category listing pages

ALTER TABLE event_categories 
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

COMMENT ON COLUMN event_categories.featured_image_url IS 'URL to the category featured image stored in Supabase Storage';

