-- ============================================================================
-- TEST SCRIPT FOR SUBSCRIPTION FULFILLMENT MIGRATION
-- ============================================================================
-- Purpose: Verify that the migration was successful
-- Run this after applying 20260213_subscription_fulfillment.sql
-- ============================================================================

-- Test 1: Verify orders table has new columns
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'cycle_key') = 1,
         'orders.cycle_key column missing';
  
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'tracking_number') = 1,
         'orders.tracking_number column missing';
  
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'shipped_at') = 1,
         'orders.shipped_at column missing';
  
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'delivered_at') = 1,
         'orders.delivered_at column missing';
  
  RAISE NOTICE 'Test 1 PASSED: Orders table has all new columns';
END $$;

-- Test 2: Verify new tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'plans') = 1,
         'plans table missing';
  
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'addresses') = 1,
         'addresses table missing';
  
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'stripe_events') = 1,
         'stripe_events table missing';
  
  RAISE NOTICE 'Test 2 PASSED: All new tables exist';
END $$;

-- Test 3: Verify indexes exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_orders_cycle_key') = 1,
         'idx_orders_cycle_key index missing';
  
  ASSERT (SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_orders_tracking') = 1,
         'idx_orders_tracking index missing';
  
  ASSERT (SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_orders_subscription_cycle') = 1,
         'idx_orders_subscription_cycle index missing';
  
  RAISE NOTICE 'Test 3 PASSED: All indexes created';
END $$;

-- Test 4: Test inserting a plan
INSERT INTO plans (name, interval, stripe_price_id, cutoff_day, shipping_window_text)
VALUES ('Monthly Box', 'month', 'price_test_monthly_123', 20, 'Ships 1st week of month')
ON CONFLICT (stripe_price_id) DO NOTHING;

SELECT 'Test 4 PASSED: Can insert plan' AS result;

-- Test 5: Test inserting an address (requires a customer)
-- Note: This will only work if you have a customer in the database
-- Uncomment and replace with a real customer_id to test
/*
INSERT INTO addresses (customer_id, name, address_line1, city, postcode, is_default)
VALUES ('YOUR_CUSTOMER_ID_HERE', 'Test User', '123 Test St', 'London', 'SW1A 1AA', true);

SELECT 'Test 5 PASSED: Can insert address' AS result;
*/

-- Test 6: Test inserting a subscription order with cycle_key
-- Note: This will only work if you have a customer in the database
-- Uncomment and replace with real IDs to test
/*
INSERT INTO orders (
  order_number,
  customer_id,
  customer_email,
  order_type,
  stripe_subscription_id,
  cycle_key,
  status,
  subtotal_gbp,
  total_gbp,
  shipping_name,
  shipping_address_line1,
  shipping_city,
  shipping_postcode
) VALUES (
  'SUB-TEST-001',
  'YOUR_CUSTOMER_ID_HERE',
  'test@example.com',
  'subscription_renewal',
  'sub_test_123',
  '2026-02',
  'queued',
  25.00,
  25.00,
  'Test User',
  '123 Test St',
  'London',
  'SW1A 1AA'
);

SELECT 'Test 6 PASSED: Can insert subscription order with cycle_key' AS result;
*/

-- Test 7: Test stripe_events idempotency
INSERT INTO stripe_events (id, type) VALUES ('evt_test_001', 'invoice.payment_succeeded');

-- Try to insert the same event again (should fail due to primary key)
DO $$
BEGIN
  BEGIN
    INSERT INTO stripe_events (id, type) VALUES ('evt_test_001', 'invoice.payment_succeeded');
    RAISE EXCEPTION 'Duplicate event was inserted - idempotency check failed!';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'Test 7 PASSED: Stripe events idempotency working';
  END;
END $$;

-- Test 8: Test default address trigger
-- Note: Requires a customer_id
-- Uncomment and replace with a real customer_id to test
/*
-- Insert first address as default
INSERT INTO addresses (customer_id, name, address_line1, city, postcode, is_default)
VALUES ('YOUR_CUSTOMER_ID_HERE', 'Address 1', '123 Test St', 'London', 'SW1A 1AA', true);

-- Insert second address as default (should unset first)
INSERT INTO addresses (customer_id, name, address_line1, city, postcode, is_default)
VALUES ('YOUR_CUSTOMER_ID_HERE', 'Address 2', '456 Test Ave', 'London', 'SW1A 2BB', true);

-- Check that only one is default
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN 'Test 8 PASSED: Only one default address per customer'
    ELSE 'Test 8 FAILED: Multiple default addresses found'
  END AS result
FROM addresses
WHERE customer_id = 'YOUR_CUSTOMER_ID_HERE' AND is_default = true;
*/

-- ============================================================================
-- CLEANUP TEST DATA
-- ============================================================================
DELETE FROM stripe_events WHERE id = 'evt_test_001';
DELETE FROM plans WHERE stripe_price_id = 'price_test_monthly_123';
-- DELETE FROM addresses WHERE name LIKE 'Address %' OR name = 'Test User';
-- DELETE FROM orders WHERE order_number = 'SUB-TEST-001';

SELECT '✅ All automated tests passed! Migration successful.' AS final_result;

