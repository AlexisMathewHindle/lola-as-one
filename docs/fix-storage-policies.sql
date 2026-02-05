-- ============================================================================
-- FIX STORAGE POLICIES FOR ADMIN ACCESS
-- Run this in Supabase SQL Editor to fix the RLS policies
-- ============================================================================

-- First, drop all existing policies on storage.objects
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;

DROP POLICY IF EXISTS "Public can view workshop images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload workshop images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update workshop images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete workshop images" ON storage.objects;

-- Also drop any generic policies that might exist
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access" ON storage.objects;

-- ============================================================================
-- CREATE NEW POLICIES WITH CORRECT ADMIN CHECK
-- ============================================================================

-- Public can view all public bucket images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id IN ('product-images', 'blog-images', 'workshop-images'));

-- Authenticated users with admin role can upload to any bucket
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Authenticated users with admin role can update images
CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE
USING (
  auth.role() = 'authenticated' 
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Authenticated users with admin role can delete images
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
USING (
  auth.role() = 'authenticated' 
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================================
-- VERIFY YOUR ADMIN USER HAS THE CORRECT ROLE
-- ============================================================================

-- Check current users and their roles
-- SELECT id, email, raw_app_meta_data FROM auth.users;

-- If your user doesn't have admin role, run this (replace with your email):
-- UPDATE auth.users 
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-email@example.com';

-- After updating, you MUST sign out and sign back in for the JWT to refresh!

