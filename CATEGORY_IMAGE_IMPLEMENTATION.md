# Category Image Upload Implementation

## Summary
Added the ability to upload and manage featured images for event categories in the admin panel.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20260313_add_featured_image_to_categories.sql`
- Added `featured_image_url` column to `event_categories` table
- **Action Required:** Run this migration in Supabase dashboard

### 2. Storage Bucket
**File:** `supabase/migrations/20260313_create_category_images_bucket.sql`
- Created `category-images` storage bucket
- Set up RLS policies:
  - Public read access (anyone can view category images)
  - Admin-only write access (only admins can upload/update/delete)
- **Action Required:** Run this migration in Supabase dashboard

### 3. Frontend Components

#### ImageUploader Component
**File:** `app/src/components/shared/ImageUploader.vue`
- Added `'category-images'` to the allowed buckets validator

#### CategoryModal Component
**File:** `app/src/components/admin/CategoryModal.vue`
- Imported `ImageUploader` component
- Added Featured Image section in the form (after Icon field)
- Added `featured_image_url` to:
  - Initial `formData` object
  - `resetForm()` function
  - Category watcher (for editing)
  - `categoryData` object sent to API
- Added image upload handlers:
  - `handleImageUpload()` - logs successful uploads
  - `handleImageError()` - displays error messages

#### useEventCategories Composable
**File:** `app/src/composables/useEventCategories.js`
- No changes needed - already handles any fields passed in `categoryData`

## Testing Steps

### 1. Run Migrations
In Supabase Dashboard SQL Editor, run:
```sql
-- Migration 1: Add column
ALTER TABLE event_categories 
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

COMMENT ON COLUMN event_categories.featured_image_url IS 'URL to the category featured image stored in Supabase Storage';

-- Migration 2: Create bucket and policies
-- (Copy content from 20260313_create_category_images_bucket.sql)
```

### 2. Test Creating a Category with Image
1. Navigate to admin panel → Event Categories
2. Click "Create Category"
3. Fill in required fields (Name, Slug)
4. Upload an image in the "Featured Image" section
5. Save the category
6. Verify:
   - Image appears in the form
   - Category saves successfully
   - Image URL is stored in database

### 3. Test Editing a Category
1. Click "Edit" on an existing category
2. Upload or change the featured image
3. Save changes
4. Verify:
   - New image appears
   - Changes persist after save

### 4. Test Frontend Display
1. Navigate to the category listing page (lola-workshops app)
2. Verify category images display correctly
3. Check that the image from `featured_image_url` is shown

## Files Modified
- `supabase/migrations/20260313_add_featured_image_to_categories.sql` (new)
- `supabase/migrations/20260313_create_category_images_bucket.sql` (new)
- `app/src/components/shared/ImageUploader.vue`
- `app/src/components/admin/CategoryModal.vue`

## Files Already Supporting This Feature
- `lola-workshops/src/views/CategoryListingView.vue` - Already has code to display `featured_image_url`

## Notes
- Maximum image size: 5MB
- Supported formats: PNG, JPG, WEBP, GIF
- Images are stored in Supabase Storage bucket: `category-images`
- Images are publicly accessible (read-only)
- Only admins can upload/modify category images

