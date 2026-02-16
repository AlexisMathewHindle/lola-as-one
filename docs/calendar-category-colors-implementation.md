# Calendar Category Colors Implementation

## Overview
Updated the calendar component to use dynamic category colors from the database instead of hardcoded title-based color matching.

## Changes Made

### 1. Fixed RLS Policies for Event Categories
**File:** `scripts/migration/fix-event-categories-rls.sql`

- Dropped the old policy that tried to query `auth.users` table (causing permission denied error)
- Created new policies that check `app_metadata` in JWT directly
- Policies now match the pattern used in other fixed RLS policies

**To apply:**
```sql
-- Run in Supabase SQL Editor
scripts/migration/fix-event-categories-rls.sql
```

### 2. Updated Supabase Data Fetching
**File:** `lola-workshops/src/lib/supabase.ts`

**Changes:**
- Added `category` field to `SupabaseEvent` interface
- Updated all fetch functions to include category data with color information:
  - `fetchEventsFromSupabase()`
  - `fetchEventsByDateRange()`
  - `fetchEventById()`

**Category data now includes:**
```typescript
category?: {
  id: string;
  name: string;
  slug: string;
  color_hex?: string;
  icon?: string;
  parent_id?: string;
}
```

### 3. Updated Calendar Component
**File:** `lola-workshops/src/components/CalendarComponent.vue`

**Changes:**

#### a) Updated `getWorkshopColorClass()` function
- Now checks for `workshop.category.color_hex` first
- Falls back to title-based matching for backwards compatibility
- Returns `color-custom` class when category color is available

#### b) Added `getWorkshopColorStyle()` function
- Returns inline styles with category color when available
- Sets both `backgroundColor` and `borderColor` from category

#### c) Updated `getWorkshopChipColor()` function
- Returns category hex color directly for v-chip components
- Falls back to Vuetify color names for backwards compatibility

#### d) Updated template bindings
- Week view workshop blocks now use: `:style="{ ...getWorkshopStyle(workshop), ...getWorkshopColorStyle(workshop) }"`
- Day view workshop blocks now use: `:style="{ ...getWorkshopStyleDay(workshop), ...getWorkshopColorStyle(workshop) }"`
- This merges position/size styles with color styles

## How It Works

### Priority Order
1. **Category Color (Database)** - If `category.color_hex` exists, use it
2. **Title Matching (Fallback)** - If no category, use hardcoded title-based colors
3. **Default Color** - If neither, use primary color

### Example Flow
```javascript
// Workshop with category
{
  offering: { title: "Open Studio" },
  category: { 
    name: "Open Studio",
    color_hex: "#3B82F6" 
  }
}
// Result: Uses #3B82F6 from category

// Workshop without category
{
  offering: { title: "Open Studio" },
  category: null
}
// Result: Falls back to title matching (blue)
```

## Benefits

1. **Dynamic Colors** - Colors can be changed in the admin panel without code changes
2. **Consistent** - Same color system across all views (calendar, lists, etc.)
3. **Backwards Compatible** - Still works for events without categories
4. **Maintainable** - No need to update code when adding new workshop types

## Testing

After deploying these changes:

1. **Verify category colors display correctly:**
   - Navigate to the calendar view
   - Check that workshops show their category colors
   - Verify colors match what's set in the admin panel

2. **Test admin updates:**
   - Go to admin panel → Event Categories
   - Change a category color
   - Refresh the calendar
   - Verify the new color appears

3. **Test backwards compatibility:**
   - Events without categories should still show colors based on title matching
   - No errors should appear in console

## Next Steps

To fully migrate to category-based colors:

1. **Assign categories to all events** in the database
2. **Remove title-based fallback** once all events have categories
3. **Update other views** (Workshops.vue, etc.) to use category colors consistently

## Related Files

- `app/src/composables/useEventCategories.js` - Category management composable
- `app/src/components/admin/CategoryModal.vue` - Category editing UI
- `docs/migrations/add-event-categories.sql` - Original category table migration

