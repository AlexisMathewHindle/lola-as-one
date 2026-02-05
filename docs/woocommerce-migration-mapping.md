# WooCommerce to Supabase Product Migration Mapping

## Overview
This document maps WooCommerce CSV export columns to the Supabase schema tables for product migration.

## Target Tables
A WooCommerce product will be split across multiple tables:
1. **offerings** - Core content (title, description, images, SEO)
2. **offering_products** - Commerce data (SKU, price, stock, shipping)
3. **categories** + **offering_categories** / **product_categories** - Product categorization
4. **tags** + **offering_tags** - Product tags
5. **inventory_items** - Inventory tracking (recommended)
6. **product_variants** - For variable products (if Type = 'variable')

---

## Column Mapping

### Core Product Data → `offerings` table

| WooCommerce CSV Column | Supabase Column | Type | Notes |
|------------------------|-----------------|------|-------|
| `ID` | - | - | WooCommerce ID - store in metadata for reference |
| `Name` | `title` | TEXT | Product name |
| `Name` (slugified) | `slug` | TEXT | Generate from Name, ensure unique |
| `Short description` | `description_short` | TEXT | Short product description |
| `Description` | `description_long` | TEXT | Full product description (may contain HTML) |
| `Images` (first URL) | `featured_image_url` | TEXT | Extract first image from pipe-separated list |
| `Published` | `status` | TEXT | Map: 1 → 'published', 0 → 'draft' |
| `Published` | `published_at` | TIMESTAMPTZ | Set to NOW() if Published = 1 |
| `Is featured?` | `featured` | BOOLEAN | Map: 1 → TRUE, 0 → FALSE |
| `Type` | `type` | TEXT | Always 'product_physical' (unless Type='virtual' → 'product_digital') |
| `Meta: seo_product_title` | `meta_title` | TEXT | SEO title override |
| `Meta: _yoast_wpseo_metadesc` | `meta_description` | TEXT | SEO meta description |
| Various Meta fields | `metadata` | JSONB | Store WooCommerce ID, brand, age range, etc. |

**Metadata JSONB structure example:**
```json
{
  "woocommerce_id": "12345",
  "brand": "Lola As One",
  "age_range": "3-5",
  "material": "Paper",
  "theme": "Space",
  "gender": "Unisex",
  "educational_focus": "Creativity",
  "original_images": ["url1", "url2", "url3"]
}
```

### Commerce Data → `offering_products` table

| WooCommerce CSV Column | Supabase Column | Type | Notes |
|------------------------|-----------------|------|-------|
| - | `offering_id` | UUID | FK to offerings.id (created above) |
| `SKU` | `sku` | TEXT | Product SKU (must be unique) |
| `Regular price` | `price_gbp` | DECIMAL(10,2) | Regular price in GBP |
| `Tax class` | `vat_rate` | DECIMAL(5,2) | Default 20.00 (standard UK VAT) |
| `In stock?` | `track_inventory` | BOOLEAN | Map: 1 → TRUE, 0 → FALSE |
| `Stock` | `stock_quantity` | INTEGER | Current stock level |
| `Low stock amount` | `low_stock_threshold` | INTEGER | Low stock alert threshold |
| `Type` | `requires_shipping` | BOOLEAN | Map: 'simple'/'variable' → TRUE, 'virtual' → FALSE |
| `Weight (kg)` | `weight_grams` | INTEGER | Convert kg to grams: kg * 1000 |
| - | `available_for_subscription` | BOOLEAN | Default FALSE (set TRUE for subscription boxes) |

### Categories → `categories` + `offering_categories` + `product_categories`

| WooCommerce CSV Column | Supabase Tables | Notes |
|------------------------|-----------------|-------|
| `Categories` | `categories` + `offering_categories` + `product_categories` | Pipe-separated list (e.g., "Sketchbooks\|Kids") |

**Process:**
1. Split `Categories` by `>` (hierarchy) and `|` (multiple categories)
2. For each category:
   - Check if exists in `categories` table (by slug)
   - If not, INSERT into `categories` (name, slug, parent_id if hierarchical)
   - INSERT into `offering_categories` (offering_id, category_id)
   - INSERT into `product_categories` (offering_product_id, category_id)

### Tags → `tags` + `offering_tags`

| WooCommerce CSV Column | Supabase Tables | Notes |
|------------------------|-----------------|-------|
| `Tags` | `tags` + `offering_tags` | Comma-separated list |

**Process:**
1. Split `Tags` by `,`
2. For each tag:
   - Check if exists in `tags` table (by slug)
   - If not, INSERT into `tags` (name, slug)
   - INSERT into `offering_tags` (offering_id, tag_id)

### Inventory → `inventory_items` (recommended)

| WooCommerce CSV Column | Supabase Column | Notes |
|------------------------|-----------------|-------|
| - | `offering_product_id` | FK to offering_products.id |
| `SKU` | `sku` | Same as offering_products.sku |
| - | `item_type` | Always 'product_physical' |
| `Stock` | `quantity_available` | Current stock |
| - | `quantity_reserved` | Default 0 |
| `Low stock amount` | `low_stock_threshold` | Low stock alert |

---

## Fields NOT Migrated (WooCommerce-specific)

These fields are WooCommerce/plugin-specific and won't be migrated:
- All `Meta: _wc_*` fields (WooCommerce internal)
- All `Meta: _yoast_*` fields except SEO title/description
- All `Meta: fb_*` fields (Facebook integration)
- All wholesale/subscription plugin fields
- `Position`, `Button text`, `External URL` (external/affiliate products)
- `Download limit`, `Download expiry days` (unless migrating digital products)

---

## Migration Strategy

See `scripts/migrate-woocommerce-products.ts` for implementation.

