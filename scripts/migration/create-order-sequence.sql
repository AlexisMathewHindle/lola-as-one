-- Create the order_number_seq sequence if it doesn't exist
-- This sequence is used by the generate_order_number() trigger function
-- to auto-generate order numbers in the format: ORD-YYYYMMDD-XXXXXX

-- Drop the sequence if it exists (in case it was created incorrectly)
DROP SEQUENCE IF EXISTS order_number_seq CASCADE;
DROP SEQUENCE IF EXISTS public.order_number_seq CASCADE;

-- Create the sequence in the public schema
CREATE SEQUENCE public.order_number_seq;

-- Update the trigger function to use the fully qualified sequence name
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('public.order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the sequence was created
SELECT EXISTS (
  SELECT 1
  FROM pg_sequences
  WHERE schemaname = 'public'
  AND sequencename = 'order_number_seq'
) as sequence_exists;

