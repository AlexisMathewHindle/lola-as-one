import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load from root .env.local first (has service role key)
dotenv.config({ path: '.env.local' })
// Then load from app/.env.local (has VITE_ vars)
dotenv.config({ path: 'app/.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in app/.env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createInventoryItems() {
  console.log('🔄 Creating inventory items for all products...\n')
  console.log('='.repeat(60))
  
  // Get all offering_products
  const { data: products, error: prodError } = await supabase
    .from('offering_products')
    .select(`
      id,
      offering_id,
      sku,
      stock_quantity,
      track_inventory,
      offering:offerings!inner(title, type)
    `)
    .eq('offering.type', 'product_physical')
  
  if (prodError) {
    console.error('❌ Error fetching products:', prodError)
    return
  }

  console.log(`\nFound ${products.length} physical products\n`)
  
  let created = 0
  let skipped = 0
  let errors = 0
  
  for (const product of products) {
    // Check if inventory item already exists
    const { data: existing, error: checkError } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('sku', product.sku)
      .maybeSingle()
    
    if (existing) {
      console.log(`⏭️  Skipped ${product.sku} - already exists`)
      skipped++
      continue
    }
    
    // Create inventory item
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
      console.error(`❌ Error creating inventory for ${product.sku}:`, createError.message)
      errors++
    } else {
      console.log(`✅ Created inventory for ${product.sku} (${product.offering.title}) - qty: ${product.stock_quantity || 0}`)
      created++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log('')
  
  if (created > 0) {
    console.log('✨ Inventory items created successfully!')
    console.log('Now the stock status badges should work correctly.\n')
  }
}

createInventoryItems()

