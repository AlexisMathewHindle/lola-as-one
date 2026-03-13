-- ============================================================================
-- TEST SCRIPT FOR FEATURED IMAGE TO CATEGORIES MIGRATION
-- ============================================================================
-- Purpose: Verify that the migration was successful
-- Run this after applying 20260313_add_featured_image_to_categories.sql
-- ============================================================================

-- Test 1: Verify event_categories table has featured_image_url column
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'event_categories' AND column_name = 'featured_image_url') = 1,
         'event_categories.featured_image_url column missing';
  
  RAISE NOTICE 'Test 1 PASSED: event_categories table has featured_image_url column';
END $$;

-- Test 2: Verify column is of correct type (TEXT)
DO $$
BEGIN
  ASSERT (SELECT data_type FROM information_schema.columns 
          WHERE table_name = 'event_categories' AND column_name = 'featured_image_url') = 'text',
         'event_categories.featured_image_url column is not TEXT type';
  
  RAISE NOTICE 'Test 2 PASSED: featured_image_url column is TEXT type';
END $$;

-- Test 3: Verify column is nullable (allows NULL values)
DO $$
BEGIN
  ASSERT (SELECT is_nullable FROM information_schema.columns 
          WHERE table_name = 'event_categories' AND column_name = 'featured_image_url') = 'YES',
         'event_categories.featured_image_url column should be nullable';
  
  RAISE NOTICE 'Test 3 PASSED: featured_image_url column is nullable';
END $$;

-- Test 4: Verify column comment exists
DO $$
DECLARE
  column_comment TEXT;
BEGIN
  SELECT col_description('event_categories'::regclass, 
    (SELECT ordinal_position FROM information_schema.columns 
     WHERE table_name = 'event_categories' AND column_name = 'featured_image_url'))
  INTO column_comment;
  
  ASSERT column_comment IS NOT NULL,
         'event_categories.featured_image_url column comment missing';
  
  RAISE NOTICE 'Test 4 PASSED: featured_image_url column has comment';
END $$;

-- Test 5: Test inserting a category with featured_image_url
INSERT INTO event_categories (name, slug, featured_image_url)
VALUES ('Test Category', 'test-category', 'https://example.com/test-image.jpg')
ON CONFLICT (slug) DO UPDATE SET featured_image_url = EXCLUDED.featured_image_url;

SELECT 'Test 5 PASSED: Can insert category with featured_image_url' AS result;

-- Test 6: Test inserting a category without featured_image_url (should allow NULL)
INSERT INTO event_categories (name, slug)
VALUES ('Test Category No Image', 'test-category-no-image')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

SELECT 'Test 6 PASSED: Can insert category without featured_image_url (NULL)' AS result;

-- Test 7: Verify the test data was inserted correctly
DO $$
DECLARE
  test_url TEXT;
  test_null_url TEXT;
BEGIN
  SELECT featured_image_url INTO test_url
  FROM event_categories
  WHERE slug = 'test-category';
  
  ASSERT test_url = 'https://example.com/test-image.jpg',
         'Featured image URL not stored correctly';
  
  SELECT featured_image_url INTO test_null_url
  FROM event_categories
  WHERE slug = 'test-category-no-image';
  
  ASSERT test_null_url IS NULL,
         'Featured image URL should be NULL for category without image';
  
  RAISE NOTICE 'Test 7 PASSED: Featured image URLs stored correctly';
END $$;

-- ============================================================================
-- CLEANUP TEST DATA
-- ============================================================================
DELETE FROM event_categories WHERE slug IN ('test-category', 'test-category-no-image');

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT '✅ All tests passed! Migration successful.' AS summary;

