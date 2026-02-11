import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStock() {
  console.log('🔍 Checking Strawberry Chocolate Pencil case stock...\n')

  // Get the offering_product directly
  const { data: product, error } = await supabase
    .from('offering_products')
    .select(`
      id,
      sku,
      stock_quantity,
      track_inventory,
      offering_id,
      offering:offerings!inner(id, title)
    `)
    .ilike('offering.title', '%Strawberry%Chocolate%')
    .single()

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('Product:', product.offering.title)
  console.log('Offering ID:', product.offering_id)
  console.log('Offering Product ID:', product.id)
  console.log('\nOffering Products:')
  console.log('  SKU:', product.sku)
  console.log('  stock_quantity:', product.stock_quantity)
  console.log('  track_inventory:', product.track_inventory)

  // Get inventory items
  const { data: inventory, error: invError } = await supabase
    .from('inventory_items')
    .select('id, quantity_available, quantity_reserved')
    .eq('offering_id', product.offering_id)
    .single()

  console.log('\nInventory Items:')
  if (inventory) {
    console.log('  quantity_available:', inventory.quantity_available)
    console.log('  quantity_reserved:', inventory.quantity_reserved)

    // Now manually update the stock_quantity
    const correctQuantity = inventory.quantity_available

    console.log(`\n🔄 Updating stock_quantity from ${product.stock_quantity} to ${correctQuantity}...`)

    const { error: updateError } = await supabase
      .from('offering_products')
      .update({ stock_quantity: correctQuantity })
      .eq('id', product.id)

    if (updateError) {
      console.error('❌ Update error:', updateError)
    } else {
      console.log('✅ Updated successfully!')
    }
  } else {
    console.log('  ❌ No inventory items found!')
    if (invError) console.error('  Error:', invError)
  }
}

checkStock()

