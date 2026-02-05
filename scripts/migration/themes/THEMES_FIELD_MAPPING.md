# Firebase Themes to Supabase Field Mapping Reference

This document provides a comprehensive mapping between Firebase themes collection fields and Supabase schema.

## 🗂️ Schema Overview

Supabase uses a **two-table structure** for events:

1. **`offerings`** - Content shell (shared across all offering types)
2. **`offering_events`** - Event-specific details (dates, times, location, pricing)

## 📊 Complete Field Mapping

### Offerings Table (Content Shell)

| Firebase Themes Field | Supabase Field | Type | Notes |
|----------------------|----------------|------|-------|
| `event_title` | `title` | TEXT | **Required** - Event title |
| `theme_title` | `description_short` | TEXT | Brief summary/theme description |
| - | `description_long` | TEXT | Not available in themes (set to null) |
| - | `featured_image_url` | TEXT | Not available in themes (set to null) |
| `passed` | `status` | TEXT | Maps to 'archived' if true, 'published' if false |
| `theme_id` | `metadata.theme_id` | JSONB | Theme identifier |
| `event_id` | `metadata.event_id` | JSONB | Event type identifier |
| `term` | `metadata.term` | JSONB | Term/season identifier |
| `id` or `firebaseId` | `metadata.firebase_id` | JSONB | Original Firebase document ID |
| - | `type` | TEXT | Always set to 'event' |
| - | `slug` | TEXT | Auto-generated from title + date |

### Offering Events Table (Event Details)

| Firebase Themes Field | Supabase Field | Type | Notes |
|----------------------|----------------|------|-------|
| `date` | `event_date` | DATE | **Required** - Format: YYYY-MM-DD |
| `start_time` | `event_start_time` | TIME | **Required** - Format: HH:MM:SS |
| `end_time` | `event_end_time` | TIME | Format: HH:MM:SS |
| - | `location_name` | TEXT | Default: 'Lola As One Studio' |
| - | `location_address` | TEXT | Not available (set to null) |
| - | `location_city` | TEXT | Not available (set to null) |
| - | `location_postcode` | TEXT | Not available (set to null) |
| `originalStock` | `max_capacity` | INTEGER | **Required** - Maximum attendees |
| `originalStock - stock` | `current_bookings` | INTEGER | Calculated from stock difference |
| `price` | `price_gbp` | DECIMAL(10,2) | Price in GBP (default: 0.00) |
| - | `vat_rate` | DECIMAL(5,2) | Default: 20.00 |
| - | `offering_id` | UUID | Auto-linked to offerings table |

## 🔄 Data Type Conversions

### Dates
Firebase themes use ISO date strings (YYYY-MM-DD format):
```javascript
// Firebase
date: "2026-01-24"

// Supabase
event_date: "2026-01-24"
```

### Times
Firebase times are in HH:MM:SS format:
```javascript
// Firebase
start_time: "13:00:00"
end_time: "14:00:00"

// Supabase
event_start_time: "13:00:00"
event_end_time: "14:00:00"
```

### Status
Firebase `passed` boolean field maps to Supabase `status` enum:

```javascript
// Firebase
passed: true

// Supabase
status: "archived"

// Firebase
passed: false

// Supabase
status: "published"
```

### Capacity Calculation
Current bookings are calculated from stock:

```javascript
// Firebase
originalStock: 10
stock: 3

// Supabase
max_capacity: 10
current_bookings: 7  // (10 - 3)
```

### Metadata (JSONB)
Theme-specific fields are preserved in the `metadata` JSONB column:

```javascript
// Firebase
{
  theme_id: "0YB2P4",
  event_id: "sp01_os_sat_1",
  term: "spring_first_half_term"
}

// Supabase offerings.metadata
{
  "theme_id": "0YB2P4",
  "event_id": "sp01_os_sat_1",
  "term": "spring_first_half_term",
  "firebase_id": "0JisyHrLWmHYr1rtDsrK"
}
```

## 📝 Sample Firebase Theme Document

```json
{
  "theme_id": "0YB2P4",
  "term": "spring_first_half_term",
  "event_id": "sp01_os_sat_1",
  "theme_title": "Open Studio",
  "start_time": "13:00:00",
  "end_time": "14:00:00",
  "date": "2026-01-24",
  "event_title": "Open Studio Sat 1.00 (all ages)",
  "id": "0JisyHrLWmHYr1rtDsrK",
  "originalStock": 2,
  "stock": 0,
  "passed": true
}
```

## 📝 Resulting Supabase Records

### offerings
```json
{
  "type": "event",
  "title": "Open Studio Sat 1.00 (all ages)",
  "slug": "open-studio-sat-100-all-ages-20260124",
  "description_short": "Open Studio",
  "description_long": null,
  "featured_image_url": null,
  "status": "archived",
  "metadata": {
    "theme_id": "0YB2P4",
    "event_id": "sp01_os_sat_1",
    "term": "spring_first_half_term",
    "firebase_id": "0JisyHrLWmHYr1rtDsrK"
  }
}
```

### offering_events
```json
{
  "offering_id": "<uuid>",
  "event_date": "2026-01-24",
  "event_start_time": "13:00:00",
  "event_end_time": "14:00:00",
  "location_name": "Lola As One Studio",
  "max_capacity": 2,
  "current_bookings": 2,
  "price_gbp": "0.00",
  "vat_rate": "20.00"
}
```

## 🚨 Important Notes

1. **Required Fields**: Ensure these Firebase fields exist:
   - `date`
   - `start_time`
   - `event_title` or `theme_title`
   - `originalStock` or `stock`

2. **Missing Data**: The themes collection doesn't include:
   - Long descriptions
   - Images
   - Pricing information (defaults to 0.00)
   - Location details (defaults to 'Lola As One Studio')

3. **Slug Generation**: Slugs are auto-generated from `event_title` + `date` to ensure uniqueness

4. **Historical Events**: Events with `passed: true` are marked as 'archived' status

