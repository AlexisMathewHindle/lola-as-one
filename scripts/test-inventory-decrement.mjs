import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testInventoryDecrement() {
  console.log('🧪 Testing inventory decrement function...\n')
  console.log('='.repeat(60))

  // Get a product with inventory
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory_items')
    .select('*, offerings(title)')
    .gt('quantity_available', 0)
    .limit(1)
    .single()

  if (inventoryError || !inventory) {
    console.error('❌ Error finding inventory item:', inventoryError)
    return
  }

  console.log(`\n📦 Testing with product: ${inventory.offerings.title}`)
  console.log(`   SKU: ${inventory.sku}`)
  console.log(`   Current quantity: ${inventory.quantity_available}`)
  console.log(`   Offering ID: ${inventory.offering_id}`)

  // Test the decrement function
  console.log('\n🔧 Calling decrement_inventory(offering_id, 1)...')
  
  const { data, error } = await supabase.rpc('decrement_inventory', {
    p_offering_id: inventory.offering_id,
    p_quantity: 1,
  })

  if (error) {
    console.error('\n❌ Error calling decrement_inventory:', error)
    return
  }

  console.log('✅ Function called successfully')

  // Check the new quantity
  const { data: updatedInventory, error: checkError } = await supabase
    .from('inventory_items')
    .select('quantity_available')
    .eq('id', inventory.id)
    .single()

  if (checkError) {
    console.error('❌ Error checking updated inventory:', checkError)
    return
  }

  console.log(`\n📊 Results:`)
  console.log(`   Before: ${inventory.quantity_available}`)
  console.log(`   After:  ${updatedInventory.quantity_available}`)
  console.log(`   Change: ${updatedInventory.quantity_available - inventory.quantity_available}`)

  if (updatedInventory.quantity_available === inventory.quantity_available - 1) {
    console.log('\n✅ SUCCESS! Inventory decremented correctly')
  } else {
    console.log('\n❌ FAILED! Inventory did not decrement as expected')
  }

  // Restore the original quantity
  console.log('\n🔄 Restoring original quantity...')
  const { error: restoreError } = await supabase
    .from('inventory_items')
    .update({ quantity_available: inventory.quantity_available })
    .eq('id', inventory.id)

  if (restoreError) {
    console.error('❌ Error restoring inventory:', restoreError)
  } else {
    console.log('✅ Original quantity restored')
  }

  console.log('\n' + '='.repeat(60))
  console.log('')
}

testInventoryDecrement()

