#!/usr/bin/env tsx

/**
 * WooCommerce Product Migration Script
 *
 * Migrates products from WooCommerce CSV export to Supabase schema.
 *
 * Usage:
 *   tsx scripts/migrate-woocommerce-products.ts <path-to-csv>
 *
 * Example:
 *   tsx scripts/migrate-woocommerce-products.ts ~/Downloads/wc-product-export.csv
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

// Load environment variables from .env.local
config({ path: '.env.local' });

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// Types
// ============================================================================

interface WooCommerceProduct {
  ID: string;
  Type: string;
  SKU: string;
  Name: string;
  Published: string;
  'Is featured?': string;
  'Visibility in catalogue': string;
  'Short description': string;
  Description: string;
  'Regular price': string;
  'Sale price': string;
  'Tax status': string;
  'Tax class': string;
  'In stock?': string;
  Stock: string;
  'Low stock amount': string;
  'Weight (kg)': string;
  Categories: string;
  Tags: string;
  Images: string;
  Brands: string;
  'Meta: _yoast_wpseo_metadesc': string;
  'Meta: seo_product_title': string;
  'Meta: _wc_facebook_enhanced_catalog_attributes_age_range': string;
  'Meta: _wc_facebook_enhanced_catalog_attributes_material': string;
  'Meta: _wc_facebook_enhanced_catalog_attributes_gender': string;
  'Meta: _wc_facebook_enhanced_catalog_attributes_theme': string;
  'Meta: _wc_facebook_enhanced_catalog_attributes_educational_focus': string;
  [key: string]: string; // Allow other meta fields
}

interface MigrationStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ sku: string; name: string; error: string }>;
}

// ============================================================================
// Utility Functions
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

function parsePrice(price: string): number | null {
  if (!price || price.trim() === '') return null;
  const parsed = parseFloat(price.replace(/[^0-9.]/g, ''));
  return isNaN(parsed) ? null : parsed;
}

function parseInteger(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

function parseBoolean(value: string): boolean {
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

function extractImages(imagesString: string): string[] {
  if (!imagesString || imagesString.trim() === '') return [];
  return imagesString.split(',').map(url => url.trim()).filter(url => url.length > 0);
}

function buildMetadata(product: WooCommerceProduct): Record<string, any> {
  const metadata: Record<string, any> = {
    woocommerce_id: product.ID,
  };

  // Add brand
  if (product.Brands) metadata.brand = product.Brands;

  // Add Facebook catalog attributes (these are useful product attributes)
  if (product['Meta: _wc_facebook_enhanced_catalog_attributes_age_range']) {
    metadata.age_range = product['Meta: _wc_facebook_enhanced_catalog_attributes_age_range'];
  }
  if (product['Meta: _wc_facebook_enhanced_catalog_attributes_material']) {
    metadata.material = product['Meta: _wc_facebook_enhanced_catalog_attributes_material'];
  }
  if (product['Meta: _wc_facebook_enhanced_catalog_attributes_gender']) {
    metadata.gender = product['Meta: _wc_facebook_enhanced_catalog_attributes_gender'];
  }
  if (product['Meta: _wc_facebook_enhanced_catalog_attributes_theme']) {
    metadata.theme = product['Meta: _wc_facebook_enhanced_catalog_attributes_theme'];
  }
  if (product['Meta: _wc_facebook_enhanced_catalog_attributes_educational_focus']) {
    metadata.educational_focus = product['Meta: _wc_facebook_enhanced_catalog_attributes_educational_focus'];
  }

  // Store all images
  const images = extractImages(product.Images);
  if (images.length > 0) {
    metadata.original_images = images;
  }

  return metadata;
}

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Get or create a category by name
 */
async function getOrCreateCategory(name: string, parentId: string | null = null): Promise<string> {
  const slug = slugify(name);

  // Check if category exists
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new category
  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert({
      name,
      slug,
      parent_id: parentId,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create category "${name}": ${error.message}`);
  }

  console.log(`  ✓ Created category: ${name}`);
  return newCategory.id;
}

/**
 * Get or create a tag by name
 */
async function getOrCreateTag(name: string): Promise<string> {
  const slug = slugify(name);

  // Check if tag exists
  const { data: existing } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new tag
  const { data: newTag, error } = await supabase
    .from('tags')
    .insert({
      name,
      slug,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create tag "${name}": ${error.message}`);
  }

  console.log(`  ✓ Created tag: ${name}`);
  return newTag.id;
}

/**
 * Process categories from WooCommerce format
 * Format: "Parent > Child" or "Category1, Category2"
 */
async function processCategories(categoriesString: string): Promise<string[]> {
  if (!categoriesString || categoriesString.trim() === '') return [];

  const categoryIds: string[] = [];

  // Split by comma for multiple categories
  const categories = categoriesString.split(',').map(c => c.trim());

  for (const category of categories) {
    // Check for hierarchy (Parent > Child)
    if (category.includes('>')) {
      const parts = category.split('>').map(p => p.trim());
      let parentId: string | null = null;

      // Create hierarchy
      for (const part of parts) {
        const categoryId = await getOrCreateCategory(part, parentId);
        parentId = categoryId;
      }

      if (parentId) {
        categoryIds.push(parentId);
      }
    } else {
      // Simple category
      const categoryId = await getOrCreateCategory(category);
      categoryIds.push(categoryId);
    }
  }

  return categoryIds;
}

/**
 * Process tags from WooCommerce format
 * Format: "Tag1, Tag2, Tag3"
 */
async function processTags(tagsString: string): Promise<string[]> {
  if (!tagsString || tagsString.trim() === '') return [];

  const tagIds: string[] = [];
  const tags = tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);

  for (const tag of tags) {
    const tagId = await getOrCreateTag(tag);
    tagIds.push(tagId);
  }

  return tagIds;
}

/**
 * Migrate a single product
 */
async function migrateProduct(product: WooCommerceProduct): Promise<void> {
  // Skip parent variable products (we only want simple products and variations)
  if (product.Type === 'variable') {
    console.log(`  ⊘ Skipping parent variable product: ${product.Name}`);
    throw new Error('SKIP');
  }

  // Skip products without SKU
  if (!product.SKU || product.SKU.trim() === '') {
    console.log(`  ⊘ Skipping product without SKU: ${product.Name}`);
    throw new Error('SKIP');
  }

  console.log(`\n📦 Migrating: ${product.Name} (SKU: ${product.SKU})`);

  // Determine product type
  const isVirtual = product.Type === 'virtual';
  const offeringType = isVirtual ? 'product_digital' : 'product_physical';

  // Parse price
  const price = parsePrice(product['Regular price']);
  if (!price) {
    throw new Error(`Missing or invalid price for ${product.SKU}`);
  }

  // Generate unique slug
  let slug = slugify(product.Name);
  const { data: existingSlug } = await supabase
    .from('offerings')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existingSlug) {
    slug = `${slug}-${product.SKU.toLowerCase()}`;
  }

  // Build metadata
  const metadata = buildMetadata(product);

  // Extract images
  const images = extractImages(product.Images);
  const featuredImage = images.length > 0 ? images[0] : null;

  // Determine status
  const isPublished = parseBoolean(product.Published);
  const status = isPublished ? 'published' : 'draft';
  const publishedAt = isPublished ? new Date().toISOString() : null;

  // 1. Create offering
  const { data: offering, error: offeringError } = await supabase
    .from('offerings')
    .insert({
      type: offeringType,
      title: product.Name,
      slug,
      description_short: product['Short description'] || null,
      description_long: product.Description || null,
      featured_image_url: featuredImage,
      status,
      published_at: publishedAt,
      featured: parseBoolean(product['Is featured?']),
      metadata,
      meta_title: product['Meta: seo_product_title'] || null,
      meta_description: product['Meta: _yoast_wpseo_metadesc'] || null,
    })
    .select('id')
    .single();

  if (offeringError) {
    throw new Error(`Failed to create offering: ${offeringError.message}`);
  }

  console.log(`  ✓ Created offering: ${offering.id}`);

  // 2. Create offering_product (for physical products)
  if (offeringType === 'product_physical') {
    const weightKg = parsePrice(product['Weight (kg)']);
    const weightGrams = weightKg ? Math.round(weightKg * 1000) : null;

    const { data: offeringProduct, error: productError } = await supabase
      .from('offering_products')
      .insert({
        offering_id: offering.id,
        sku: product.SKU,
        price_gbp: price,
        vat_rate: 20.00, // Default UK VAT
        track_inventory: parseBoolean(product['In stock?']),
        stock_quantity: parseInteger(product.Stock) || 0,
        low_stock_threshold: parseInteger(product['Low stock amount']) || 5,
        requires_shipping: true,
        weight_grams: weightGrams,
        available_for_subscription: false,
      })
      .select('id')
      .single();

    if (productError) {
      throw new Error(`Failed to create offering_product: ${productError.message}`);
    }

    console.log(`  ✓ Created offering_product: ${offeringProduct.id}`);

    // 3. Create inventory_item
    const { error: inventoryError } = await supabase
      .from('inventory_items')
      .insert({
        offering_product_id: offeringProduct.id,
        sku: product.SKU,
        item_type: 'product_physical',
        quantity_available: parseInteger(product.Stock) || 0,
        quantity_reserved: 0,
        low_stock_threshold: parseInteger(product['Low stock amount']) || 5,
      });

    if (inventoryError) {
      console.warn(`  ⚠ Failed to create inventory_item: ${inventoryError.message}`);
    } else {
      console.log(`  ✓ Created inventory_item`);
    }

    // 4. Process categories
    const categoryIds = await processCategories(product.Categories);
    if (categoryIds.length > 0) {
      // Link to offering_categories
      const offeringCategoryLinks = categoryIds.map(categoryId => ({
        offering_id: offering.id,
        category_id: categoryId,
      }));

      const { error: offeringCatError } = await supabase
        .from('offering_categories')
        .insert(offeringCategoryLinks);

      if (offeringCatError) {
        console.warn(`  ⚠ Failed to link offering categories: ${offeringCatError.message}`);
      }

      // Link to product_categories
      const productCategoryLinks = categoryIds.map(categoryId => ({
        offering_product_id: offeringProduct.id,
        category_id: categoryId,
      }));

      const { error: productCatError } = await supabase
        .from('product_categories')
        .insert(productCategoryLinks);

      if (productCatError) {
        console.warn(`  ⚠ Failed to link product categories: ${productCatError.message}`);
      } else {
        console.log(`  ✓ Linked ${categoryIds.length} categories`);
      }
    }

    // 5. Process tags
    const tagIds = await processTags(product.Tags);
    if (tagIds.length > 0) {
      const offeringTagLinks = tagIds.map(tagId => ({
        offering_id: offering.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from('offering_tags')
        .insert(offeringTagLinks);

      if (tagError) {
        console.warn(`  ⚠ Failed to link tags: ${tagError.message}`);
      } else {
        console.log(`  ✓ Linked ${tagIds.length} tags`);
      }
    }
  }

  console.log(`  ✅ Successfully migrated: ${product.Name}`);
}

/**
 * Main migration function
 */
async function migrateProducts(csvPath: string): Promise<void> {
  console.log('🚀 WooCommerce Product Migration\n');
  console.log(`📄 Reading CSV: ${csvPath}\n`);

  // Read and parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const products: WooCommerceProduct[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true, // Allow rows with different column counts
    relax_quotes: true, // Handle quotes more flexibly
  });

  console.log(`📊 Found ${products.length} products in CSV\n`);
  console.log('─'.repeat(80));

  const stats: MigrationStats = {
    total: products.length,
    success: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  // Migrate each product
  for (const product of products) {
    try {
      await migrateProduct(product);
      stats.success++;
    } catch (error) {
      if (error instanceof Error && error.message === 'SKIP') {
        stats.skipped++;
      } else {
        stats.errors++;
        stats.errorDetails.push({
          sku: product.SKU || 'NO_SKU',
          name: product.Name || 'NO_NAME',
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  // Print summary
  console.log('\n' + '─'.repeat(80));
  console.log('\n📈 Migration Summary\n');
  console.log(`Total products:     ${stats.total}`);
  console.log(`✅ Successful:      ${stats.success}`);
  console.log(`⊘  Skipped:         ${stats.skipped}`);
  console.log(`❌ Errors:          ${stats.errors}`);

  if (stats.errorDetails.length > 0) {
    console.log('\n❌ Error Details:\n');
    stats.errorDetails.forEach(({ sku, name, error }) => {
      console.log(`  • ${name} (${sku})`);
      console.log(`    ${error}\n`);
    });
  }

  console.log('\n✨ Migration complete!\n');
}

// ============================================================================
// CLI Entry Point
// ============================================================================

const csvPath = process.argv[2];

if (!csvPath) {
  console.error('❌ Usage: tsx scripts/migrate-woocommerce-products.ts <path-to-csv>');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ File not found: ${csvPath}`);
  process.exit(1);
}

migrateProducts(csvPath)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

