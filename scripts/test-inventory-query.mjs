import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load from root .env.local first (has service role key)
dotenv.config({ path: '.env.local' })
// Then load from app/.env.local (has VITE_ vars)
dotenv.config({ path: 'app/.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Testing with ANON key (same as frontend)...\n')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  console.error('SUPABASE_URL:', supabaseUrl)
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'present' : 'missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testQuery() {
  console.log('🔍 Testing inventory query for Two Dozen Eggs...\n')

  // First, check if inventory items exist at all
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: invCheck, error: invError } = await supabaseAdmin
    .from('inventory_items')
    .select('id, sku, offering_product_id, quantity_available')
    .limit(5)

  console.log('Sample inventory items (with service role):')
  if (invCheck && invCheck.length > 0) {
    invCheck.forEach(item => {
      console.log(`  ${item.sku}: qty=${item.quantity_available}, product_id=${item.offering_product_id}`)
    })
  } else {
    console.log('  ❌ No inventory items found!')
  }
  console.log('')

  // Test the exact query from BoxDetail.vue
  const { data, error } = await supabase
    .from('offering_products')
    .select(`
      *,
      offering:offerings!inner(*),
      inventory:inventory_items!offering_product_id(quantity_available, quantity_reserved)
    `)
    .eq('offering.slug', 'two-dozen-eggs')
    .in('offering.type', ['product_physical', 'subscription'])
    .eq('offering.status', 'published')
    .single()

  if (error) {
    console.error('❌ Query Error:', error)
    return
  }

  console.log('✅ Query successful!\n')
  console.log('Product:', data.offering.title)
  console.log('SKU:', data.sku)
  console.log('stock_quantity:', data.stock_quantity)
  console.log('\nInventory field:', data.inventory)
  
  if (!data.inventory || data.inventory.length === 0) {
    console.log('\n⚠️  WARNING: inventory field is empty or null!')
    console.log('This means the relationship is not working.\n')
    
    // Try alternative query using offering_id
    console.log('Trying alternative query using offering_id...\n')
    
    const { data: data2, error: error2 } = await supabase
      .from('offering_products')
      .select(`
        *,
        offering:offerings!inner(*),
        inventory:inventory_items!offering_id(quantity_available, quantity_reserved)
      `)
      .eq('offering.slug', 'two-dozen-eggs')
      .in('offering.type', ['product_physical', 'subscription'])
      .eq('offering.status', 'published')
      .single()
    
    if (error2) {
      console.error('❌ Alternative Query Error:', error2)
    } else {
      console.log('✅ Alternative query successful!')
      console.log('Inventory field:', data2.inventory)
    }
  } else {
    console.log('\n✅ Inventory data is present!')
    console.log('quantity_available:', data.inventory[0].quantity_available)
    console.log('quantity_reserved:', data.inventory[0].quantity_reserved)
  }
}

testQuery()

