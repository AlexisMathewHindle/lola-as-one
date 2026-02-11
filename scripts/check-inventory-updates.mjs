import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkInventoryUpdates() {
  console.log('🔍 Checking inventory updates...\n')
  console.log('='.repeat(60))

  // Get a specific product - "Strawberry Chocolate Pencil case"
  const { data: product, error: productError } = await supabase
    .from('offering_products')
    .select(`
      *,
      offering:offerings!inner(title, slug),
      inventory:inventory_items(*)
    `)
    .ilike('offering.title', '%Strawberry Chocolate Pencil%')
    .single()

  if (productError) {
    console.error('❌ Error finding product:', productError)
    return
  }

  console.log(`\n📦 Product: ${product.offering.title}`)
  console.log(`   SKU: ${product.sku}`)
  console.log(`   Offering ID: ${product.offering_id}`)
  console.log(`\n📊 Stock Information:`)
  console.log(`   offering_products.stock_quantity: ${product.stock_quantity}`)
  
  if (product.inventory && product.inventory.length > 0) {
    console.log(`   inventory_items.quantity_available: ${product.inventory[0].quantity_available}`)
    console.log(`   inventory_items.quantity_reserved: ${product.inventory[0].quantity_reserved}`)
    console.log(`   inventory_items.id: ${product.inventory[0].id}`)
  } else {
    console.log('   ❌ No inventory_items record found!')
  }

  // Check recent inventory movements
  if (product.inventory && product.inventory.length > 0) {
    const { data: movements, error: movementsError } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('inventory_item_id', product.inventory[0].id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (movementsError) {
      console.error('\n❌ Error fetching movements:', movementsError)
    } else if (movements && movements.length > 0) {
      console.log(`\n📝 Recent Inventory Movements (last 5):`)
      movements.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.movement_type}: ${m.quantity_change} (${new Date(m.created_at).toLocaleString()})`)
      })
    } else {
      console.log('\n📝 No inventory movements recorded')
    }
  }

  // Check recent orders for this product
  const { data: orderItems, error: orderError } = await supabase
    .from('order_items')
    .select(`
      *,
      order:orders(order_number, status, created_at)
    `)
    .eq('offering_id', product.offering_id)
    .order('created_at', { ascending: false })
    .limit(3)

  if (orderError) {
    console.error('\n❌ Error fetching orders:', orderError)
  } else if (orderItems && orderItems.length > 0) {
    console.log(`\n🛒 Recent Orders (last 3):`)
    orderItems.forEach((item, i) => {
      console.log(`   ${i + 1}. Order ${item.order.order_number}: ${item.quantity} units (${item.order.status}) - ${new Date(item.order.created_at).toLocaleString()}`)
    })
  } else {
    console.log('\n🛒 No recent orders found')
  }

  console.log('\n' + '='.repeat(60))
  console.log('')
}

checkInventoryUpdates()

