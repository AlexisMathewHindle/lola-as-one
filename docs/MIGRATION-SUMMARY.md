# WooCommerce to Supabase Migration - Summary

## 📦 What I've Created for You

I've built a complete migration system to import your WooCommerce products into your new Supabase schema.

### Files Created

1. **Migration Script** (`scripts/migrate-woocommerce-products.ts`)
   - TypeScript script that reads WooCommerce CSV export
   - Maps columns to your Supabase schema
   - Handles categories, tags, inventory, and metadata
   - Provides detailed progress and error reporting

2. **Documentation**
   - `docs/woocommerce-migration-mapping.md` - Detailed column mapping reference
   - `docs/woocommerce-migration-guide.md` - Complete migration guide
   - `docs/MIGRATION-QUICK-START.md` - Quick start guide (5 minutes)

3. **Configuration**
   - `package.json` - Dependencies and npm scripts

---

## 🎯 How It Works

### Input: WooCommerce CSV Export

Your CSV has these key columns:
- `ID`, `Type`, `SKU`, `Name`, `Published`, `Is featured?`
- `Short description`, `Description`
- `Regular price`, `Sale price`, `Tax class`
- `In stock?`, `Stock`, `Low stock amount`
- `Weight (kg)`, `Categories`, `Tags`, `Images`
- `Brands` and various `Meta:` fields

### Output: Supabase Tables

The script populates these tables:

1. **`offerings`** - Core product content
   - Title, slug, descriptions
   - Featured image, status, metadata
   - SEO fields (meta_title, meta_description)

2. **`offering_products`** - Commerce data
   - SKU, price, VAT rate
   - Stock tracking, weight, shipping

3. **`inventory_items`** - Inventory management
   - Available/reserved quantities
   - Low stock thresholds

4. **`categories`** + join tables - Product categorization
   - Hierarchical categories (Parent > Child)
   - Links via `offering_categories` and `product_categories`

5. **`tags`** + `offering_tags` - Product tagging
   - Keyword tags for filtering/search

### Smart Features

✅ **Automatic slug generation** - Creates unique slugs from product names  
✅ **Hierarchical categories** - Handles "Parent > Child" category structure  
✅ **Image handling** - Extracts first image as featured, stores all in metadata  
✅ **Metadata preservation** - Stores brand, age range, material, theme, etc.  
✅ **Error handling** - Skips invalid products, reports errors with details  
✅ **Progress tracking** - Real-time console output with emojis  

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Export from WooCommerce

WooCommerce → Products → All Products → Export → Download CSV

### 4. Run Migration

```bash
npm run migrate:products path/to/woocommerce-products.csv
```

Or:

```bash
tsx scripts/migrate-woocommerce-products.ts ~/Downloads/wc-products.csv
```

---

## 📊 What Gets Migrated

### ✅ Migrated

| Data | WooCommerce Field | Supabase Table.Column |
|------|-------------------|----------------------|
| Product name | `Name` | `offerings.title` |
| URL slug | Generated from `Name` | `offerings.slug` |
| Short description | `Short description` | `offerings.description_short` |
| Full description | `Description` | `offerings.description_long` |
| Featured image | `Images` (first) | `offerings.featured_image_url` |
| All images | `Images` | `offerings.metadata.original_images` |
| Published status | `Published` | `offerings.status` ('published'/'draft') |
| Featured flag | `Is featured?` | `offerings.featured` |
| SEO title | `Meta: seo_product_title` | `offerings.meta_title` |
| SEO description | `Meta: _yoast_wpseo_metadesc` | `offerings.meta_description` |
| SKU | `SKU` | `offering_products.sku` |
| Price | `Regular price` | `offering_products.price_gbp` |
| Stock quantity | `Stock` | `offering_products.stock_quantity` |
| Low stock threshold | `Low stock amount` | `offering_products.low_stock_threshold` |
| Weight | `Weight (kg)` | `offering_products.weight_grams` (converted) |
| Categories | `Categories` | `categories`, `offering_categories`, `product_categories` |
| Tags | `Tags` | `tags`, `offering_tags` |
| Brand | `Brands` | `offerings.metadata.brand` |
| Age range | `Meta: ..._age_range` | `offerings.metadata.age_range` |
| Material | `Meta: ..._material` | `offerings.metadata.material` |
| Gender | `Meta: ..._gender` | `offerings.metadata.gender` |
| Theme | `Meta: ..._theme` | `offerings.metadata.theme` |
| Educational focus | `Meta: ..._educational_focus` | `offerings.metadata.educational_focus` |

### ⊘ Skipped

- Variable parent products (only variations are migrated)
- Products without SKUs
- WooCommerce internal fields (`Meta: _wc_*`)
- Facebook integration fields (`Meta: fb_*`)
- Wholesale plugin fields
- External/affiliate product fields

---

## 📈 Expected Results

For a typical WooCommerce store with 150 products:

- **✅ Successful**: ~145 products (simple products + variations)
- **⊘ Skipped**: ~3-5 products (variable parents, missing SKUs)
- **❌ Errors**: 0-2 products (data issues, missing prices)

---

## 🔍 Verification

After migration, check your data:

```sql
-- View migrated products
SELECT 
  o.title,
  o.slug,
  op.sku,
  op.price_gbp,
  op.stock_quantity,
  o.status,
  o.featured
FROM offerings o
JOIN offering_products op ON op.offering_id = o.id
WHERE o.type = 'product_physical'
ORDER BY o.created_at DESC;

-- Check categories
SELECT name, slug, parent_id FROM categories ORDER BY name;

-- Check inventory
SELECT 
  ii.sku,
  ii.quantity_available,
  op.stock_quantity
FROM inventory_items ii
JOIN offering_products op ON op.id = ii.offering_product_id;
```

---

## 📚 Next Steps

1. **Run the migration** with your WooCommerce CSV
2. **Review the results** in the console output
3. **Verify data** in Supabase dashboard
4. **Update image URLs** if needed (if hosted on old site)
5. **Test product display** on your frontend

---

## 🆘 Support

- **Quick Start**: [MIGRATION-QUICK-START.md](./MIGRATION-QUICK-START.md)
- **Full Guide**: [woocommerce-migration-guide.md](./woocommerce-migration-guide.md)
- **Column Mapping**: [woocommerce-migration-mapping.md](./woocommerce-migration-mapping.md)
- **Script Source**: [../scripts/migrate-woocommerce-products.ts](../scripts/migrate-woocommerce-products.ts)

