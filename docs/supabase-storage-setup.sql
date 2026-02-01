-- ============================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- Run this in Supabase SQL Editor OR create via Dashboard UI
-- ============================================================================

-- Create storage buckets (if using SQL)
-- Note: It's easier to create these via the Supabase Dashboard > Storage

-- Bucket 1: Product Images
-- Name: product-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Bucket 2: Blog Images  
-- Name: blog-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Bucket 3: Workshop Images
-- Name: workshop-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- ============================================================================
-- STORAGE POLICIES (Run after creating buckets)
-- ============================================================================

-- Product Images Policies
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.jwt() ->> 'role' = 'admin'
);

-- Blog Images Policies
CREATE POLICY "Public can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-images' 
  AND auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-images' 
  AND auth.jwt() ->> 'role' = 'admin'
);

-- Workshop Images Policies
CREATE POLICY "Public can view workshop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'workshop-images');

CREATE POLICY "Admins can upload workshop images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workshop-images' 
  AND auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can update workshop images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workshop-images' 
  AND auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can delete workshop images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workshop-images' 
  AND auth.jwt() ->> 'role' = 'admin'
);

