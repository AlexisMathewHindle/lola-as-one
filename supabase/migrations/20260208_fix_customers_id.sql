-- Fix customers table to auto-generate UUID for id column
-- This fixes the error: null value in column "id" of relation "customers" violates not-null constraint

-- Add default UUID generation to the id column
ALTER TABLE customers 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add a comment to document this fix
COMMENT ON COLUMN customers.id IS 'Auto-generated UUID primary key';

