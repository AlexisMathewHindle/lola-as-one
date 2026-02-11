import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'app/.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAllInventory() {
  console.log('🔍 Checking all inventory items...\n')
  
  // Get all inventory items
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('id, sku, offering_id, offering_product_id, quantity_available, item_type')
    .order('sku')
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`Found ${items.length} inventory items:\n`)
  
  let withProductId = 0
  let withoutProductId = 0
  
  items.slice(0, 10).forEach(item => {
    console.log(`SKU: ${item.sku}`)
    console.log(`  offering_id: ${item.offering_id}`)
    console.log(`  offering_product_id: ${item.offering_product_id || '❌ NULL'}`)
    console.log(`  quantity_available: ${item.quantity_available}`)
    console.log(`  item_type: ${item.item_type}`)
    console.log('')
    
    if (item.offering_product_id) {
      withProductId++
    } else {
      withoutProductId++
    }
  })
  
  if (items.length > 10) {
    console.log(`... and ${items.length - 10} more items\n`)
  }
  
  console.log('Summary:')
  console.log(`  ✅ With offering_product_id: ${withProductId}`)
  console.log(`  ❌ Without offering_product_id: ${withoutProductId}`)
  
  // Now check if Two Dozen Eggs has an offering_product
  console.log('\n\n🔍 Checking Two Dozen Eggs specifically...\n')
  
  const { data: product, error: prodError } = await supabase
    .from('offering_products')
    .select('id, offering_id, sku, stock_quantity, offering:offerings!inner(title)')
    .eq('offering.title', 'Two Dozen Eggs')
    .single()
  
  if (prodError) {
    console.error('❌ Error:', prodError)
    return
  }
  
  console.log('Product found:')
  console.log(`  Title: ${product.offering.title}`)
  console.log(`  SKU: ${product.sku}`)
  console.log(`  offering_product.id: ${product.id}`)
  console.log(`  offering_id: ${product.offering_id}`)
  console.log(`  stock_quantity: ${product.stock_quantity}`)
  
  // Check if there's an inventory item with this SKU
  const { data: invBySku, error: skuError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('sku', product.sku)
  
  console.log(`\n📦 Inventory items with SKU "${product.sku}":`)
  if (invBySku && invBySku.length > 0) {
    invBySku.forEach(item => {
      console.log(`  Found: ${item.id}`)
      console.log(`    quantity_available: ${item.quantity_available}`)
      console.log(`    offering_id: ${item.offering_id}`)
      console.log(`    offering_product_id: ${item.offering_product_id || '❌ NULL'}`)
    })
  } else {
    console.log('  ❌ No inventory item found with this SKU!')
    console.log('\n  This product needs an inventory_items record created.')
  }
}

checkAllInventory()

