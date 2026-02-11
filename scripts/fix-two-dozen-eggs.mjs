import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load from root .env.local first (has service role key)
dotenv.config({ path: '.env.local' })
// Then load from app/.env.local (has VITE_ vars)
dotenv.config({ path: 'app/.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixTwoDozentEggs() {
  console.log('🔍 Checking Two Dozen Eggs inventory...\n')
  
  // Get the offering_product
  const { data: product, error: prodError } = await supabase
    .from('offering_products')
    .select('id, offering_id, sku, stock_quantity, offering:offerings!inner(title)')
    .eq('offering.title', 'Two Dozen Eggs')
    .single()

  if (prodError) {
    console.error('❌ Error:', prodError)
    return
  }

  console.log('Product:', product.offering.title)
  console.log('  offering_product.id:', product.id)
  console.log('  offering_id:', product.offering_id)
  console.log('  SKU:', product.sku)
  console.log('  stock_quantity:', product.stock_quantity)
  
  // Check for inventory item by SKU
  const { data: invBySku, error: skuError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('sku', product.sku)
    .maybeSingle()
  
  console.log('\n📦 Inventory item with SKU "' + product.sku + '":')
  if (invBySku) {
    console.log('  ✅ Found!')
    console.log('  id:', invBySku.id)
    console.log('  quantity_available:', invBySku.quantity_available)
    console.log('  offering_product_id:', invBySku.offering_product_id)
    console.log('  offering_id:', invBySku.offering_id)
    
    // Check if offering_product_id matches
    if (invBySku.offering_product_id !== product.id) {
      console.log('\n⚠️  MISMATCH! offering_product_id does not match!')
      console.log('  Expected:', product.id)
      console.log('  Actual:', invBySku.offering_product_id)
      
      console.log('\n🔄 Updating offering_product_id...')
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ offering_product_id: product.id })
        .eq('id', invBySku.id)
      
      if (updateError) {
        console.error('❌ Update error:', updateError)
      } else {
        console.log('✅ Updated successfully!')
      }
    } else {
      console.log('\n✅ offering_product_id is correct!')
    }
  } else {
    console.log('  ❌ Not found!')
    console.log('\n🔄 Creating inventory item...')
    
    const { error: createError } = await supabase
      .from('inventory_items')
      .insert({
        offering_product_id: product.id,
        offering_id: product.offering_id,
        sku: product.sku,
        item_type: 'product_physical',
        quantity_available: product.stock_quantity || 0,
        quantity_reserved: 0,
        low_stock_threshold: 5
      })
    
    if (createError) {
      console.error('❌ Create error:', createError)
    } else {
      console.log('✅ Created successfully!')
    }
  }
}

fixTwoDozentEggs()

