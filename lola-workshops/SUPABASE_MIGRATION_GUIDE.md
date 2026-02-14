# Supabase Migration Guide for Legacy Website

This guide explains how to switch your legacy Lola Workshops website from Firebase to Supabase.

## Overview

Your legacy website currently fetches events from Firebase Firestore. This guide shows you how to fetch the same data from Supabase instead, where all your events have already been migrated.

## Prerequisites

1. ✅ Supabase client installed (`@supabase/supabase-js`)
2. ✅ Supabase helper module created (`src/lib/supabase.ts`)
3. Your Supabase URL and Anon Key

## Step 1: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   VUE_APP_SUPABASE_URL=https://your-project.supabase.co
   VUE_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   VUE_APP_DATA_SOURCE=supabase
   ```

3. Get your credentials from:
   - Supabase Dashboard → Project Settings → API
   - Copy the "Project URL" and "anon/public" key

## Step 2: Update Components to Use Supabase

### Example: Updating CalendarComponent.vue

**Before (Firebase):**
```typescript
import { db, collection, getDocs } from '@/main'

const fetchEvents = async () => {
  const eventsRef = collection(db, 'events')
  const querySnapshot = await getDocs(eventsRef)
  const events = []
  querySnapshot.forEach((doc) => {
    events.push(doc.data())
  })
  return events
}
```

**After (Supabase):**
```typescript
import { fetchEventsFromSupabase, transformSupabaseEventToLegacy } from '@/lib/supabase'

const fetchEvents = async () => {
  const supabaseEvents = await fetchEventsFromSupabase()
  // Transform to legacy format for compatibility
  const events = supabaseEvents.map(transformSupabaseEventToLegacy)
  return events
}
```

### Example: Updating EventDetailsView.vue

**Before (Firebase):**
```typescript
import { db, doc, getDoc } from '@/main'

const fetchEvent = async (id: string) => {
  const docRef = doc(db, 'events', id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return docSnap.data()
  }
}
```

**After (Supabase):**
```typescript
import { fetchEventById, transformSupabaseEventToLegacy } from '@/lib/supabase'

const fetchEvent = async (id: string) => {
  const event = await fetchEventById(id)
  if (event) {
    return transformSupabaseEventToLegacy(event)
  }
}
```

## Step 3: Key Differences Between Firebase and Supabase

### Data Structure

**Firebase:**
- Single collection: `events`
- Flat structure with all event data

**Supabase:**
- Two tables: `offerings` (content) and `offering_events` (event instances)
- Relational structure with joins

### Field Mapping

| Firebase Field | Supabase Field | Notes |
|----------------|----------------|-------|
| `event_id` | `offering_events.id` | UUID in Supabase |
| `event_title` | `offerings.title` | From joined table |
| `date` | `offering_events.event_date` | ISO date format |
| `start_time` | `offering_events.event_start_time` | Time format |
| `end_time` | `offering_events.event_end_time` | Time format |
| `location` | `offering_events.location_name` | |
| `quantity` | `offering_events.max_capacity` | |
| `price` | `offering_events.price_gbp` | Decimal |

## Step 4: Testing

1. Start the development server:
   ```bash
   npm run serve
   ```

2. Check the browser console for any errors

3. Verify events are loading correctly

4. Test key features:
   - Calendar view
   - Event details page
   - Booking flow

## Step 5: Components to Update

Here are the main components that fetch events from Firebase:

1. ✅ `src/components/CalendarComponent.vue` - Calendar display
2. ✅ `src/views/EventDetailsView.vue` - Event details page
3. ✅ `src/views/EventsView.vue` - Events list (admin)
4. ✅ `src/views/BasketView.vue` - Basket/cart
5. ✅ `src/views/SummerView.vue` - Summer workshops
6. ✅ `src/views/HalfTermView.vue` - Half term events
7. ✅ `src/components/BookingsListComponent.vue` - Bookings list

## Troubleshooting

### Events not loading
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Check network tab to see if API calls are being made

### Data format issues
- Use `transformSupabaseEventToLegacy()` to convert Supabase format to Firebase format
- Check field mappings in the table above

### CORS errors
- Supabase should allow requests from any origin by default
- Check your Supabase project settings if you see CORS errors

## Next Steps

Once you've verified everything works with Supabase:

1. Remove Firebase dependencies (optional)
2. Update all remaining components
3. Test thoroughly before deploying
4. Update deployment configuration

## Need Help?

- Check the Supabase helper module: `src/lib/supabase.ts`
- Review the transformation function for field mappings
- Compare with the new Vue app in `/app` directory

