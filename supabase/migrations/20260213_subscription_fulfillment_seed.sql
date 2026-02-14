-- ============================================================================
-- SEED DATA FOR SUBSCRIPTION PLANS
-- ============================================================================
-- Purpose: Insert initial subscription plans
-- Note: Update stripe_price_id values with your actual Stripe Price IDs
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================
-- These should match your Stripe products/prices
-- Get your Stripe Price IDs from: https://dashboard.stripe.com/prices

-- Monthly Box Plan
INSERT INTO plans (
  name,
  interval,
  stripe_price_id,
  cutoff_day,
  shipping_window_text,
  active
) VALUES (
  'Monthly Box',
  'month',
  'price_REPLACE_WITH_YOUR_MONTHLY_PRICE_ID',  -- ⚠️ REPLACE THIS
  20,  -- Orders placed after the 20th ship in the following month
  'Ships during the 1st week of each month',
  true
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  name = EXCLUDED.name,
  cutoff_day = EXCLUDED.cutoff_day,
  shipping_window_text = EXCLUDED.shipping_window_text,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Quarterly Box Plan (every 3 months)
INSERT INTO plans (
  name,
  interval,
  stripe_price_id,
  cutoff_day,
  shipping_window_text,
  active
) VALUES (
  'Quarterly Box',
  'month',  -- Stripe interval is still 'month' but charged every 3 months
  'price_REPLACE_WITH_YOUR_QUARTERLY_PRICE_ID',  -- ⚠️ REPLACE THIS
  20,
  'Ships during the 1st week of the month, every 3 months',
  true
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  name = EXCLUDED.name,
  cutoff_day = EXCLUDED.cutoff_day,
  shipping_window_text = EXCLUDED.shipping_window_text,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Annual Box Plan
INSERT INTO plans (
  name,
  interval,
  stripe_price_id,
  cutoff_day,
  shipping_window_text,
  active
) VALUES (
  'Annual Box',
  'year',
  'price_REPLACE_WITH_YOUR_ANNUAL_PRICE_ID',  -- ⚠️ REPLACE THIS
  20,
  'Ships during the 1st week of each month for 12 months',
  true
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  name = EXCLUDED.name,
  cutoff_day = EXCLUDED.cutoff_day,
  shipping_window_text = EXCLUDED.shipping_window_text,
  active = EXCLUDED.active,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all active plans
SELECT 
  id,
  name,
  interval,
  stripe_price_id,
  cutoff_day,
  shipping_window_text,
  active,
  created_at
FROM plans
WHERE active = true
ORDER BY 
  CASE interval 
    WHEN 'month' THEN 1 
    WHEN 'year' THEN 2 
  END;

-- ============================================================================
-- NOTES FOR SETUP
-- ============================================================================
-- 
-- 1. Get your Stripe Price IDs:
--    - Go to https://dashboard.stripe.com/prices
--    - Find your subscription prices
--    - Copy the price_xxx IDs
--    - Replace the REPLACE_WITH_YOUR_xxx_PRICE_ID placeholders above
--
-- 2. Adjust cutoff_day if needed:
--    - Default is 20 (orders after 20th ship next month)
--    - Must be between 1-28 to work for all months
--
-- 3. Customize shipping_window_text:
--    - This is shown to customers
--    - Be clear about when they'll receive their box
--
-- 4. To disable a plan:
--    UPDATE plans SET active = false WHERE name = 'Plan Name';
--
-- 5. To add a new plan:
--    INSERT INTO plans (name, interval, stripe_price_id, cutoff_day, shipping_window_text)
--    VALUES ('New Plan', 'month', 'price_xxx', 20, 'Ships...');
--
-- ============================================================================

