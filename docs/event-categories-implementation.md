# Event Categories Implementation Guide

**Date:** 2026-02-02  
**Status:** ✅ COMPLETE

---

## Overview

This document describes the implementation of a flexible and scalable event category management system for the Lola As One platform. The system replaces hardcoded category values with a database-driven approach that allows admins to manage categories dynamically.

---

## Features Implemented

### 1. Database Schema
- **New Table:** `event_categories` with hierarchical structure (parent/child relationships)
- **Fields:**
  - `id` (UUID) - Primary key
  - `name` - Category display name
  - `slug` - URL-friendly identifier
  - `description` - Category description
  - `parent_id` - Reference to parent category (for hierarchy)
  - `display_order` - Sort order
  - `color_hex` - Optional color for UI display
  - `icon` - Optional Font Awesome icon name
  - `age_range` (JSONB) - Flexible age range storage (e.g., `{"min": 2, "max": 4}`)
  - `is_active` - Active/inactive status
  - Timestamps: `created_at`, `updated_at`

### 2. Database Migration
- **File:** `docs/migrations/add-event-categories.sql`
- **Includes:**
  - Table creation with indexes
  - Foreign key to `offering_events.category_id`
  - Row Level Security (RLS) policies
  - Seed data with all existing event categories
  - Updated_at trigger

### 3. Category Hierarchy
The system supports a two-level hierarchy:

**Parent Categories:**
- Open Studio
- Little Ones
- Kids Workshops
- Adult Workshops
- Holiday Programs
- Private Events
- Special Programs

**Child Categories (examples):**
- Open Studio (all ages) → under "Open Studio"
- Little Ones Fri (ages 2-4) → under "Little Ones"
- The Story of Art Club (ages 4-8) → under "Kids Workshops"
- Creative Saturdays (ages 5+) → under "Adult Workshops"
- Holiday Little Ones (ages 2-4) → under "Holiday Programs"
- Storytime → under "Special Programs"

### 4. Vue Composable
- **File:** `app/src/composables/useEventCategories.js`
- **Methods:**
  - `fetchCategories(options)` - Fetch all categories with filtering
  - `fetchCategoryById(id)` - Get single category
  - `createCategory(data)` - Create new category
  - `updateCategory(id, updates)` - Update existing category
  - `deleteCategory(id)` - Delete category
  - `reorderCategories(orderedIds)` - Reorder categories
- **Computed Properties:**
  - `parentCategories` - Top-level categories only
  - `childCategories` - Child categories only
  - `hierarchicalCategories` - Flattened hierarchy for dropdowns
  - `getChildCategories(parentId)` - Get children of specific parent

### 5. Admin UI Components

#### EventCategoriesList.vue
- **Route:** `/admin/events/categories`
- **Features:**
  - Hierarchical table view of all categories
  - Visual indicators for parent/child relationships
  - Color and icon display
  - Age range formatting
  - Active/inactive status badges
  - Edit and delete actions
  - Create new category button

#### CategoryModal.vue
- **Features:**
  - Create/Edit modal form
  - All category fields editable
  - Parent category selection
  - Age range inputs (min/max)
  - Color picker (hex input)
  - Icon name input
  - Active status toggle
  - Form validation
  - Error handling

### 6. Updated Components

#### EventFields.vue
- **Changes:**
  - Replaced hardcoded category dropdown with dynamic categories from database
  - Uses `useEventCategories` composable
  - Displays categories in grouped optgroups (parent → children)
  - Changed field from `category` (string) to `category_id` (UUID)
  - Loading and error states

#### OfferingsForm.vue
- **Changes:**
  - Updated `saveEventData()` to save `category_id` instead of `category`
  - Updated `loadTypeSpecificData()` to load `category_id` from database
  - Added `waitlist_enabled` field handling

---

## Implementation Steps

### Step 1: Apply Database Migration ⚠️ REQUIRED

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `docs/migrations/add-event-categories.sql`
3. Copy and paste the entire file
4. Run the migration
5. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'event_categories';
   ```
6. Verify seed data:
   ```sql
   SELECT id, name, slug, parent_id, display_order 
   FROM event_categories 
   ORDER BY display_order;
   ```

### Step 2: Update Existing Events (Optional)

If you have existing events with the old `metadata.category` field, you may want to migrate them to use `category_id`:

```sql
-- Example: Update events to use new category_id
-- This is a manual process based on your existing data
UPDATE offering_events 
SET category_id = (SELECT id FROM event_categories WHERE slug = 'open-studio-all-ages')
WHERE offering_id IN (
  SELECT id FROM offerings WHERE metadata->>'category' = 'open'
);
```

### Step 3: Test the System

1. **Navigate to Admin Panel:**
   - Go to `/admin/events/categories`
   - Verify all seeded categories are visible

2. **Test Category Management:**
   - Create a new category
   - Edit an existing category
   - Delete a test category
   - Verify hierarchy display

3. **Test Event Creation:**
   - Go to `/admin/offerings/new`
   - Select "Event" type
   - Verify category dropdown shows hierarchical categories
   - Create a test event with a category
   - Verify category is saved correctly

4. **Test Event Editing:**
   - Edit an existing event
   - Change the category
   - Save and verify changes persist

---

## Database Schema Reference

### event_categories Table
```sql
CREATE TABLE event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  color_hex TEXT,
  icon TEXT,
  age_range JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### offering_events Table (Updated)
```sql
ALTER TABLE offering_events 
ADD COLUMN category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL;
```

---

## API Usage Examples

### Fetch Active Categories
```javascript
import { useEventCategories } from '@/composables/useEventCategories'

const { fetchCategories, categories } = useEventCategories()

// Fetch only active categories
await fetchCategories({ activeOnly: true })
```

### Create New Category
```javascript
const { createCategory } = useEventCategories()

await createCategory({
  name: 'New Workshop Type',
  slug: 'new-workshop-type',
  description: 'Description here',
  parent_id: null, // or parent UUID
  age_range: { min: 5, max: 12 },
  display_order: 10,
  color_hex: '#FF6B6B',
  icon: 'palette',
  is_active: true
})
```

### Get Hierarchical Categories for Dropdown
```javascript
const { hierarchicalCategories } = useEventCategories()

// Returns array with level indicators
// [
//   { id: '...', name: 'Open Studio', level: 0, isParent: true },
//   { id: '...', name: 'Open Studio (all ages)', level: 1, isParent: false },
//   ...
// ]
```

---

## Future Enhancements

1. **Drag-and-Drop Reordering:** Implement visual reordering of categories
2. **Category Analytics:** Track which categories are most popular
3. **Category Images:** Add featured images for categories
4. **Multi-level Hierarchy:** Support more than 2 levels if needed
5. **Category Filters:** Add filtering on public event listings by category
6. **Bulk Operations:** Bulk activate/deactivate categories
7. **Category Templates:** Pre-defined category sets for different event types

---

## Troubleshooting

### Categories Not Showing in Dropdown
- Check that categories are marked as `is_active = true`
- Verify the composable is fetching with `activeOnly: true`
- Check browser console for errors

### Migration Fails
- Ensure you're running the migration on the correct database
- Check for existing `event_categories` table conflicts
- Verify foreign key constraints are valid

### RLS Policy Issues
- Ensure user has admin role: `raw_user_meta_data->>'role' = 'admin'`
- Check Supabase logs for policy violations
- Verify RLS is enabled on the table

---

## Files Changed/Created

### Created Files
- `docs/migrations/add-event-categories.sql` - Database migration
- `app/src/composables/useEventCategories.js` - Vue composable
- `app/src/views/admin/EventCategoriesList.vue` - Admin list view
- `app/src/components/admin/CategoryModal.vue` - Create/Edit modal
- `docs/event-categories-implementation.md` - This document

### Modified Files
- `app/src/components/admin/EventFields.vue` - Dynamic category dropdown
- `app/src/views/admin/OfferingsForm.vue` - Save/load category_id
- `app/src/router/index.js` - Added route for category management

---

## Conclusion

The event category management system is now fully implemented and ready for use. Admins can manage categories through the UI at `/admin/events/categories`, and the system will dynamically populate category dropdowns throughout the application.

**Next Steps:**
1. Apply the database migration
2. Test the category management UI
3. Create/edit events using the new category system
4. Consider implementing future enhancements as needed

