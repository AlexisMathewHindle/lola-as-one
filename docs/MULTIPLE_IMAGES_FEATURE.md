# Multiple Images Feature for Offerings

## Overview

This feature allows offerings to have 1 main image + up to 6 secondary images.

## Database Changes

### Migration File
- **File**: `supabase/migrations/20260214_add_secondary_images_to_offerings.sql`
- **Changes**: Adds `secondary_images` JSONB column to the `offerings` table

### Data Structure

The `secondary_images` column stores an array of image objects:

```json
[
  {"url": "https://storage.supabase.co/...", "order": 1},
  {"url": "https://storage.supabase.co/...", "order": 2},
  {"url": "https://storage.supabase.co/...", "order": 3}
]
```

- **Maximum**: 6 secondary images
- **Fields**:
  - `url` (string): Public URL of the uploaded image
  - `order` (number): Display order (1-6)

## Frontend Changes

### New Component: `MultipleImageUploader.vue`

**Location**: `app/src/components/shared/MultipleImageUploader.vue`

**Features**:
- Upload and manage main image
- Upload up to 6 secondary images
- Drag & drop support
- Image preview with remove functionality
- Display order indicators
- File validation (type and size)
- Error handling

**Props**:
- `mainImage` (String): URL of the main image
- `secondaryImagesData` (Array): Array of secondary image objects
- `bucket` (String): Supabase storage bucket name
- `maxSizeMB` (Number): Maximum file size in MB (default: 5)

**Events**:
- `update:mainImage`: Emitted when main image changes
- `update:secondaryImagesData`: Emitted when secondary images change
- `upload-error`: Emitted on upload errors

### Updated Component: `OfferingsForm.vue`

**Changes**:
1. Replaced `ImageUploader` with `MultipleImageUploader`
2. Added `secondary_images` field to form data structure
3. Added handlers for main and secondary image updates
4. Updated save logic to include `secondary_images` in offering data
5. Updated load logic to retrieve `secondary_images` from database

## How to Apply the Migration

### Option 1: Supabase CLI (Recommended)

```bash
# Apply the migration
supabase db push
```

### Option 2: Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase/migrations/20260214_add_secondary_images_to_offerings.sql`
5. Click **Run**

### Option 3: Direct SQL

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE offerings 
ADD COLUMN IF NOT EXISTS secondary_images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN offerings.secondary_images IS 'Array of secondary images with structure: [{"url": "string", "order": number}]. Maximum 6 images.';

CREATE INDEX IF NOT EXISTS idx_offerings_secondary_images ON offerings USING GIN (secondary_images);
```

## Usage

### Creating/Editing an Offering

1. Navigate to Admin → Offerings → Create/Edit
2. Upload a main image (required)
3. Optionally upload up to 6 secondary images
4. Secondary images can be removed individually
5. Save the offering

### Accessing Images in Code

```javascript
// Get offering with images
const { data: offering } = await supabase
  .from('offerings')
  .select('*')
  .eq('id', offeringId)
  .single()

// Main image
const mainImage = offering.featured_image_url

// Secondary images (sorted by order)
const secondaryImages = offering.secondary_images || []
const sortedImages = secondaryImages.sort((a, b) => a.order - b.order)
```

## Storage

All images are stored in Supabase Storage buckets:
- **Events/Workshops**: `workshop-images`
- **Products**: `product-images`
- **Blog**: `blog-images`

Images are publicly accessible via Supabase CDN.

## Future Enhancements

Potential improvements for future iterations:
- Drag & drop reordering of secondary images
- Bulk upload support
- Image cropping/editing
- Alt text for each image (accessibility)
- Different image sizes/thumbnails
- Image optimization on upload

