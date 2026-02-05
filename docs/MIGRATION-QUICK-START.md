# WooCommerce Migration - Quick Start

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create `.env.local` in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Export from WooCommerce

1. Go to **WooCommerce → Products → All Products**
2. Click **Export**
3. Download the CSV file

### 4. Run Migration

```bash
npm run migrate:products path/to/your-export.csv
```

Or directly with tsx:

```bash
tsx scripts/migrate-woocommerce-products.ts ~/Downloads/woocommerce-products.csv
```

### 5. Verify Results

Check the console output for:
- ✅ Successfully migrated products
- ⊘ Skipped products (expected for variable parent products)
- ❌ Errors (review and fix)

---

## 📋 What Happens During Migration

For each product, the script:

1. **Creates an offering** (`offerings` table)
   - Title, slug, descriptions
   - Featured image
   - SEO metadata
   - Product metadata (brand, age range, etc.)

2. **Creates offering_product** (`offering_products` table)
   - SKU, price, VAT rate
   - Stock quantity, low stock threshold
   - Weight, shipping requirements

3. **Creates inventory_item** (`inventory_items` table)
   - Links to offering_product
   - Tracks available/reserved quantities

4. **Links categories** (`categories`, `offering_categories`, `product_categories`)
   - Creates categories if they don't exist
   - Supports hierarchical categories (Parent > Child)

5. **Links tags** (`tags`, `offering_tags`)
   - Creates tags if they don't exist

---

## 🔍 Example Output

```
🚀 WooCommerce Product Migration

📄 Reading CSV: /Users/you/Downloads/wc-products.csv

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

📦 Migrating: Space Adventure Box (SKU: SAB-001)
  ✓ Created offering: 345e6789-e89b-12d3-a456-426614174002
  ✓ Created offering_product: 456e7890-e89b-12d3-a456-426614174003
  ✓ Created inventory_item
  ✓ Linked 1 categories
  ✓ Linked 2 tags
  ✅ Successfully migrated: Space Adventure Box

...

────────────────────────────────────────────────────────────────────────────────

📈 Migration Summary

Total products:     150
✅ Successful:      145
⊘  Skipped:         3
❌ Errors:          2

✨ Migration complete!
```

---

## ⚠️ Common Issues

### "Missing Supabase credentials"
- **Fix**: Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

### "Missing or invalid price"
- **Fix**: Ensure all products have a `Regular price` in WooCommerce

### Products Skipped
- **Variable parent products**: Expected behavior (only variations are migrated)
- **Products without SKU**: Add SKUs in WooCommerce or skip

### Duplicate Slug Error
- **Fix**: Script auto-appends SKU to slug, but check for manual duplicates

---

## 📚 Full Documentation

- **Detailed Guide**: [docs/woocommerce-migration-guide.md](./woocommerce-migration-guide.md)
- **Column Mapping**: [docs/woocommerce-migration-mapping.md](./woocommerce-migration-mapping.md)
- **Migration Script**: [scripts/migrate-woocommerce-products.ts](../scripts/migrate-woocommerce-products.ts)

---

## 🧪 Testing

After migration, verify in Supabase:

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
LIMIT 10;
```

---

## 🆘 Need Help?

1. Check error details in migration summary
2. Review [woocommerce-migration-guide.md](./woocommerce-migration-guide.md)
3. Inspect the CSV for data issues

