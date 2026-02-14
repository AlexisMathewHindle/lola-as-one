# Using Supabase with Legacy Lola Workshops Website

## Quick Start

This legacy website currently uses Firebase. You can now fetch events from Supabase instead!

### 1. Run the Setup Script

```bash
cd lola-workshops
./setup-supabase.sh
```

### 2. Add Your Supabase Credentials

Edit `.env.local` and add:

```env
VUE_APP_SUPABASE_URL=https://your-project.supabase.co
VUE_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
VUE_APP_DATA_SOURCE=supabase
```

Get these from: **Supabase Dashboard → Project Settings → API**

### 3. Update Your Components

See `SUPABASE_MIGRATION_GUIDE.md` for detailed instructions.

## What's Been Added

### New Files

1. **`src/lib/supabase.ts`** - Supabase client and helper functions
   - `fetchEventsFromSupabase()` - Fetch all published events
   - `fetchEventsByDateRange()` - Fetch events in a date range
   - `fetchEventById()` - Fetch a single event
   - `transformSupabaseEventToLegacy()` - Convert Supabase format to Firebase format

2. **`.env.example`** - Environment variable template

3. **`SUPABASE_MIGRATION_GUIDE.md`** - Detailed migration guide

4. **`src/components/CalendarComponent.SUPABASE_EXAMPLE.vue`** - Example component

## How It Works

### Supabase Helper Functions

```typescript
import { 
  fetchEventsFromSupabase, 
  transformSupabaseEventToLegacy 
} from '@/lib/supabase'

// Fetch events
const supabaseEvents = await fetchEventsFromSupabase()

// Transform to legacy format (compatible with existing code)
const events = supabaseEvents.map(transformSupabaseEventToLegacy)
```

### Data Transformation

The `transformSupabaseEventToLegacy()` function converts Supabase's relational structure to match your existing Firebase format:

**Supabase Structure:**
```json
{
  "id": "uuid-here",
  "event_date": "2024-03-15",
  "event_start_time": "10:00:00",
  "offering": {
    "title": "Art Workshop",
    "description_long": "..."
  }
}
```

**Transformed to Legacy Format:**
```json
{
  "event_id": "uuid-here",
  "event_title": "Art Workshop",
  "date": "2024-03-15",
  "start_time": "10:00:00",
  "description": "..."
}
```

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

Update components one at a time:

1. Start with `CalendarComponent.vue`
2. Then `EventDetailsView.vue`
3. Continue with other components
4. Test thoroughly after each change

### Option 2: Switch All at Once

Use environment variable to toggle between Firebase and Supabase:

```typescript
const dataSource = process.env.VUE_APP_DATA_SOURCE || 'firebase'

if (dataSource === 'supabase') {
  // Use Supabase
  const events = await fetchEventsFromSupabase()
} else {
  // Use Firebase
  const eventsRef = collection(db, 'events')
  // ...
}
```

## Components That Need Updating

- [ ] `src/components/CalendarComponent.vue`
- [ ] `src/views/EventDetailsView.vue`
- [ ] `src/views/EventsView.vue`
- [ ] `src/views/BasketView.vue`
- [ ] `src/views/SummerView.vue`
- [ ] `src/views/HalfTermView.vue`
- [ ] `src/components/BookingsListComponent.vue`

## Testing

1. Start dev server: `npm run serve`
2. Open browser console
3. Check for errors
4. Verify events load correctly
5. Test booking flow

## Troubleshooting

### "Cannot find module '@/lib/supabase'"

Make sure TypeScript can find the file. Check `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Events not loading

1. Check browser console for errors
2. Verify `.env.local` has correct credentials
3. Check Network tab for API calls
4. Verify Supabase project has data

### Type errors

The Supabase module is written in TypeScript. If you get type errors, you can:
1. Add `// @ts-ignore` above the import
2. Or update your component to TypeScript

## Benefits of Using Supabase

✅ **Same data** - Events already migrated from Firebase  
✅ **Better performance** - Relational queries are faster  
✅ **Real-time updates** - Built-in subscriptions  
✅ **Better tooling** - Supabase Studio for data management  
✅ **Cost effective** - Generous free tier  

## Need Help?

- Read `SUPABASE_MIGRATION_GUIDE.md`
- Check example: `src/components/CalendarComponent.SUPABASE_EXAMPLE.vue`
- Compare with new app: `/app/src/views/Workshops.vue`

