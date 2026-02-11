import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProductStructure() {
  console.log('🔍 Checking Product Data Structure...\n')
  console.log('='.repeat(60))

  // Get all physical product offerings
  const { data: offerings, error: offeringsError } = await supabase
    .from('offerings')
    .select('id, title, slug, type, status')
    .eq('type', 'product_physical')
    .eq('status', 'published')
    .limit(20)

  if (offeringsError) {
    console.error('❌ Error fetching offerings:', offeringsError)
    return
  }

  console.log(`\n📦 Found ${offerings.length} physical product offerings\n`)

  let missingOfferingProducts = []
  let missingInventoryItems = []
  let complete = []

  for (const offering of offerings) {
    console.log(`\nOffering: ${offering.title}`)
    console.log(`  ID: ${offering.id}`)

    // Check offering_products
    const { data: products, error: productsError } = await supabase
      .from('offering_products')
      .select('id, sku, price_gbp, track_inventory, stock_quantity')
      .eq('offering_id', offering.id)
      .maybeSingle()

    if (productsError) {
      console.error('  ❌ Error checking offering_products:', productsError)
      continue
    }

    if (!products) {
      console.log('  ❌ Missing offering_products record')
      missingOfferingProducts.push(offering)
      continue
    }

    console.log(`  ✅ Has offering_products (SKU: ${products.sku}, Price: £${products.price_gbp})`)

    // Check inventory_items
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('id, sku, quantity_available, quantity_reserved')
      .eq('offering_id', offering.id)
      .maybeSingle()

    if (inventoryError) {
      console.error('  ❌ Error checking inventory_items:', inventoryError)
      continue
    }

    if (!inventory) {
      console.log('  ❌ Missing inventory_items record')
      missingInventoryItems.push({ offering, product: products })
    } else {
      console.log(`  ✅ Has inventory_items (Available: ${inventory.quantity_available})`)
      complete.push(offering)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Summary:\n')
  console.log(`  ✅ Complete products: ${complete.length}`)
  console.log(`  ❌ Missing offering_products: ${missingOfferingProducts.length}`)
  console.log(`  ❌ Missing inventory_items: ${missingInventoryItems.length}`)

  if (missingOfferingProducts.length > 0) {
    console.log('\n⚠️  Products missing offering_products records:')
    missingOfferingProducts.forEach(o => console.log(`     - ${o.title} (${o.id})`))
    console.log('\n💡 These products need offering_products records created.')
    console.log('   Run: node scripts/create-missing-offering-products.mjs')
  }

  if (missingInventoryItems.length > 0) {
    console.log('\n⚠️  Products missing inventory_items records:')
    missingInventoryItems.forEach(({ offering }) => console.log(`     - ${offering.title}`))
    console.log('\n💡 These products need inventory_items records created.')
    console.log('   Run: node scripts/fix-inventory.mjs')
  }

  console.log('')
}

checkProductStructure()

