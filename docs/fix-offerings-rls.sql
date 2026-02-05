-- Fix RLS policies for offerings and related tables to allow admins to insert/update/delete
-- The policies were checking auth.jwt() ->> 'role' but should check app_metadata

-- ============================================================================
-- OFFERINGS TABLE
-- ============================================================================

-- Drop the incorrectly created policy
DROP POLICY IF EXISTS "Admins can manage all offerings" ON offerings;

-- Create the correct policy that checks app_metadata
CREATE POLICY "Admins can manage all offerings"
ON offerings FOR ALL
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================================
-- OFFERING_EVENTS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage offering events" ON offering_events;
DROP POLICY IF EXISTS "Public can view offering events" ON offering_events;

-- Recreate public view policy (allows everyone to SELECT)
CREATE POLICY "Public can view offering events"
ON offering_events FOR SELECT
USING (TRUE);

-- Create admin INSERT policy
CREATE POLICY "Admins can insert offering events"
ON offering_events FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Create admin UPDATE policy
CREATE POLICY "Admins can update offering events"
ON offering_events FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Create admin DELETE policy
CREATE POLICY "Admins can delete offering events"
ON offering_events FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================================
-- OFFERING_PRODUCTS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage offering products" ON offering_products;
DROP POLICY IF EXISTS "Public can view offering products" ON offering_products;

-- Recreate public view policy (allows everyone to SELECT)
CREATE POLICY "Public can view offering products"
ON offering_products FOR SELECT
USING (TRUE);

-- Create admin INSERT policy
CREATE POLICY "Admins can insert offering products"
ON offering_products FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Create admin UPDATE policy
CREATE POLICY "Admins can update offering products"
ON offering_products FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Create admin DELETE policy
CREATE POLICY "Admins can delete offering products"
ON offering_products FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================================
-- OFFERING_DIGITAL_PRODUCTS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage offering digital products" ON offering_digital_products;
DROP POLICY IF EXISTS "Public can view offering digital products" ON offering_digital_products;

-- Recreate public view policy (allows everyone to SELECT)
CREATE POLICY "Public can view offering digital products"
ON offering_digital_products FOR SELECT
USING (TRUE);

-- Create admin INSERT policy
CREATE POLICY "Admins can insert offering digital products"
ON offering_digital_products FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Create admin UPDATE policy
CREATE POLICY "Admins can update offering digital products"
ON offering_digital_products FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- Create admin DELETE policy
CREATE POLICY "Admins can delete offering digital products"
ON offering_digital_products FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================================
-- TAGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage tags" ON tags;

CREATE POLICY "Admins can manage tags"
ON tags FOR ALL
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================================
-- OFFERING_CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage offering categories" ON offering_categories;

CREATE POLICY "Admins can manage offering categories"
ON offering_categories FOR ALL
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================================
-- OFFERING_TAGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage offering tags" ON offering_tags;

CREATE POLICY "Admins can manage offering tags"
ON offering_tags FOR ALL
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================================
-- PRODUCT_CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage product categories" ON product_categories;

CREATE POLICY "Admins can manage product categories"
ON product_categories FOR ALL
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

