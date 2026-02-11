import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkInventory() {
  console.log('📦 Checking Inventory for "Two Dozen Eggs"...\n')
  console.log('='.repeat(60))

  // Search for the offering
  const { data: offerings, error: offeringsError } = await supabase
    .from('offerings')
    .select('*')
    .ilike('title', '%Two Dozen Eggs%')

  if (offeringsError) {
    console.error('❌ Error fetching offerings:', offeringsError)
    return
  }

  if (!offerings || offerings.length === 0) {
    console.log('❌ No offering found with title containing "Two Dozen Eggs"')
    return
  }

  console.log(`\n✅ Found ${offerings.length} offering(s):\n`)

  for (const offering of offerings) {
    console.log(`Offering: ${offering.title}`)
    console.log(`  ID: ${offering.id}`)
    console.log(`  Slug: ${offering.slug}`)
    console.log(`  Type: ${offering.type}`)
    console.log(`  Status: ${offering.status}`)

    // Check offering_products
    const { data: products, error: productsError } = await supabase
      .from('offering_products')
      .select('*')
      .eq('offering_id', offering.id)

    if (productsError) {
      console.error('  ❌ Error fetching offering_products:', productsError)
    } else if (products && products.length > 0) {
      console.log(`\n  📦 Offering Product:`)
      products.forEach(product => {
        console.log(`    SKU: ${product.sku}`)
        console.log(`    Price: £${product.price_gbp}`)
        console.log(`    Track Inventory: ${product.track_inventory}`)
        console.log(`    Stock Quantity: ${product.stock_quantity}`)
      })
    } else {
      console.log('  ⚠️  No offering_products found')
    }

    // Check inventory_items
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('offering_id', offering.id)

    if (inventoryError) {
      console.error('  ❌ Error fetching inventory_items:', inventoryError)
    } else if (inventory && inventory.length > 0) {
      console.log(`\n  📊 Inventory Items:`)
      inventory.forEach(item => {
        console.log(`    SKU: ${item.sku}`)
        console.log(`    Type: ${item.item_type}`)
        console.log(`    Available: ${item.quantity_available}`)
        console.log(`    Reserved: ${item.quantity_reserved}`)
        console.log(`    Low Stock Threshold: ${item.low_stock_threshold}`)
      })
    } else {
      console.log('  ⚠️  No inventory_items found')
    }

    console.log('')
  }

  console.log('='.repeat(60))
  console.log('\n💡 Diagnosis:\n')
  console.log('The checkout validation checks inventory_items.quantity_available')
  console.log('If no inventory_items record exists, or quantity_available < requested quantity,')
  console.log('you will get "Insufficient stock" error.\n')
  console.log('Solutions:')
  console.log('1. Create an inventory_items record for this offering')
  console.log('2. Update quantity_available to a positive number')
  console.log('3. Or disable inventory tracking for this product')
}

checkInventory()

