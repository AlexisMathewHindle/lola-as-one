# Epic 3 — URL Strategy + Routing

**Last Updated:** 2026-02-01
**Status:** ✅ Complete
**Epic Owner:** Alexis Hindle

---

## Overview

This document defines the unified URL structure for the Lola As One platform, mapping old URLs from both existing sites to new URLs, and establishing routing patterns for the Vue 3 application.

**Goals:**
- ✅ Preserve SEO with 301 redirects
- ✅ Create intuitive, consistent URL patterns
- ✅ Support both workshops and boxes in one domain
- ✅ Enable future expansion (customer accounts, new content types)

---

## Unified URL Structure

### Core Principles

1. **Flat hierarchy where possible** — Avoid deep nesting
2. **Descriptive slugs** — Clear, readable URLs
3. **Consistent patterns** — Same structure for similar content types
4. **SEO-friendly** — Hyphens, lowercase, no special characters
5. **Future-proof** — Room for growth without breaking changes

---

## URL Patterns by Content Type

### 🏠 Global Pages (Shared)

| Page | New URL | Old URL (Boxes) | Old URL (Workshops) | Notes |
|------|---------|-----------------|---------------------|-------|
| Home | `/` | `/` | `/` | Unified landing page |
| About | `/about` | `/about/` | `/about` | Company-wide story |
| Contact | `/contact` | `/contact/` | `/contact` | All inquiries |
| FAQs | `/faqs` | `/faqs/` | `/faqs` | Combined FAQs |
| Terms | `/terms` | `/terms-conditions/` | `/terms` | Legal policies |
| Privacy | `/privacy` | `/privacy-policy/` | `/privacy` | GDPR compliance |

**Notes:**
- Remove trailing slashes (Vue Router default)
- Shorter URLs for common pages
- Single source of truth for company info

---

### 🎨 Workshops (Events)

| Page | New URL | Old URL | Notes |
|------|---------|---------|-------|
| Workshops Landing | `/workshops` | `/creative-space/` (boxes site) | Main workshop hub |
| Workshop Calendar | `/workshops` | `/` (workshops site) | Default view |
| Workshop Details | `/workshops/:slug` | `/event-details/:id` | SEO-friendly slugs |
| Adult Workshops | `/workshops?category=adult` | `/adult-art-workshops` | Query param filtering |
| Holiday Workshops | `/workshops?category=holiday` | TBD | Query param filtering |
| Little Ones | `/workshops?category=little-ones` | TBD | Query param filtering |
| Open Studio | `/workshops?category=open-studio` | TBD | Query param filtering |

**Routing Pattern:**
```
/workshops                    → Workshop landing + calendar view
/workshops?category=adult     → Filtered calendar view
/workshops/:slug              → Individual workshop details
```

**Slug Format:** `{workshop-name}-{date}` (e.g., `/workshops/watercolour-landscapes-2026-03-15`)

**Why slugs instead of IDs?**
- Better SEO (descriptive URLs)
- Human-readable
- Shareable links
- Still unique (workshop name + date)

---

### 📦 Boxes (Products)

| Page | New URL | Old URL | Notes |
|------|---------|---------|-------|
| Boxes Landing | `/boxes` | `/boxes/` | Main product hub |
| All Products | `/boxes/all` | `/boxes/` | Full catalog |
| Product Details | `/boxes/:slug` | `/product/:slug/` | Individual product |
| Subscriptions | `/boxes/subscriptions` | `/subscriptions/` | Subscription landing |
| Sale Items | `/boxes/sale` | `/sale-items/` | Clearance |

**Product Categories (Collections):**
```
/boxes/classic-collection    → Classic Collection
/boxes/art-cards             → Art Cards
/boxes/card-kits             → Card Kits
/boxes/craft-kits            → Craft Kits
/boxes/sketchbooks           → Sketchbooks
/boxes/books                 → Books
/boxes/party-supplies        → Party Bags + Kits
/boxes/little-ones           → Little Ones products
```

**Routing Pattern:**
```
/boxes                       → Boxes landing page
/boxes/all                   → Full product catalog
/boxes/:category-slug        → Category/collection page
/boxes/:product-slug         → Individual product details
```

**Slug Format:** `{product-name}` (e.g., `/boxes/lots-of-love-art-box`)

**Disambiguation:**
- Categories use plural/descriptive names: `sketchbooks`, `classic-collection`
- Products use singular/specific names: `lots-of-love-art-box`
- If conflict, prefix category with `category-` or use query param

---

### 📝 Blog

| Page | New URL | Old URL | Notes |
|------|---------|---------|-------|
| Blog Landing | `/blog` | `/news/` | All blog posts |
| Blog Post | `/blog/:slug` | `/post/:slug/` | Individual post |
| Category Archive | `/blog?category=:slug` | N/A | Filtered view |
| Tag Archive | `/blog?tag=:slug` | N/A | Filtered view |

**Routing Pattern:**
```
/blog                        → Blog landing (recent posts)
/blog?category=tutorials     → Category filtered view
/blog?tag=watercolour        → Tag filtered view
/blog/:slug                  → Individual blog post
```

**Slug Format:** `{post-title}` (e.g., `/blog/interview-with-marion-deuchars`)

---

### 🛒 Commerce

| Page | New URL | Old URL | Notes |
|------|---------|---------|-------|
| Cart | `/cart` | `/cart/` | Shopping cart |
| Checkout | `/checkout` | `/checkout/` | Payment flow |
| Order Confirmation | `/order/:order-number` | N/A | Post-purchase |
| My Account | `/account` | `/my-account/` | Customer dashboard (v2) |
| Order History | `/account/orders` | N/A | Past orders (v2) |
| Booking History | `/account/bookings` | N/A | Past workshops (v2) |
| Subscriptions | `/account/subscriptions` | N/A | Manage subscriptions (v2) |

**Notes:**
- v1: Guest checkout only (no `/account` routes)
- v2: Customer accounts with order/booking history

---

### 🏢 Business Pages

| Page | New URL | Old URL | Notes |
|------|---------|---------|-------|
| Schools | `/schools` | `/schools/` | B2B offering |
| Trade/Wholesale | `/wholesale` | `/trade/`, `/wholesale/` | Combined page |
| Wholesale Registration | `/wholesale/register` | `/wholesale-registration/` | B2B signup |
| Art for Hospitals | `/hospitals` | `/art-for-hospitals/` | Special program |
| Gallery | `/gallery` | `/gallery/` | Customer photos |

---

### 🎉 Special Pages

| Page | New URL | Old URL | Notes |
|------|---------|---------|-------|
| Art Parties | `/parties` | `/art-parties/` | Party packages |
| Young Adults | `/young-adults` | `/young-adults/` | Age-specific offering |
| Gifts | `/gifts` | `/gifts-subscriptions/` | Gift landing |

---

## URL Redirect Mapping

### Strategy

**All old URLs → 301 Permanent Redirects → New URLs**

Stored in `url_redirects` table:
```sql
CREATE TABLE url_redirects (
  old_url TEXT NOT NULL UNIQUE,
  new_url TEXT NOT NULL,
  redirect_type INTEGER DEFAULT 301,
  is_active BOOLEAN DEFAULT TRUE
);
```

**Implementation:**
- Vue Router middleware checks for redirects before rendering
- Server-side redirects (Supabase Edge Functions) for SEO
- Preserve query parameters where applicable

---

### Critical Redirects (High Traffic)

#### Lots of Lovely Art → Unified Site

```
# Global Pages
/about/                      → /about
/contact/                    → /contact
/faqs/                       → /faqs
/terms-conditions/           → /terms
/privacy-policy/             → /privacy

# Workshops
/creative-space/             → /workshops

# Products
/boxes/                      → /boxes/all
/subscriptions/              → /boxes/subscriptions
/sale-items/                 → /boxes/sale
/classic-collection/         → /boxes/classic-collection
/art-cards/                  → /boxes/art-cards
/card-kits/                  → /boxes/card-kits
/craft-kits/                 → /boxes/craft-kits
/sketchbooks/                → /boxes/sketchbooks
/books/                      → /boxes/books
/project-booklets/           → /boxes/craft-kits
/little-ones-art-cards/      → /boxes/little-ones
/baskets/                    → /boxes/art-supplies
/kits-and-books/             → /boxes/all
/stationary/                 → /boxes/stationery (fix typo)

# Special Pages
/art-parties/                → /parties
/party-bags/                 → /parties
/young-adults/               → /young-adults
/gifts-subscriptions/        → /gifts

# Business Pages
/schools/                    → /schools
/trade/                      → /wholesale
/wholesale/                  → /wholesale
/wholesale-registration/     → /wholesale/register
/art-for-hospitals/          → /hospitals

# Seasonal (Archive or Redirect)
/halloween/                  → /boxes/all?tag=halloween
/christmas/                  → /boxes/all?tag=christmas

# Blog
/news/                       → /blog
/post/:slug/                 → /blog/:slug

# Products (120+ individual redirects)
/product/:slug/              → /boxes/:slug

# Commerce
/cart/                       → /cart
/checkout/                   → /checkout
/my-account/                 → /account (v2 only)

# Misc
/gallery/                    → /gallery
/art-activity-booklet/       → /blog/art-activity-booklet (or archive)
```

#### Lola Creative Space → Unified Site

```
# Global Pages
/about                       → /about
/contact                     → /contact
/faqs                        → /faqs
/terms                       → /terms
/privacy                     → /privacy

# Workshops
/                            → /workshops (homepage redirect)
/event-details/:id           → /workshops/:slug (requires ID→slug mapping)
/adult-art-workshops         → /workshops?category=adult
```

**Note:** Workshop ID→slug mapping requires data migration script to:
1. Generate SEO-friendly slugs from workshop titles + dates
2. Create redirect entries in `url_redirects` table
3. Preserve old event IDs for backward compatibility

---

## Vue Router Configuration

### Route Definitions

```javascript
const routes = [
  // Global Pages
  { path: '/', name: 'Home', component: HomePage },
  { path: '/about', name: 'About', component: AboutPage },
  { path: '/contact', name: 'Contact', component: ContactPage },
  { path: '/faqs', name: 'FAQs', component: FAQsPage },
  { path: '/terms', name: 'Terms', component: TermsPage },
  { path: '/privacy', name: 'Privacy', component: PrivacyPage },

  // Workshops
  { path: '/workshops', name: 'Workshops', component: WorkshopsPage },
  { path: '/workshops/:slug', name: 'WorkshopDetails', component: WorkshopDetailsPage },

  // Boxes (Products)
  { path: '/boxes', name: 'Boxes', component: BoxesLandingPage },
  { path: '/boxes/all', name: 'AllProducts', component: ProductCatalogPage },
  { path: '/boxes/subscriptions', name: 'Subscriptions', component: SubscriptionsPage },
  { path: '/boxes/sale', name: 'Sale', component: SalePage },
  { path: '/boxes/:slug', name: 'ProductOrCategory', component: ProductOrCategoryPage },

  // Blog
  { path: '/blog', name: 'Blog', component: BlogPage },
  { path: '/blog/:slug', name: 'BlogPost', component: BlogPostPage },

  // Commerce
  { path: '/cart', name: 'Cart', component: CartPage },
  { path: '/checkout', name: 'Checkout', component: CheckoutPage },
  { path: '/order/:orderNumber', name: 'OrderConfirmation', component: OrderConfirmationPage },

  // Business Pages
  { path: '/schools', name: 'Schools', component: SchoolsPage },
  { path: '/wholesale', name: 'Wholesale', component: WholesalePage },
  { path: '/wholesale/register', name: 'WholesaleRegister', component: WholesaleRegisterPage },
  { path: '/hospitals', name: 'Hospitals', component: HospitalsPage },
  { path: '/gallery', name: 'Gallery', component: GalleryPage },

  // Special Pages
  { path: '/parties', name: 'Parties', component: PartiesPage },
  { path: '/young-adults', name: 'YoungAdults', component: YoungAdultsPage },
  { path: '/gifts', name: 'Gifts', component: GiftsPage },

  // v2: Customer Accounts (future)
  // { path: '/account', name: 'Account', component: AccountPage, meta: { requiresAuth: true } },
  // { path: '/account/orders', name: 'Orders', component: OrdersPage, meta: { requiresAuth: true } },
  // { path: '/account/bookings', name: 'Bookings', component: BookingsPage, meta: { requiresAuth: true } },
  // { path: '/account/subscriptions', name: 'ManageSubscriptions', component: SubscriptionsPage, meta: { requiresAuth: true } },

  // 404
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundPage }
]
```

### Redirect Middleware

```javascript
// router/middleware/redirects.js
import { supabase } from '@/lib/supabase'

export async function checkRedirects(to, from, next) {
  // Check if URL needs redirect
  const { data: redirect } = await supabase
    .from('url_redirects')
    .select('new_url, redirect_type')
    .eq('old_url', to.path)
    .eq('is_active', true)
    .single()

  if (redirect) {
    // Preserve query params
    const newUrl = redirect.new_url + (to.query ? `?${new URLSearchParams(to.query)}` : '')
    window.location.href = newUrl // Hard redirect for SEO
  } else {
    next()
  }
}

// Apply to router
router.beforeEach(checkRedirects)
```

---

## Sitemap Structure

### Final Sitemap (sitemap.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Global Pages (Priority: 1.0) -->
  <url><loc>https://lolaasone.com/</loc><priority>1.0</priority></url>
  <url><loc>https://lolaasone.com/about</loc><priority>0.8</priority></url>
  <url><loc>https://lolaasone.com/contact</loc><priority>0.8</priority></url>
  <url><loc>https://lolaasone.com/faqs</loc><priority>0.7</priority></url>

  <!-- Workshops (Priority: 0.9) -->
  <url><loc>https://lolaasone.com/workshops</loc><priority>0.9</priority></url>
  <!-- Dynamic: /workshops/:slug for each active workshop -->

  <!-- Boxes (Priority: 0.9) -->
  <url><loc>https://lolaasone.com/boxes</loc><priority>0.9</priority></url>
  <url><loc>https://lolaasone.com/boxes/all</loc><priority>0.8</priority></url>
  <url><loc>https://lolaasone.com/boxes/subscriptions</loc><priority>0.9</priority></url>
  <!-- Dynamic: /boxes/:slug for each product and category -->

  <!-- Blog (Priority: 0.7) -->
  <url><loc>https://lolaasone.com/blog</loc><priority>0.7</priority></url>
  <!-- Dynamic: /blog/:slug for each published post -->

  <!-- Business Pages (Priority: 0.6) -->
  <url><loc>https://lolaasone.com/schools</loc><priority>0.6</priority></url>
  <url><loc>https://lolaasone.com/wholesale</loc><priority>0.6</priority></url>
  <url><loc>https://lolaasone.com/hospitals</loc><priority>0.6</priority></url>
  <url><loc>https://lolaasone.com/gallery</loc><priority>0.6</priority></url>

  <!-- Special Pages (Priority: 0.7) -->
  <url><loc>https://lolaasone.com/parties</loc><priority>0.7</priority></url>
  <url><loc>https://lolaasone.com/gifts</loc><priority>0.7</priority></url>

  <!-- Legal (Priority: 0.5) -->
  <url><loc>https://lolaasone.com/terms</loc><priority>0.5</priority></url>
  <url><loc>https://lolaasone.com/privacy</loc><priority>0.5</priority></url>

</urlset>
```

**Dynamic Sitemaps:**
- `/sitemap-workshops.xml` — All active workshops
- `/sitemap-products.xml` — All products
- `/sitemap-blog.xml` — All published blog posts

**Sitemap Index:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://lolaasone.com/sitemap.xml</loc></sitemap>
  <sitemap><loc>https://lolaasone.com/sitemap-workshops.xml</loc></sitemap>
  <sitemap><loc>https://lolaasone.com/sitemap-products.xml</loc></sitemap>
  <sitemap><loc>https://lolaasone.com/sitemap-blog.xml</loc></sitemap>
</sitemapindex>
```

---

## SEO Considerations

### Meta Tags Strategy

**Global Defaults:**
```html
<title>Lola As One | Creative Workshops & Art Boxes</title>
<meta name="description" content="Discover creative workshops and curated art boxes for all ages. Book workshops or subscribe to monthly art boxes delivered to your door.">
```

**Page-Specific:**
- Workshops: `{Workshop Title} | Lola As One Workshops`
- Products: `{Product Name} | Lola As One Art Boxes`
- Blog: `{Post Title} | Lola As One Blog`

### Canonical URLs

All pages should have canonical URLs to prevent duplicate content:
```html
<link rel="canonical" href="https://lolaasone.com/workshops/watercolour-landscapes-2026-03-15">
```

### Open Graph Tags

For social sharing:
```html
<meta property="og:title" content="{Page Title}">
<meta property="og:description" content="{Page Description}">
<meta property="og:image" content="{Featured Image URL}">
<meta property="og:url" content="{Canonical URL}">
```

---

## Implementation Checklist

### Phase 1: Setup (Week 1)
- [ ] Create `url_redirects` table in Supabase
- [ ] Populate redirects for all old URLs (36 pages + 80 posts + 120 products)
- [ ] Set up Vue Router with route definitions
- [ ] Implement redirect middleware

### Phase 2: Migration (Week 2-3)
- [ ] Generate slugs for all workshops (from event IDs)
- [ ] Generate slugs for all products (from WooCommerce)
- [ ] Generate slugs for all blog posts
- [ ] Create ID→slug mapping table for backward compatibility

### Phase 3: Testing (Week 4)
- [ ] Test all redirects (automated script)
- [ ] Verify SEO meta tags on all pages
- [ ] Generate sitemaps (static + dynamic)
- [ ] Submit sitemaps to Google Search Console

### Phase 4: Launch
- [ ] Deploy Vue app with new routing
- [ ] Monitor 404 errors
- [ ] Fix any broken redirects
- [ ] Update external links (social media, email campaigns)

---

## Summary

**Total URLs:**
- **Static pages:** ~30 pages
- **Dynamic workshops:** ~50-100 workshops (varies by season)
- **Dynamic products:** ~120 products
- **Dynamic blog posts:** ~80 posts
- **Total redirects needed:** ~250+ redirects

**Key Decisions:**
- ✅ Use slugs instead of IDs for SEO
- ✅ Flat hierarchy (avoid deep nesting)
- ✅ Query params for filtering (categories, tags)
- ✅ 301 redirects for all old URLs
- ✅ Separate landing pages for workshops and boxes
- ✅ Unified global pages (About, Contact, FAQs)

**Next Steps:**
- Epic 4: Data migration + slug generation
- Epic 5: Project setup (Vue 3 + Supabase)
- Epic 6: Implement routing + redirects

