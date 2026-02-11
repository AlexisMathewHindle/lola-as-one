import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingOfferingProducts() {
  console.log('🔧 Creating Missing offering_products Records...\n')
  console.log('='.repeat(60))

  // Get all physical product offerings
  const { data: offerings, error: offeringsError } = await supabase
    .from('offerings')
    .select('id, title, slug, type, status, price_gbp')
    .eq('type', 'product_physical')
    .eq('status', 'published')

  if (offeringsError) {
    console.error('❌ Error fetching offerings:', offeringsError)
    return
  }

  console.log(`\n📦 Found ${offerings.length} physical product offerings\n`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const offering of offerings) {
    console.log(`\nChecking: ${offering.title}`)

    // Check if offering_products already exists
    const { data: existingProduct, error: checkError } = await supabase
      .from('offering_products')
      .select('id')
      .eq('offering_id', offering.id)
      .maybeSingle()

    if (checkError) {
      console.error('  ❌ Error checking:', checkError)
      errors++
      continue
    }

    if (existingProduct) {
      console.log('  ✓ Already has offering_products record')
      skipped++
      continue
    }

    // Create offering_products record
    const sku = `SKU-${offering.slug.toUpperCase().replace(/-/g, '_')}`
    const price = offering.price_gbp || 10.00 // Default price if not set

    console.log(`  Creating offering_products...`)
    console.log(`    SKU: ${sku}`)
    console.log(`    Price: £${price}`)

    const { data: newProduct, error: createProductError } = await supabase
      .from('offering_products')
      .insert({
        offering_id: offering.id,
        sku: sku,
        price_gbp: price,
        vat_rate: 20.00,
        track_inventory: true,
        stock_quantity: 10, // Default stock
        low_stock_threshold: 5,
        requires_shipping: true,
        available_for_subscription: false,
      })
      .select()
      .single()

    if (createProductError) {
      console.error('  ❌ Error creating offering_products:', createProductError)
      errors++
      continue
    }

    console.log('  ✅ Created offering_products')

    // Now create inventory_items record
    console.log('  Creating inventory_items...')

    const { error: createInventoryError } = await supabase
      .from('inventory_items')
      .insert({
        offering_product_id: newProduct.id,
        offering_id: offering.id,
        sku: sku,
        item_type: 'product_physical',
        quantity_available: 10,
        quantity_reserved: 0,
        low_stock_threshold: 5,
      })

    if (createInventoryError) {
      console.error('  ❌ Error creating inventory_items:', createInventoryError)
      errors++
    } else {
      console.log('  ✅ Created inventory_items')
      created++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Summary:')
  console.log(`  ✅ Created: ${created} complete product records`)
  console.log(`  ⏭️  Skipped: ${skipped} (already exist)`)
  console.log(`  ❌ Errors: ${errors}`)
  
  if (created > 0) {
    console.log('\n✨ Success! Your products should now be orderable.')
    console.log('💡 Note: All products were given default stock of 10 units.')
    console.log('   You can update quantities in the admin panel.')
  }
  
  console.log('')
}

createMissingOfferingProducts()

