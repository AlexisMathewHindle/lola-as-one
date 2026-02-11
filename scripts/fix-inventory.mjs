import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixInventory() {
  console.log('🔧 Fixing Inventory Issues...\n')
  console.log('='.repeat(60))

  // Get all physical product offerings
  const { data: offerings, error: offeringsError } = await supabase
    .from('offerings')
    .select('id, title, slug, type, status')
    .eq('type', 'product_physical')
    .eq('status', 'published')

  if (offeringsError) {
    console.error('❌ Error fetching offerings:', offeringsError)
    return
  }

  console.log(`\n📦 Found ${offerings.length} physical products\n`)

  let fixed = 0
  let created = 0
  let skipped = 0

  for (const offering of offerings) {
    console.log(`\nChecking: ${offering.title}`)

    // Get offering_products separately since the nested query might not work
    const { data: products, error: productError } = await supabase
      .from('offering_products')
      .select('*')
      .eq('offering_id', offering.id)
      .maybeSingle()

    if (productError || !products) {
      console.log('  ⚠️  No offering_products record - skipping')
      skipped++
      continue
    }

    const product = products
    console.log(`  SKU: ${product.sku}`)
    console.log(`  Stock Quantity (offering_products): ${product.stock_quantity}`)

    // Check if inventory_items record exists
    const { data: existingInventory, error: checkError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('offering_id', offering.id)
      .maybeSingle()

    if (checkError) {
      console.error('  ❌ Error checking inventory:', checkError)
      continue
    }

    if (existingInventory) {
      console.log(`  Current inventory: ${existingInventory.quantity_available} available`)
      
      // Update if quantity is 0 or less
      if (existingInventory.quantity_available <= 0) {
        const newQuantity = product.stock_quantity || 10 // Default to 10 if not set
        
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            quantity_available: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInventory.id)

        if (updateError) {
          console.error('  ❌ Error updating inventory:', updateError)
        } else {
          console.log(`  ✅ Updated quantity_available: 0 → ${newQuantity}`)
          fixed++
        }
      } else {
        console.log('  ✓ Inventory looks good')
      }
    } else {
      // Create inventory_items record
      console.log('  ⚠️  No inventory_items record found - creating...')
      
      const { error: createError } = await supabase
        .from('inventory_items')
        .insert({
          offering_product_id: product.id,
          offering_id: offering.id,
          sku: product.sku,
          item_type: 'product_physical',
          quantity_available: product.stock_quantity || 10,
          quantity_reserved: 0,
          low_stock_threshold: 5,
        })

      if (createError) {
        console.error('  ❌ Error creating inventory:', createError)
      } else {
        console.log(`  ✅ Created inventory_items record with quantity: ${product.stock_quantity || 10}`)
        created++
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Summary:')
  console.log(`  ✅ Fixed: ${fixed} products`)
  console.log(`  ➕ Created: ${created} inventory records`)
  console.log(`  ⏭️  Skipped: ${skipped} products`)
  console.log('\n✨ Inventory fix complete! Try ordering again.\n')
}

fixInventory()

