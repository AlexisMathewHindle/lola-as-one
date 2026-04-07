# Term Grouping Implementation - Summary

## ✅ What Was Implemented

### Navigation Flow
```
Calendar Event Click
    ↓
CategoryListingView (category slug)
    ↓
Fetches all events for category
    ↓
Separates into:
  - Term Groups (grouped by season/half/year)
  - Single Events (no term data)
    ↓
Displays:
  - TermListComponent (for term groups)
  - SingleListComponentSupabase (for single events)
```

## 📁 Files Modified

### 1. `lola-workshops/src/lib/supabase.ts`
**New Functions:**
- `fetchEventsByCategoryGroupedByTerm(categoryId)` - Main function that:
  - Fetches all events for a category
  - Separates term events from single events
  - Groups term events by unique term key
  - Returns `{ termGroups, singleEvents }`

- `fetchEventsByTerm(season, half, year?)` - Helper function to fetch events for a specific term

### 2. `lola-workshops/src/views/CategoryListingView.vue`
**Changes:**
- Added `TermListComponent` import
- Added `termGroups` and `singleEvents` state
- Modified `fetchCategory()` to call `fetchEventsByCategoryGroupedByTerm()`
- Template now shows both components conditionally:
  ```vue
  <TermListComponent v-if="Object.keys(termGroups).length > 0" />
  <SingleListComponentSupabase v-if="singleEvents.length > 0" />
  ```

### 3. `lola-workshops/src/components/TermListComponent.vue`
**Enhancements:**
- Added `formatTermLabel` import from `@/utils/termFormatters`
- Enhanced term label display to use new format
- Falls back to legacy format if new columns unavailable
- Display logic:
  ```vue
  <p v-if="theme[0]?.term_season && theme[0]?.term_half">
    {{ formatTermLabel(theme[0]) }}
  </p>
  <p v-else-if="theme[0]?.term">
    {{ termStringConvert(theme[0]?.term) }}
  </p>
  ```

### 4. `lola-workshops/src/views/EventDetailsView.vue`
**Changes:**
- Added `fetchEventsByOfferingId` import
- Added `fetchTermEvents()` function
- Fetches all events for the same offering when viewing a term event
- Populates `eventThemes` for `TermListComponent`

## 🎯 How It Works

### For Categories with Term Events:
1. User clicks calendar event → goes to CategoryListingView
2. CategoryListingView fetches category by slug
3. Calls `fetchEventsByCategoryGroupedByTerm(categoryId)`
4. Events with `term_season` and `term_half` are grouped by term
5. Each term group displays with formatted label (e.g., "Summer - Second Half 2026")
6. User can add entire term to basket

### For Categories with Single Events:
1. Same navigation flow
2. Events without term data go to `singleEvents` array
3. Displayed using `SingleListComponentSupabase`
4. Individual event booking

### For Mixed Categories:
- Both components display
- Term groups appear first
- Single events appear below

## 📊 Database Schema Used

From `offerings` table:
- `term_season` (TEXT) - "autumn", "spring", "summer"
- `term_half` (TEXT) - "first", "second", "full"
- `term_year` (INTEGER) - 2026, 2027, etc.

Populated by: `scripts/migration/migrate-term-data.js`

## 🧪 Testing

To test:
1. Navigate to calendar
2. Click on a term-based event
3. Verify you land on CategoryListingView
4. Check that events are grouped by term with proper labels
5. Verify "Add to basket" works for term groups
6. Test with categories that have both term and single events

## ✨ Key Features

- **Automatic Grouping**: Events automatically grouped by term
- **Backward Compatible**: Works with legacy term format
- **Flexible Display**: Handles term-only, single-only, or mixed categories
- **Clean Separation**: Clear visual distinction between term and single events
- **Formatted Labels**: Beautiful term labels like "Summer - Second Half 2026"

## 🔄 Future Improvements

1. **Optimize SingleListComponentSupabase**: Pass events directly instead of refetching
2. **Add Term Filtering**: Allow users to filter by specific terms
3. **Term Navigation**: Add links to jump between terms
4. **Loading States**: Improve loading UX for term groups

