-- Fix RLS policy for customers table to allow admins to view all customers
-- This policy was missing, preventing admins from viewing the customer list

-- First, drop the incorrectly created policies if they exist
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Admins can manage all customers" ON customers;

-- Create the correct policies that check app_metadata
CREATE POLICY "Admins can view all customers"
ON customers FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

CREATE POLICY "Admins can manage all customers"
ON customers FOR ALL
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);

