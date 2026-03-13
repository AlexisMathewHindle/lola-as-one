-- Create storage bucket for category images
-- This bucket will store featured images for event categories

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Public read access for category images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload category images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update category images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete category images" ON storage.objects;

-- Policy: Allow public read access to category images
CREATE POLICY "Public read access for category images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-images');

-- Policy: Allow authenticated admins to upload category images
CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'category-images'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Policy: Allow authenticated admins to update category images
CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'category-images'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Policy: Allow authenticated admins to delete category images
CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'category-images'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';

