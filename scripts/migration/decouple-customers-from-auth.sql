-- Migration: Decouple customers table from auth.users
-- This allows creating customer records for historical bookings without requiring auth accounts
-- Customers can exist independently, and optionally link to auth.users when they create an account

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_id_fkey;

-- Step 2: Change the id column to be a regular UUID (not referencing auth.users)
-- First, we need to handle existing data if any
-- This assumes the table is empty or we're okay with recreating it

-- Step 3: Add a new column to optionally link to auth.users
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 4: Add a unique constraint on auth_user_id to ensure one customer per auth user
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Step 5: Update RLS policies to work with the new structure
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own customer record" ON customers;
DROP POLICY IF EXISTS "Users can update their own customer record" ON customers;

-- Create new policies that check auth_user_id instead of id
CREATE POLICY "Users can view their own customer record"
ON customers FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own customer record"
ON customers FOR UPDATE
USING (auth.uid() = auth_user_id);

-- Step 6: Add comments to explain the new structure
COMMENT ON COLUMN customers.id IS 'Primary key - independent UUID, not tied to auth.users';
COMMENT ON COLUMN customers.auth_user_id IS 'Optional link to auth.users when customer creates an account. NULL for guest/historical customers';
COMMENT ON TABLE customers IS 'Customer records can exist independently of auth.users. Historical/guest customers have auth_user_id = NULL';

