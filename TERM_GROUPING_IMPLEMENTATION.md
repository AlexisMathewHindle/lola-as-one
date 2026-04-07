# Term Grouping Implementation

## Overview
This implementation separates term-based events by term (season, half, year) on category listing pages, while maintaining backward compatibility with single events.

## Navigation Flow
**Calendar → CategoryListingView**
- User clicks on an event in the calendar
- `CalendarComponent.vue` navigates to `CategoryListingView` using the category slug
- `CategoryListingView` displays the category details and all events for that category
- Events are automatically separated into term groups and single events

## Changes Made

### 1. New Supabase Functions (`lola-workshops/src/lib/supabase.ts`)

#### `fetchEventsByTerm(season, half, year?)`
- Fetches all events for a specific term (e.g., "summer", "second", 2026)
- Groups events by `offering_id`
- Returns events in legacy format for compatibility with `TermListComponent`

#### `fetchEventsByCategoryGroupedByTerm(categoryId)`
- Fetches all events for a category
- Automatically separates term-based events from single events
- Groups term events by unique term key: `{season}_{half}_{year}`
- Returns: `{ termGroups: {...}, singleEvents: [...] }`

### 2. Updated CategoryListingView (`lola-workshops/src/views/CategoryListingView.vue`)

**New State:**
- `termGroups` - Object containing events grouped by term
- `singleEvents` - Array of single (non-term) events

**Template Changes:**
- Shows `TermListComponent` when `termGroups` has data
- Shows `SingleListComponentSupabase` when `singleEvents` has data
- Both can display simultaneously if a category has both types

**Fetch Logic:**
- Calls `fetchEventsByCategoryGroupedByTerm()` when category is loaded
- Automatically populates both `termGroups` and `singleEvents`

### 3. Enhanced TermListComponent (`lola-workshops/src/components/TermListComponent.vue`)

**New Features:**
- Imports `formatTermLabel` from `@/utils/termFormatters`
- Displays formatted term labels (e.g., "Summer - Second Half 2026")
- Falls back to legacy term string conversion if new columns not available

**Display Logic:**
```vue
<p v-if="theme[0]?.term_season && theme[0]?.term_half">
  {{ formatTermLabel(theme[0]) }}
</p>
<p v-else-if="theme[0]?.term">
  {{ termStringConvert(theme[0]?.term) }}
</p>
```

## Database Schema

The implementation relies on these columns in the `offerings` table:
- `term_season` (TEXT) - e.g., "autumn", "spring", "summer"
- `term_half` (TEXT) - e.g., "first", "second", "full"
- `term_year` (INTEGER) - e.g., 2026

These columns are populated by the migration script: `scripts/migration/migrate-term-data.js`

## How It Works

### For Term-Based Events:
1. Events with `term_season` and `term_half` are grouped by term
2. Each term group displays with a formatted label
3. All events in the same term are shown together
4. Users can add entire term to basket at once

### For Single Events:
1. Events without term data are treated as single events
2. Displayed using existing `SingleListComponentSupabase`
3. No grouping applied

### Mixed Categories:
If a category has both term and single events:
- Term groups appear first (via `TermListComponent`)
- Single events appear below (via `SingleListComponentSupabase`)

## Example Output

For a category with term events:
```
Book your workshops below

[Event Title] Summer - Second Half 2026 [Stock: 10]
  Fri, 01 Jul 2026 - Theme Title
  Sat, 02 Jul 2026 - Theme Title
  [Add to basket]

[Event Title] Autumn - First Half 2026 [Stock: 8]
  Mon, 15 Sep 2026 - Theme Title
  Tue, 16 Sep 2026 - Theme Title
  [Add to basket]
```

## Testing

To test the implementation:
1. Navigate to a category page with term-based events
2. Verify events are grouped by term with proper labels
3. Check that single events (if any) display separately
4. Confirm "Add to basket" functionality works for term groups

## Backward Compatibility

- Legacy `metadata.term` field still supported
- Falls back to old term string conversion if new columns missing
- Existing single event display unchanged
- Cart functionality preserved

