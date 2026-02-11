import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function linkInventoryToOfferings() {
  console.log('🔗 Linking inventory_items to offerings...\n')
  console.log('='.repeat(60))

  // Get all inventory_items
  const { data: inventoryItems, error: inventoryError } = await supabase
    .from('inventory_items')
    .select('*')

  if (inventoryError) {
    console.error('❌ Error fetching inventory_items:', inventoryError)
    return
  }

  console.log(`\n📦 Found ${inventoryItems.length} inventory_items\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const item of inventoryItems) {
    // Skip if already has offering_id
    if (item.offering_id) {
      skipped++
      continue
    }

    console.log(`\nProcessing: ${item.sku}`)

    // Find the offering_product by SKU
    const { data: offeringProduct, error: productError } = await supabase
      .from('offering_products')
      .select('offering_id')
      .eq('sku', item.sku)
      .maybeSingle()

    if (productError || !offeringProduct) {
      console.log(`  ⚠️  No offering_product found for SKU: ${item.sku}`)
      errors++
      continue
    }

    // Update the inventory_item with the offering_id
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ offering_id: offeringProduct.offering_id })
      .eq('id', item.id)

    if (updateError) {
      console.error(`  ❌ Error updating:`, updateError)
      errors++
    } else {
      console.log(`  ✅ Linked to offering: ${offeringProduct.offering_id}`)
      updated++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Summary:')
  console.log(`  ✅ Updated: ${updated} inventory_items`)
  console.log(`  ⏭️  Skipped: ${skipped} (already linked)`)
  console.log(`  ❌ Errors: ${errors}`)
  
  if (updated > 0) {
    console.log('\n✨ Success! Inventory items are now linked to offerings.')
    console.log('   You should now be able to place orders!')
  }
  
  console.log('')
}

linkInventoryToOfferings()

