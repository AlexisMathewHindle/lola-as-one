# WooCommerce to Supabase Migration Guide

## Overview

This guide walks you through migrating your WooCommerce products to the new Supabase-based schema.

## Prerequisites

1. **WooCommerce CSV Export**
   - In WooCommerce admin, go to: **Products → All Products**
   - Click **Export** at the top
   - Select all columns (or use the default export)
   - Download the CSV file

2. **Environment Variables**
   - Ensure your `.env.local` has:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

3. **Dependencies**
   - Install required packages:
     ```bash
     npm install csv-parse
     ```

## Migration Process

### Step 1: Export from WooCommerce

1. Log into your WooCommerce admin
2. Navigate to **Products → All Products**
3. Click the **Export** button
4. Choose export format: **CSV**
5. Select columns: **All columns** (recommended)
6. Click **Generate CSV**
7. Save the file (e.g., `woocommerce-products.csv`)

### Step 2: Review the CSV

Open the CSV and verify:
- ✅ All products are present
- ✅ SKUs are populated (products without SKUs will be skipped)
- ✅ Prices are in GBP
- ✅ Categories and tags are present
- ✅ Images URLs are accessible

### Step 3: Run the Migration Script

```bash
tsx scripts/migrate-woocommerce-products.ts path/to/woocommerce-products.csv
```

Example:
```bash
tsx scripts/migrate-woocommerce-products.ts ~/Downloads/woocommerce-products.csv
```

### Step 4: Review Migration Results

The script will output:
- ✅ Successfully migrated products
- ⊘ Skipped products (variable parent products, products without SKUs)
- ❌ Errors (with details)

Example output:
```
🚀 WooCommerce Product Migration

📄 Reading CSV: /Users/you/Downloads/woocommerce-products.csv

📊 Found 150 products in CSV

────────────────────────────────────────────────────────────────────────────────

📦 Migrating: Stellar Sketchbook (SKU: SSK-001)
  ✓ Created offering: 123e4567-e89b-12d3-a456-426614174000
  ✓ Created offering_product: 234e5678-e89b-12d3-a456-426614174001
  ✓ Created inventory_item
  ✓ Created category: Sketchbooks
  ✓ Linked 2 categories
  ✓ Linked 3 tags
  ✅ Successfully migrated: Stellar Sketchbook

...

────────────────────────────────────────────────────────────────────────────────

📈 Migration Summary

Total products:     150
✅ Successful:      145
⊘  Skipped:         3
❌ Errors:          2

✨ Migration complete!
```

## What Gets Migrated

### ✅ Migrated Data

| WooCommerce | Supabase Table | Notes |
|-------------|----------------|-------|
| Product name, description | `offerings` | Core content |
| SKU, price, stock | `offering_products` | Commerce data |
| Categories | `categories`, `offering_categories`, `product_categories` | Hierarchical support |
| Tags | `tags`, `offering_tags` | Keyword tagging |
| Images | `offerings.featured_image_url`, `metadata.original_images` | First image as featured |
| Weight | `offering_products.weight_grams` | Converted from kg |
| Stock levels | `inventory_items` | Inventory tracking |
| SEO meta | `offerings.meta_title`, `meta_description` | Yoast SEO fields |
| Product attributes | `offerings.metadata` | Brand, age range, material, etc. |

### ⊘ Skipped Data

- **Variable parent products** (only variations are migrated)
- **Products without SKUs**
- WooCommerce-specific meta fields (`_wc_*`)
- Facebook integration fields (`fb_*`)
- Wholesale plugin fields
- External/affiliate product fields

### 🔄 Data Transformations

1. **Slugs**: Generated from product name, made unique
2. **Status**: `Published=1` → `status='published'`, `Published=0` → `status='draft'`
3. **Featured**: `Is featured?=1` → `featured=true`
4. **Weight**: Converted from kg to grams
5. **Categories**: Hierarchical categories created (e.g., "Parent > Child")
6. **Images**: Pipe-separated list split, first image becomes featured

## Post-Migration Tasks

### 1. Verify Data in Supabase

```sql
-- Check migrated products
SELECT 
  o.title,
  op.sku,
  op.price_gbp,
  op.stock_quantity,
  o.status
FROM offerings o
JOIN offering_products op ON op.offering_id = o.id
WHERE o.type = 'product_physical'
ORDER BY o.created_at DESC
LIMIT 20;

-- Check categories
SELECT name, slug, parent_id FROM categories ORDER BY name;

-- Check inventory
SELECT 
  ii.sku,
  ii.quantity_available,
  ii.quantity_reserved,
  op.stock_quantity
FROM inventory_items ii
JOIN offering_products op ON op.id = ii.offering_product_id
WHERE ii.item_type = 'product_physical';
```

### 2. Update Image URLs (if needed)

If your WooCommerce images are hosted on the old site, you may need to:
1. Download all images
2. Upload to your new hosting (e.g., Supabase Storage, Cloudinary)
3. Update `featured_image_url` and `metadata.original_images`

### 3. Review and Adjust

- Check products with errors in the migration summary
- Verify categories are correctly hierarchical
- Ensure all tags are properly linked
- Test product display on your frontend

## Troubleshooting

### Error: "Missing or invalid price"
- **Cause**: Product has no `Regular price` in WooCommerce
- **Fix**: Add price in WooCommerce and re-export, or manually add in Supabase

### Error: "Failed to create offering: duplicate key value violates unique constraint"
- **Cause**: Slug collision (two products with same name)
- **Fix**: Script auto-appends SKU to slug, but check for manual duplicates

### Products Skipped
- **Variable parent products**: This is expected. Only simple products and variations are migrated
- **No SKU**: Add SKUs in WooCommerce or manually create in Supabase

### Categories Not Hierarchical
- **Cause**: WooCommerce export doesn't use `>` separator
- **Fix**: Manually set `parent_id` in Supabase `categories` table

## Advanced: Dry Run Mode

To test the migration without writing to the database, you can modify the script to log what would be inserted instead of actually inserting.

## Support

For issues or questions:
1. Check the error details in the migration summary
2. Review the mapping document: `docs/woocommerce-migration-mapping.md`
3. Inspect the migration script: `scripts/migrate-woocommerce-products.ts`

