import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function syncStockQuantities() {
  console.log('🔄 Syncing stock quantities from inventory_items to offering_products...\n')
  console.log('='.repeat(60))

  // Get all inventory items with their offering_product_id
  const { data: inventoryItems, error: inventoryError } = await supabase
    .from('inventory_items')
    .select('id, offering_id, offering_product_id, sku, quantity_available, item_type')
    .eq('item_type', 'product_physical')

  if (inventoryError) {
    console.error('❌ Error fetching inventory items:', inventoryError)
    return
  }

  console.log(`\n📦 Found ${inventoryItems.length} inventory items to sync\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const item of inventoryItems) {
    // Update the offering_products.stock_quantity to match inventory_items.quantity_available
    const { error: updateError } = await supabase
      .from('offering_products')
      .update({
        stock_quantity: item.quantity_available,
        updated_at: new Date().toISOString()
      })
      .eq('offering_id', item.offering_id)

    if (updateError) {
      console.error(`❌ Error updating ${item.sku}:`, updateError.message)
      errors++
    } else {
      console.log(`✅ Updated ${item.sku}: stock_quantity = ${item.quantity_available}`)
      updated++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Updated: ${updated}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log('')
}

syncStockQuantities()

