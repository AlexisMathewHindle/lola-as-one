# Naming Conventions

**Last Updated:** 2026-01-31

## Purpose
Establish consistent naming patterns for slugs, categories, tags, and other content identifiers to ensure clean URLs, predictable data structure, and maintainability.

---

## Slugs

### Definition
A slug is a URL-friendly identifier derived from the content title.

### Rules
1. **Auto-generated from title** on initial save
2. **Editable** by admin/editor (with warning if already published)
3. **Format:**
   - Lowercase only
   - Alphanumeric characters and hyphens
   - No spaces, special characters, or underscores
   - Max length: 100 characters
4. **Uniqueness:** Must be unique within offering type (events can share slug with products)

### Examples
| Title | Generated Slug |
|-------|----------------|
| "Summer Yoga Retreat 2026" | `summer-yoga-retreat-2026` |
| "Handmade Ceramic Bowl" | `handmade-ceramic-bowl` |
| "Women's Circle: Full Moon" | `womens-circle-full-moon` |

### Edge Cases
- **Duplicate titles:** Append `-2`, `-3`, etc. (`yoga-workshop`, `yoga-workshop-2`)
- **Special characters:** Strip or convert (`"Café & Co."` → `cafe-co`)
- **Emojis:** Remove (`"🌙 Moon Ritual"` → `moon-ritual`)

---

## Categories

### Definition
Predefined, hierarchical groupings for organizing offerings. Used for navigation and filtering.

### Rules
1. **Predefined list** — Admins manage the master category list
2. **Multi-select** — Offerings can belong to multiple categories
3. **Hierarchical** (optional in v1) — Parent/child relationships (e.g., `Wellness > Yoga`)
4. **Format:**
   - Title case
   - Singular or plural (be consistent within domain)
   - Max 3 words recommended

### Suggested Categories (Events)
- Workshops
- Retreats
- Classes
- Community Gatherings
- Wellness
- Arts & Crafts
- Spiritual Practices

### Suggested Categories (Products)
- Apparel
- Home Goods
- Wellness Products
- Art & Decor
- Books & Media
- Handmade Goods

### Category Slugs
Auto-generated from category name using same slug rules:
- `Workshops` → `workshops`
- `Arts & Crafts` → `arts-crafts`

---

## Tags

### Definition
Free-form keywords for flexible content discovery. More granular than categories.

### Rules
1. **Free-form** — Editors can create new tags on the fly
2. **Multi-select** — Unlimited tags per offering
3. **Format:**
   - Lowercase
   - Hyphenated for multi-word tags
   - Max 30 characters per tag
4. **Suggestions:** CMS should suggest existing tags to avoid duplicates

### Examples
- `beginner-friendly`
- `outdoor`
- `vegan`
- `full-moon`
- `limited-capacity`
- `online`
- `in-person`
- `eco-friendly`
- `handmade`

### Tag Hygiene
- **Avoid duplicates:** `yoga` vs `yoga-class` (choose one)
- **Use hyphens, not underscores:** `full-moon` not `full_moon`
- **Periodic cleanup:** Admins should merge/delete unused tags

---

## File Naming (Images & Media)

### Rules
1. **Auto-rename on upload** to avoid conflicts
2. **Format:** `{offering-slug}-{timestamp}.{ext}`
3. **Example:** `summer-yoga-retreat-2026-1738368000.jpg`

### Original Filename Preservation
- Store original filename in metadata for reference
- Display original name in CMS UI

---

## Database Field Naming

### Conventions
- **Snake case** for database columns: `created_at`, `featured_image_url`
- **Camel case** for API responses (if using JSON): `createdAt`, `featuredImageUrl`
- **Consistency:** Pick one and stick with it across the stack

### Reserved Fields
All offerings (events and products) should have:
- `id` — Unique identifier (UUID or auto-increment)
- `title` — Display name
- `slug` — URL-friendly identifier
- `description` — Rich text content
- `status` — `draft`, `scheduled`, `published`, `archived`
- `created_at` — Timestamp
- `updated_at` — Timestamp
- `published_at` — Timestamp (null if not published)
- `featured_image_url` — Image path

---

## API Endpoint Naming

### REST Conventions
- **Plural nouns** for collections: `/api/events`, `/api/products`
- **Singular for single resource:** `/api/events/{slug}` or `/api/events/{id}`
- **Actions as verbs (if needed):** `/api/events/{id}/publish`, `/api/events/{id}/archive`

### Examples
```
GET    /api/events              # List all events
GET    /api/events/{slug}       # Get single event
POST   /api/events              # Create new event
PUT    /api/events/{id}         # Update event
DELETE /api/events/{id}         # Delete event
POST   /api/events/{id}/publish # Publish event
```

---

## Frontend Route Naming

### URL Structure
```
/events                          # Event listing page
/events/{slug}                   # Single event page
/events/category/{category-slug} # Events by category
/products                        # Product listing page
/products/{slug}                 # Single product page
```

### Admin Routes
```
/admin/events                    # Event management
/admin/events/new                # Create new event
/admin/events/{id}/edit          # Edit event
/admin/products                  # Product management
/admin/categories                # Category management
```

---

## Summary

**Key Principles:**
1. **Consistency** — Use the same patterns everywhere
2. **Readability** — Humans should understand URLs and identifiers
3. **SEO-friendly** — Clean slugs improve search rankings
4. **Collision-proof** — Unique identifiers prevent conflicts
5. **Maintainable** — Easy to refactor and extend

**When in doubt:** Favor simplicity and clarity over cleverness.

