# Firebase to Supabase Field Mapping Reference

This document provides a comprehensive mapping between Firebase event fields and Supabase schema.

## 🗂️ Schema Overview

Supabase uses a **two-table structure** for events:

1. **`offerings`** - Content shell (shared across all offering types)
2. **`offering_events`** - Event-specific details (dates, times, location, pricing)

## 📊 Complete Field Mapping

### Offerings Table (Content Shell)

| Firebase Field | Supabase Field | Type | Notes |
|---------------|----------------|------|-------|
| `title` | `title` | TEXT | **Required** - Event title |
| `description` | `description_long` | TEXT | Full description |
| `longDescription` | `description_long` | TEXT | Alternative field name |
| `shortDescription` | `description_short` | TEXT | Brief summary |
| `excerpt` | `description_short` | TEXT | Alternative field name |
| `imageUrl` | `featured_image_url` | TEXT | Main event image URL |
| `image` | `featured_image_url` | TEXT | Alternative field name |
| `featuredImage` | `featured_image_url` | TEXT | Alternative field name |
| `published` | `status` | TEXT | Maps to 'published' or 'draft' |
| `status` | `status` | TEXT | Direct mapping if exists |
| `publishedAt` | `published_at` | TIMESTAMPTZ | Publication timestamp |
| `featured` | `featured` | BOOLEAN | Featured event flag |
| `category` | `metadata.category` | JSONB | Stored in metadata object |
| `ageGroup` | `metadata.age_group` | JSONB | Stored in metadata object |
| `ageRange` | `metadata.age_group` | JSONB | Alternative field name |
| `difficulty` | `metadata.difficulty` | JSONB | Stored in metadata object |
| `tags` | `metadata.tags` | JSONB | Array of tags |
| `metaTitle` | `meta_title` | TEXT | SEO title |
| `seoTitle` | `meta_title` | TEXT | Alternative field name |
| `metaDescription` | `meta_description` | TEXT | SEO description |
| `seoDescription` | `meta_description` | TEXT | Alternative field name |
| `createdAt` | `created_at` | TIMESTAMPTZ | Auto-generated in Supabase |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | Auto-generated in Supabase |
| - | `type` | TEXT | Always set to 'event' |
| - | `slug` | TEXT | Auto-generated from title |

### Offering Events Table (Event Details)

| Firebase Field | Supabase Field | Type | Notes |
|---------------|----------------|------|-------|
| `eventDate` | `event_date` | DATE | **Required** - Format: YYYY-MM-DD |
| `date` | `event_date` | DATE | Alternative field name |
| `startTime` | `event_start_time` | TIME | **Required** - Format: HH:MM:SS |
| `eventStartTime` | `event_start_time` | TIME | Alternative field name |
| `endTime` | `event_end_time` | TIME | Format: HH:MM:SS |
| `eventEndTime` | `event_end_time` | TIME | Alternative field name |
| `locationName` | `location_name` | TEXT | Venue name |
| `venue` | `location_name` | TEXT | Alternative field name |
| `location` | `location_name` | TEXT | Alternative field name |
| `address` | `location_address` | TEXT | Street address |
| `locationAddress` | `location_address` | TEXT | Alternative field name |
| `city` | `location_city` | TEXT | City name |
| `locationCity` | `location_city` | TEXT | Alternative field name |
| `postcode` | `location_postcode` | TEXT | Postal code |
| `postalCode` | `location_postcode` | TEXT | Alternative field name |
| `zip` | `location_postcode` | TEXT | Alternative field name |
| `maxCapacity` | `max_capacity` | INTEGER | **Required** - Maximum attendees |
| `capacity` | `max_capacity` | INTEGER | Alternative field name |
| `maxAttendees` | `max_capacity` | INTEGER | Alternative field name |
| `currentBookings` | `current_bookings` | INTEGER | Current number of bookings |
| `bookedSpaces` | `current_bookings` | INTEGER | Alternative field name |
| `price` | `price_gbp` | DECIMAL(10,2) | **Required** - Price in GBP |
| `priceGBP` | `price_gbp` | DECIMAL(10,2) | Alternative field name |
| `vatRate` | `vat_rate` | DECIMAL(5,2) | Default: 20.00 |
| - | `offering_id` | UUID | Auto-linked to offerings table |

## 🔄 Data Type Conversions

### Dates
Firebase dates can be in various formats. The transformation script handles:
- Firebase Timestamp objects → ISO string → SQL DATE
- ISO strings → SQL DATE
- Date objects → SQL DATE

**Example:**
```javascript
// Firebase
eventDate: Timestamp { seconds: 1704067200, nanoseconds: 0 }
// or
eventDate: "2024-01-01T00:00:00.000Z"

// Supabase
event_date: "2024-01-01"
```

### Times
Firebase times are converted to SQL TIME format:
- "10:00" → "10:00:00"
- "14:30:00" → "14:30:00"
- ISO timestamp → extract time portion

**Example:**
```javascript
// Firebase
startTime: "10:00"
// or
startTime: "2024-01-01T10:00:00.000Z"

// Supabase
event_start_time: "10:00:00"
```

### Status
Firebase boolean `published` field maps to Supabase `status` enum:

```javascript
// Firebase
published: true

// Supabase
status: "published"

// Firebase
published: false

// Supabase
status: "draft"
```

### Metadata (JSONB)
Custom fields are preserved in the `metadata` JSONB column:

```javascript
// Firebase
{
  category: "Adult Workshops",
  ageGroup: "18+",
  difficulty: "Beginner",
  instructor: "Jane Doe",
  materials: ["clay", "tools"]
}

// Supabase offerings.metadata
{
  "category": "Adult Workshops",
  "age_group": "18+",
  "difficulty": "Beginner",
  "instructor": "Jane Doe",
  "materials": ["clay", "tools"]
}
```

## 🎯 Common Firebase Structures

### Structure 1: Flat Event Object
```javascript
{
  title: "Pottery Workshop",
  description: "Learn pottery basics",
  eventDate: "2024-03-15",
  startTime: "10:00",
  price: 45.00,
  maxCapacity: 12
}
```

### Structure 2: Nested Event Details
```javascript
{
  title: "Pottery Workshop",
  description: "Learn pottery basics",
  eventDetails: {
    date: "2024-03-15",
    startTime: "10:00",
    endTime: "12:00"
  },
  location: {
    name: "Studio A",
    address: "123 Main St",
    city: "London"
  },
  pricing: {
    amount: 45.00,
    currency: "GBP"
  }
}
```

### Structure 3: With Timestamps
```javascript
{
  title: "Pottery Workshop",
  description: "Learn pottery basics",
  eventDate: Timestamp { seconds: 1710489600 },
  createdAt: Timestamp { seconds: 1704067200 },
  published: true
}
```

## 🛠️ Customizing the Transformation

If your Firebase structure differs, edit `2-transform-data.js`:

### Example: Nested Location Object
```javascript
// If your Firebase has nested location:
// location: { name: "Studio A", address: "123 Main St", city: "London" }

const offeringEvent = {
  // ... other fields ...
  location_name: firebaseEvent.location?.name || null,
  location_address: firebaseEvent.location?.address || null,
  location_city: firebaseEvent.location?.city || null,
};
```

### Example: Different Price Field
```javascript
// If your Firebase has pricing.amount instead of price:
price_gbp: parseFloat(
  firebaseEvent.pricing?.amount || 
  firebaseEvent.price || 
  0
).toFixed(2),
```

### Example: Custom Metadata Fields
```javascript
metadata: {
  category: firebaseEvent.category || null,
  age_group: firebaseEvent.ageGroup || null,
  // Add your custom fields
  instructor: firebaseEvent.instructor || null,
  materials_provided: firebaseEvent.materialsProvided || false,
  skill_level: firebaseEvent.skillLevel || null,
},
```

## 📝 Notes

1. **Required Fields**: Ensure these Firebase fields exist:
   - `title`
   - `eventDate` (or `date`)
   - `startTime` (or `eventStartTime`)
   - `maxCapacity` (or `capacity`)
   - `price` (or `priceGBP`)

2. **Slug Generation**: Slugs are auto-generated from titles and made unique

3. **Default Values**: Missing optional fields use sensible defaults:
   - `status`: 'draft'
   - `vat_rate`: 20.00
   - `max_capacity`: 10
   - `current_bookings`: 0

4. **Firebase ID Preservation**: Original Firebase IDs are stored in `_firebase_id` for reference

## 🔍 Validation

After transformation, the script validates:
- ✅ All required fields are present
- ✅ Dates are in valid format
- ✅ Times are in valid format
- ✅ Slugs are unique
- ✅ Numeric fields are valid numbers

Errors are logged and saved to the transformation output.

