import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'app/.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkLinks() {
  console.log('🔍 Checking inventory item links for Two Dozen Eggs...\n')
  
  // Get the offering_product
  const { data: product, error: prodError } = await supabase
    .from('offering_products')
    .select('id, offering_id, sku, offering:offerings!inner(title)')
    .eq('offering.title', 'Two Dozen Eggs')
    .single()

  if (prodError) {
    console.error('❌ Error:', prodError)
    return
  }

  console.log('Product:', product.offering.title)
  console.log('offering_product.id:', product.id)
  console.log('offering_product.offering_id:', product.offering_id)
  console.log('SKU:', product.sku)
  
  // Check inventory_items by offering_product_id
  const { data: inv1, error: err1 } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('offering_product_id', product.id)
  
  console.log('\n📦 Inventory items linked by offering_product_id:')
  if (inv1 && inv1.length > 0) {
    inv1.forEach(item => {
      console.log(`  ✅ ID: ${item.id}`)
      console.log(`     SKU: ${item.sku}`)
      console.log(`     quantity_available: ${item.quantity_available}`)
      console.log(`     offering_product_id: ${item.offering_product_id}`)
      console.log(`     offering_id: ${item.offering_id}`)
    })
  } else {
    console.log('  ❌ None found')
  }
  
  // Check inventory_items by offering_id
  const { data: inv2, error: err2 } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('offering_id', product.offering_id)
  
  console.log('\n📦 Inventory items linked by offering_id:')
  if (inv2 && inv2.length > 0) {
    inv2.forEach(item => {
      console.log(`  ✅ ID: ${item.id}`)
      console.log(`     SKU: ${item.sku}`)
      console.log(`     quantity_available: ${item.quantity_available}`)
      console.log(`     offering_product_id: ${item.offering_product_id}`)
      console.log(`     offering_id: ${item.offering_id}`)
    })
  } else {
    console.log('  ❌ None found')
  }
  
  // If found by offering_id but not offering_product_id, we need to update
  if (inv2 && inv2.length > 0 && (!inv1 || inv1.length === 0)) {
    console.log('\n⚠️  ISSUE FOUND: inventory_items has offering_id but NOT offering_product_id!')
    console.log('We need to update inventory_items.offering_product_id\n')
    
    for (const item of inv2) {
      console.log(`Updating inventory item ${item.sku}...`)
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ offering_product_id: product.id })
        .eq('id', item.id)
      
      if (updateError) {
        console.error('  ❌ Error:', updateError)
      } else {
        console.log('  ✅ Updated!')
      }
    }
  }
}

checkLinks()

