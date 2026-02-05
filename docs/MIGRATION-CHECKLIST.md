# WooCommerce Migration Checklist

Use this checklist to ensure a smooth migration from WooCommerce to Supabase.

## Pre-Migration

### Environment Setup
- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created with Supabase credentials
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` set
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` set

### WooCommerce Preparation
- [ ] All products have SKUs assigned
- [ ] Product prices are in GBP
- [ ] Product images are accessible (URLs work)
- [ ] Categories are organized
- [ ] Tags are applied to products
- [ ] Stock quantities are up to date

### Backup
- [ ] Supabase database backed up (if re-running migration)
- [ ] WooCommerce CSV export saved to safe location

---

## Migration

### Export from WooCommerce
- [ ] Navigate to **WooCommerce → Products → All Products**
- [ ] Click **Export** button
- [ ] Select **All columns** (or default export)
- [ ] Download CSV file
- [ ] Verify CSV has expected columns (ID, SKU, Name, etc.)

### Run Migration Script
- [ ] Open terminal in project root
- [ ] Run: `npm run migrate:products path/to/csv`
- [ ] Monitor console output for errors
- [ ] Note any skipped products
- [ ] Review error details if any

### Review Migration Results
- [ ] Check migration summary in console
- [ ] Note success count
- [ ] Note skipped count (expected: variable parent products)
- [ ] Note error count (should be 0 or minimal)
- [ ] Review error details for any failures

---

## Post-Migration Verification

### Database Checks

#### Offerings Table
- [ ] Run query to count migrated products:
  ```sql
  SELECT COUNT(*) FROM offerings WHERE type = 'product_physical';
  ```
- [ ] Verify sample products have correct data:
  ```sql
  SELECT title, slug, status, featured, featured_image_url 
  FROM offerings 
  WHERE type = 'product_physical' 
  LIMIT 10;
  ```

#### Offering Products Table
- [ ] Verify SKUs are unique:
  ```sql
  SELECT sku, COUNT(*) 
  FROM offering_products 
  GROUP BY sku 
  HAVING COUNT(*) > 1;
  ```
  (Should return 0 rows)
  
- [ ] Check prices and stock:
  ```sql
  SELECT op.sku, op.price_gbp, op.stock_quantity, o.title
  FROM offering_products op
  JOIN offerings o ON o.id = op.offering_id
  LIMIT 10;
  ```

#### Inventory Items
- [ ] Verify inventory matches offering_products:
  ```sql
  SELECT 
    ii.sku,
    ii.quantity_available,
    op.stock_quantity,
    CASE 
      WHEN ii.quantity_available = op.stock_quantity THEN '✓'
      ELSE '✗ MISMATCH'
    END as match
  FROM inventory_items ii
  JOIN offering_products op ON op.id = ii.offering_product_id
  LIMIT 20;
  ```

#### Categories
- [ ] Check categories were created:
  ```sql
  SELECT name, slug, parent_id FROM categories ORDER BY name;
  ```
- [ ] Verify category links:
  ```sql
  SELECT 
    o.title,
    c.name as category
  FROM offerings o
  JOIN offering_categories oc ON oc.offering_id = o.id
  JOIN categories c ON c.id = oc.category_id
  LIMIT 10;
  ```

#### Tags
- [ ] Check tags were created:
  ```sql
  SELECT name, slug FROM tags ORDER BY name;
  ```
- [ ] Verify tag links:
  ```sql
  SELECT 
    o.title,
    t.name as tag
  FROM offerings o
  JOIN offering_tags ot ON ot.offering_id = o.id
  JOIN tags t ON t.id = ot.tag_id
  LIMIT 10;
  ```

### Data Quality Checks

- [ ] All products have titles
- [ ] All products have slugs (unique)
- [ ] All products have prices > 0
- [ ] Featured images are valid URLs
- [ ] Metadata JSONB is valid (no parse errors)
- [ ] Categories are correctly hierarchical (if applicable)
- [ ] Stock quantities match WooCommerce export

### Sample Product Verification

Pick 3-5 products and verify manually:

**Product 1: _________________**
- [ ] Title correct
- [ ] Slug correct
- [ ] Description correct
- [ ] Price correct
- [ ] Stock correct
- [ ] Categories correct
- [ ] Tags correct
- [ ] Images correct

**Product 2: _________________**
- [ ] Title correct
- [ ] Slug correct
- [ ] Description correct
- [ ] Price correct
- [ ] Stock correct
- [ ] Categories correct
- [ ] Tags correct
- [ ] Images correct

**Product 3: _________________**
- [ ] Title correct
- [ ] Slug correct
- [ ] Description correct
- [ ] Price correct
- [ ] Stock correct
- [ ] Categories correct
- [ ] Tags correct
- [ ] Images correct

---

## Post-Migration Tasks

### Image Migration (if needed)
- [ ] Identify if images are hosted on old WooCommerce site
- [ ] Download all product images
- [ ] Upload to new hosting (Supabase Storage, Cloudinary, etc.)
- [ ] Update `featured_image_url` in offerings table
- [ ] Update `metadata.original_images` in offerings table

### Frontend Integration
- [ ] Test product listing page
- [ ] Test product detail page
- [ ] Test category filtering
- [ ] Test tag filtering
- [ ] Test search functionality
- [ ] Test cart/checkout with migrated products

### SEO
- [ ] Verify slugs match old WooCommerce URLs (or create redirects)
- [ ] Check meta titles and descriptions
- [ ] Set up 301 redirects in `url_redirects` table if needed

### Cleanup
- [ ] Remove any test products created during migration testing
- [ ] Archive WooCommerce CSV export
- [ ] Document any manual adjustments made

---

## Troubleshooting

### If Products Are Missing
- [ ] Check skipped count in migration summary
- [ ] Verify products have SKUs in WooCommerce
- [ ] Check if products are variable parent products (expected to skip)

### If Prices Are Wrong
- [ ] Verify WooCommerce export has prices in GBP
- [ ] Check for currency conversion issues
- [ ] Manually update in Supabase if needed

### If Images Are Broken
- [ ] Verify image URLs are accessible
- [ ] Check if old WooCommerce site is still live
- [ ] Plan image migration (see Post-Migration Tasks)

### If Categories Are Flat (Not Hierarchical)
- [ ] Check WooCommerce export format (should use `>` for hierarchy)
- [ ] Manually set `parent_id` in categories table if needed

---

## Sign-Off

- [ ] All products migrated successfully
- [ ] Data verified in Supabase
- [ ] Frontend tested
- [ ] Images migrated (if needed)
- [ ] SEO redirects set up (if needed)
- [ ] Migration complete! 🎉

**Migration Date:** _______________  
**Migrated By:** _______________  
**Total Products:** _______________  
**Notes:** _______________________________________________

