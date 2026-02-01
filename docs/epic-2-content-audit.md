# Epic 2 — Content Audit

**Last Updated:** 2026-02-01  
**Status:** 🚧 In Progress

---

## Overview

This document inventories all pages from both existing sites to ensure nothing is lost during migration to the unified Lola As One platform.

**Sources:**
- **Lots of Lovely Art (Boxes):** https://www.lotsoflovelyart.org/ — Full sitemap available
- **Lola Creative Space (Workshops):** https://lolacreativespace.com/ — No sitemap (Vue.js app)

---

## Lots of Lovely Art (Boxes Site)

### Page Inventory

**Total Pages:** 36 static pages + 80+ blog posts + 120+ products (from sitemaps)

#### 🛒 E-commerce Core (Must-Have v1)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| Home | `/` | CRITICAL | Main landing page |
| Cart | `/cart/` | CRITICAL | Shopping cart |
| Checkout | `/checkout/` | CRITICAL | Payment flow |
| My Account | `/my-account/` | CRITICAL | Customer dashboard |
| Boxes (Shop) | `/boxes/` | CRITICAL | Main product listing |
| Classic Collection | `/classic-collection/` | HIGH | Product category |
| Subscriptions | `/subscriptions/` | CRITICAL | Subscription landing page |
| Sale Items | `/sale-items/` | HIGH | Clearance products |

#### 📦 Product Categories (Must-Have v1)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| Art Cards | `/art-cards/` | HIGH | Product category |
| Card Kits | `/card-kits/` | HIGH | Product category |
| Craft Kits | `/craft-kits/` | HIGH | Product category |
| Project Booklets | `/project-booklets/` | HIGH | Product category |
| Little Ones Art Cards | `/little-ones-art-cards/` | HIGH | Product category |
| Baskets | `/baskets/` | MEDIUM | Product category |
| Kits and Books | `/kits-and-books/` | HIGH | Product category |
| Books | `/books/` | HIGH | Product category |
| Sketchbooks | `/sketchbooks/` | HIGH | Product category |
| Stationary | `/stationary/` | HIGH | Product category (note: typo in URL) |

#### 🎨 Creative Space / Workshops (Must-Have v1)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| Creative Space | `/creative-space/` | CRITICAL | Workshop landing page (links to lolacreativespace.com) |

#### 🎉 Special Offerings (Must-Have v1)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| Art Parties | `/art-parties/` | HIGH | Party packages |
| Party Bags | `/party-bags/` | MEDIUM | Party supplies |
| Young Adults | `/young-adults/` | MEDIUM | Age-specific offering |
| Gifts & Subscriptions | `/gifts-subscriptions/` | HIGH | Gift landing page |

#### 🎃 Seasonal (Nice-to-Have)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| Halloween | `/halloween/` | LOW | Seasonal campaign page |
| Christmas | `/christmas/` | LOW | Seasonal campaign page |

#### 📄 Informational Pages (Must-Have v1)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| About | `/about/` | HIGH | Company info |
| Contact | `/contact/` | CRITICAL | Contact form |
| Gallery | `/gallery/` | MEDIUM | Customer photos |
| News | `/news/` | MEDIUM | Blog/updates |
| FAQ's | `/faqs/` | HIGH | Customer support |

#### 🏢 Business Pages (Must-Have v1)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| Schools | `/schools/` | MEDIUM | B2B offering |
| Trade | `/trade/` | MEDIUM | Wholesale info |
| Wholesale | `/wholesale/` | MEDIUM | Wholesale landing |
| Wholesale Registration | `/wholesale-registration/` | LOW | B2B signup |
| Wholesale Thank You | `/wholesale-thank-you/` | LOW | Confirmation page |
| Art for Hospitals | `/art-for-hospitals/` | MEDIUM | Special program |

#### ⚖️ Legal Pages (Must-Have v1)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| Terms & Conditions | `/terms-conditions/` | CRITICAL | Legal |
| Privacy Policy | `/privacy-policy/` | CRITICAL | GDPR compliance |

#### 📝 Activity Content (Nice-to-Have)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| Art Activity Booklet | `/art-activity-booklet/` | LOW | Downloadable content |

#### 📝 Blog Posts (80+ posts)

**Total Blog Posts:** 80+ articles (from post-sitemap.xml)

**Content Categories:**
- **Artist Features & Interviews** (~15 posts)
  - Q&A with artists (Marion Deuchars, Christine Berrie, Shana Gozansky, etc.)
  - "In the Art Studio" series (Molly Mahon, Ginnie Chadwyck-Healey, Calandre Orton)
  - Artist collaborations (Donna Wilson, Andrea Myers)

- **Art Projects & Tutorials** (~25 posts)
  - Seasonal crafts (Halloween, Christmas, Easter, Valentine's)
  - Technique tutorials (collage, painting, textile crafts)
  - Nature-based projects (outdoor art, nature mandalas)

- **Book Recommendations** (~10 posts)
  - Art books for children
  - Artist biographies (Little People Big Dreams series)
  - Creative activity books

- **Educational Content** (~15 posts)
  - Art education advocacy
  - Benefits of art for children
  - Mental health & creativity

- **Event Coverage** (~10 posts)
  - Craft fairs (Daylesford, Spirit of Christmas, Babyccino)
  - Exhibition reviews (Bridget Riley, Olafur Eliasson)

- **Product Launches & News** (~10 posts)
  - New box releases
  - Seasonal collections
  - Brand collaborations

**Priority Assessment:**
- **Must-Have v1:** Blog landing page, recent posts (last 2 years)
- **Nice-to-Have:** Full archive, category filtering, search
- **Legacy:** Very old posts (2019-2020) could be archived

**Schema Implications:**
- Need `blog_posts` table or use `content_pages` with type field
- Categories/tags for filtering
- Author attribution (for guest artists)
- Featured images (all posts have hero images)

---

#### 🛍️ Products (120+ items)

**Total Products:** 120+ SKUs (from product-sitemap.xml)

**Product Categories:**

1. **Art Boxes (Main Products)** (~30 boxes)
   - Themed boxes: Lots of Love, Awesome Animals, Delicious Delights, Beautiful Bugs, etc.
   - Seasonal boxes: Christmas in a Box, Enchanting Easter, Horrifying Halloween
   - Age-specific: Inspired by Nature (little ones), Me Myself and I (teens)

2. **Subscriptions** (3 tiers)
   - 3-month subscription
   - 6-month subscription
   - Every other month subscription

3. **Sketchbooks** (~15 items)
   - Themed sketchbooks (From the Heart, Stunning Space, Bold Beasts, etc.)
   - Some with watercolour paints/pencils included

4. **Activity Booklets** (~10 items)
   - Project booklets (Street Art, Awesome Animals, Lots of Love, etc.)
   - Standalone activities

5. **Books** (~20 items)
   - Little People Big Dreams series (artist biographies)
   - Art activity books
   - Educational books

6. **Art Supplies & Materials** (~15 items)
   - Baskets (Artist, Art, Palette, Heart, Flower, Rainbow, Peace, Creative)
   - Watercolour brush pens
   - Bath paint sticks
   - Stamps and tape

7. **Fabric & Accessories** (~15 items)
   - Sewn garlands (Blossom, Love Birds, Butterflies)
   - Iron-on patches (Artist, Sloth, Moka Pot, Love Choc, Love Tape)
   - Fabric cases (Parrot, Whale)
   - Handy bags

8. **Party Supplies** (~6 items)
   - Party kits for 8 or 12 (Under the Sea, Wild Animals, Magic Potions)

9. **Journals & Notebooks** (~5 items)
   - HappySelf journals (ages 3-5, 6-12, teens)
   - Notebooks

10. **Miscellaneous** (~10 items)
    - Prints, magnets, bookmarks, ribbons, etc.
    - Donation products (hospital art boxes)

**Priority Assessment:**
- **Must-Have v1:** All active products (boxes, subscriptions, sketchbooks, books)
- **Nice-to-Have:** Full accessories catalog, party supplies
- **Legacy:** Out-of-stock items, discontinued products

**Schema Implications:**
- ✅ `offerings` + `offering_products` tables support this
- ✅ `inventory_items` tracks stock for physical products AND subscription boxes
- Product variants needed (e.g., sketchbook vs sketchbook + paints)
- Product categories/collections for filtering
- Sale/clearance pricing support
- Product images (multiple per product)

---

## Lola Creative Space (Workshops Site)

### Page Inventory

**Note:** Site is a Vue.js application with no sitemap.xml. Structure confirmed by user.

**Total Pages:** ~5-10 pages (calendar-based navigation)

#### 🎨 Workshop Core (Must-Have v1)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| Home | `/` | CRITICAL | Main landing page |
| Calendar View | `/` or `/workshops` | CRITICAL | All workshops displayed in calendar format |
| Event Details | `/event-details/:id` | CRITICAL | Individual workshop page (dynamic, by event ID) |
| Adult Workshops | `/adult-art-workshops` | HIGH | Filtered view of adult workshops |
| Holiday Workshops | TBD | HIGH | Filtered view of holiday workshops |

#### 📄 Informational Pages (Confirmed)
| Page | URL | Priority | Notes |
|------|-----|----------|-------|
| About | `/about` | HIGH | Exists (will be merged with boxes site About) |
| Contact | `/contact` | HIGH | Exists (will be merged with boxes site Contact) |
| FAQ's | `/faqs` | MEDIUM | Exists (will be merged with boxes site FAQs) |
| Terms & Conditions | `/terms` | HIGH | Exists (booking policies) |
| Privacy Policy | `/privacy` | HIGH | Likely exists |

#### 🔑 Key Architecture Notes

**Workshop Organization:**
- **Primary Navigation:** Calendar view showing all workshops
- **Workshop Categories:** Open Studio, Little Ones, Adult, Holiday, Other Age Groups
- **Filtering:** Workshops can be filtered by category
- **Dynamic Pages:** Individual workshop pages use event ID (`/event-details/:id`)
- **All workshops shown in calendar** — Filtered by type/category

**Account System:**
- ✅ **v1:** Guest checkout only (no customer accounts required)
- 🔄 **Nice-to-have:** Customer accounts for booking history, saved details

**Schema Mapping:**
- ✅ `offerings` table (type: 'event') — Represents workshop concepts
- ✅ `offering_events` table — Represents specific workshop dates/times
- ✅ `event_capacity` table — Tracks available spaces per workshop session
- ✅ Event ID from current site → `offering_events.id` in new schema
- ✅ Workshop categories → `offerings.metadata` JSONB field or new `offering_categories` table

**Booking Flow (Confirmed):**
1. Browse calendar → Select workshop → Event details page (`/event-details/:id`)
2. Click "Book" → Guest checkout (Stripe)
3. Confirmation → Email confirmation (no account dashboard in v1)

---

## Summary & Key Findings

### Lots of Lovely Art (COMPLETE ✅)

**Total Content:**
- 36 static pages
- 80+ blog posts
- 120+ products
- 3 subscription tiers

**Key Insights:**
1. **Heavy blog content** — Need robust blog/CMS system (80+ posts covering artist interviews, tutorials, book reviews, educational content)
2. **Complex product catalog** — Multiple product types (boxes, books, supplies, accessories, party kits)
3. **Subscription model** — Already confirmed in schema (3-month, 6-month, every-other-month)
4. **Party kits** — New product type (kits for 8 or 12 people) - can use `offering_products`
5. **Digital downloads** — Activity booklets could be digital products
6. **Artist collaborations** — Need to track guest artists/contributors for blog posts

**Schema Validation:**
- ✅ `content_pages` — Supports static pages
- ✅ `offerings` + `offering_products` — Supports product catalog
- ✅ `subscriptions` — Supports subscription model
- ✅ `inventory_items` — Tracks stock for products AND subscription boxes
- ⚠️ **Potential Gap:** Blog posts (could extend `content_pages` with `page_type` field: 'static', 'blog_post')
- ⚠️ **Potential Gap:** Product variants (e.g., sketchbook vs sketchbook + paints) - may need `product_variants` table
- ⚠️ **Potential Gap:** Product categories/collections for filtering

### Lola Creative Space (COMPLETE ✅)

**Total Content:**
- ~5-10 static pages (Home, About, Contact, FAQs, Terms, Privacy)
- Dynamic workshop pages (by event ID)
- Calendar-based navigation
- 5 workshop categories (Open Studio, Little Ones, Adult, Holiday, Other Age Groups)

**Key Insights:**
1. **Calendar-first design** — All workshops displayed in calendar view
2. **Event ID routing** — Individual workshops use `/event-details/:id` pattern
3. **Category filtering** — 5 categories: Open Studio, Little Ones, Adult, Holiday, Other Age Groups
4. **Guest checkout only** — No customer accounts in v1 (nice-to-have for v2)
5. **Minimal page structure** — Simple, focused on workshop discovery and booking
6. **Shared informational pages** — About, Contact, FAQs will be merged with boxes site

**Schema Validation:**
- ✅ `offerings` (type: 'event') — Workshop concepts (e.g., "Watercolour Landscapes")
- ✅ `offering_events` — Specific workshop sessions with dates/times
- ✅ `event_capacity` — Tracks spaces available per session
- ✅ Event ID mapping — Current event IDs → new `offering_events.id`
- ⚠️ **Potential Gap:** Workshop categories (could use `offerings.metadata` JSONB or new `offering_categories` table)

---

## Page Categorization Summary

### ✅ Must-Have v1 (Critical for Launch)
**Total:** ~30 pages

**E-commerce:**
- Home, Cart, Checkout, My Account
- Boxes/Products listing
- Subscriptions
- Individual product pages (dynamic)

**Workshops:**
- Workshop listing
- Individual workshop pages (dynamic)
- Booking flow

**Informational:**
- About, Contact, FAQ's
- Terms & Conditions, Privacy Policy

### 🔄 Nice-to-Have (Can Launch Without)
**Total:** ~10 pages

- Gallery
- News/Blog
- Seasonal campaign pages (Halloween, Christmas)
- Art Activity Booklet downloads

### ❌ Legacy (Can Be Dropped or Simplified)
**Total:** ~5 pages

- Wholesale Thank You (can be email-based)
- Multiple wholesale pages (consolidate to one)
- Duplicate category pages (consolidate)

---

## Unified Site Strategy (Confirmed)

### Shared Global Pages
**One company-wide page for each:**
- **About** — Single page about Lola as a whole company
- **Contact** — Single contact page for all inquiries
- **FAQs** — Single FAQ page covering both workshops and boxes
- **Terms & Conditions** — Single legal page
- **Privacy Policy** — Single privacy page

### Landing Page Strategy
**Each section has its own landing page with specific content:**
- **Workshops Landing** (`/workshops`) — Hero, intro text, calendar preview specific to workshops
- **Boxes Landing** (`/boxes` or `/shop`) — Hero, intro text, product grid specific to art boxes

### Account System
- ✅ **v1:** Guest checkout for both workshops AND boxes
- 🔄 **v2 (Nice-to-have):** Customer accounts for:
  - Order history
  - Booking history
  - Saved payment details
  - Subscription management (pause/resume/cancel)

### Outstanding Questions
1. **Navigation menus** — Exact header and footer link structure for unified site
2. **Hidden pages** — Any pages not in navigation but still accessible?
3. **Blog integration** — Should blog be shared or boxes-only?

---

## Next Steps

1. ✅ **COMPLETE:** Extract Lots of Lovely Art content (36 pages + 80 posts + 120 products)
2. ✅ **COMPLETE:** Document Lola Creative Space structure (calendar-based, event ID routing)
3. ✅ **COMPLETE:** Confirm unified site strategy (shared pages, landing pages, account system)
4. ⬜ **TODO:** Create URL mapping document (old URLs → new URLs)
5. ⬜ **TODO:** Create final sitemap for unified platform
6. ⬜ **TODO:** Review schema for potential gaps:
   - Blog posts (extend `content_pages` with `page_type`?)
   - Product variants (new table?)
   - Product categories/collections (new table?)
   - Workshop categories (use `offerings.metadata` or new table?)

---

## Related Documents

- [Epic Structure](./epic-structure.md) — Overall roadmap
- [Epic 2 URL Mapping](./epic-2-url-mapping.md) — Old URL → New URL (to be created)
- [Epic 2 Sitemap](./epic-2-sitemap.md) — Final site structure (to be created)

