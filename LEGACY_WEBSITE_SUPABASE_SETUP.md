# Legacy Website Supabase Integration

## Overview

Your legacy Lola Workshops website (in `/lola-workshops`) currently uses Firebase Firestore to fetch events. This guide shows you how to switch it to use Supabase instead, where all your events have already been migrated.

## What's Been Set Up

### ✅ Installed Dependencies
- `@supabase/supabase-js` package installed in `/lola-workshops`

### ✅ Created Files

1. **`lola-workshops/src/lib/supabase.ts`**
   - Supabase client configuration
   - Helper functions to fetch events
   - Data transformation utilities

2. **`lola-workshops/.env.example`**
   - Environment variable template
   - Configuration for Supabase credentials

3. **`lola-workshops/SUPABASE_README.md`**
   - Quick start guide
   - Overview of changes

4. **`lola-workshops/SUPABASE_MIGRATION_GUIDE.md`**
   - Detailed migration instructions
   - Code examples for updating components
   - Field mapping reference

5. **`lola-workshops/src/components/CalendarComponent.SUPABASE_EXAMPLE.vue`**
   - Example showing how to update a component
   - Side-by-side comparison with Firebase code

6. **`lola-workshops/setup-supabase.sh`**
   - Setup script to create `.env.local`

## Quick Start

### Step 1: Navigate to Legacy Website

```bash
cd lola-workshops
```

### Step 2: Run Setup Script

```bash
./setup-supabase.sh
```

### Step 3: Add Supabase Credentials

Edit `lola-workshops/.env.local`:

```env
VUE_APP_SUPABASE_URL=https://your-project.supabase.co
VUE_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
VUE_APP_DATA_SOURCE=supabase
```

**Get your credentials:**
1. Go to Supabase Dashboard
2. Select your project
3. Go to **Project Settings → API**
4. Copy "Project URL" and "anon/public" key

### Step 4: Update a Component

See the example in `src/components/CalendarComponent.SUPABASE_EXAMPLE.vue`

**Basic pattern:**

```typescript
// OLD (Firebase)
import { db, collection, getDocs } from '@/main'

const fetchEvents = async () => {
  const eventsRef = collection(db, 'events')
  const querySnapshot = await getDocs(eventsRef)
  // ...
}

// NEW (Supabase)
import { fetchEventsFromSupabase, transformSupabaseEventToLegacy } from '@/lib/supabase'

const fetchEvents = async () => {
  const supabaseEvents = await fetchEventsFromSupabase()
  const events = supabaseEvents.map(transformSupabaseEventToLegacy)
  // ...
}
```

### Step 5: Test

```bash
npm run serve
```

Open http://localhost:8080 and verify events load correctly.

## Key Differences

### Firebase vs Supabase Data Structure

**Firebase (Flat):**
```javascript
{
  event_id: "abc123",
  event_title: "Art Workshop",
  date: "2024-03-15",
  start_time: "10:00",
  price: 25.00
}
```

**Supabase (Relational):**
```javascript
{
  id: "uuid-here",
  event_date: "2024-03-15",
  event_start_time: "10:00:00",
  price_gbp: 25.00,
  offering: {
    title: "Art Workshop",
    description_long: "..."
  }
}
```

**Solution:** Use `transformSupabaseEventToLegacy()` to convert Supabase format to Firebase format automatically!

## Available Helper Functions

### `fetchEventsFromSupabase()`
Fetches all published events from Supabase.

```typescript
const events = await fetchEventsFromSupabase()
```

### `fetchEventsByDateRange(startDate, endDate)`
Fetches events within a specific date range (more efficient).

```typescript
const events = await fetchEventsByDateRange('2024-03-01', '2024-03-31')
```

### `fetchEventById(eventId)`
Fetches a single event by ID.

```typescript
const event = await fetchEventById('uuid-here')
```

### `transformSupabaseEventToLegacy(event)`
Converts Supabase event format to legacy Firebase format.

```typescript
const legacyEvent = transformSupabaseEventToLegacy(supabaseEvent)
```

## Components to Update

Priority order:

1. **CalendarComponent.vue** - Main calendar display
2. **EventDetailsView.vue** - Event detail page
3. **EventsView.vue** - Events list (admin)
4. **BasketView.vue** - Shopping basket
5. **SummerView.vue** - Summer workshops
6. **HalfTermView.vue** - Half term events
7. **BookingsListComponent.vue** - Bookings management

## Documentation

- **Quick Start:** `lola-workshops/SUPABASE_README.md`
- **Detailed Guide:** `lola-workshops/SUPABASE_MIGRATION_GUIDE.md`
- **Example Component:** `lola-workshops/src/components/CalendarComponent.SUPABASE_EXAMPLE.vue`
- **Helper Module:** `lola-workshops/src/lib/supabase.ts`

## Next Steps

1. ✅ Set up environment variables
2. ✅ Review the migration guide
3. ✅ Update one component as a test
4. ✅ Verify it works
5. ✅ Update remaining components
6. ✅ Test thoroughly
7. ✅ Deploy!

## Need Help?

All the documentation is in the `lola-workshops` directory. Start with `SUPABASE_README.md` for a quick overview, then dive into `SUPABASE_MIGRATION_GUIDE.md` for detailed instructions.

