-- Check if the trigger function exists
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'generate_order_number';

-- Check if the trigger exists
SELECT 
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'orders';

-- Check if the sequence exists
SELECT 
  schemaname,
  sequencename,
  sequenceowner
FROM pg_sequences
WHERE sequencename = 'order_number_seq';

-- Try to create the sequence in the public schema explicitly
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq;

-- Verify again
SELECT EXISTS (
  SELECT 1 
  FROM pg_sequences 
  WHERE schemaname = 'public' 
  AND sequencename = 'order_number_seq'
) as sequence_exists;

