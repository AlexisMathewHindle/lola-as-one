/**
 * EXAMPLE: How to use cycle helpers in your code
 * 
 * This file shows practical examples of using the cycle helper functions
 * in different scenarios.
 */

import {
  getNextCycleKey,
  getCurrentCycleKey,
  parseCycleKey,
  formatCycleKey,
  getNextCycles,
} from './cycle-helpers.ts'

// ============================================================================
// EXAMPLE 1: Webhook Handler - Create Subscription Order
// ============================================================================

async function exampleWebhookHandler() {
  // Simulated Stripe invoice
  const invoice = {
    id: 'in_123',
    subscription: 'sub_123',
    created: 1708905600, // Feb 25, 2026 (Unix timestamp in seconds)
    amount_paid: 2500, // £25.00 in pence
    tax: 500,
    payment_intent: 'pi_123'
  }
  
  // Simulated subscription from database
  const subscription = {
    id: 'uuid-123',
    customer_id: 'uuid-customer',
    customer_email: 'customer@example.com',
    stripe_subscription_id: 'sub_123',
    plan: {
      id: 'uuid-plan',
      name: 'Monthly Box',
      cutoff_day: 20, // Orders after 20th ship next month
      stripe_price_id: 'price_123'
    }
  }
  
  // Simulated customer address
  const address = {
    name: 'John Doe',
    address_line1: '123 Main St',
    address_line2: 'Apt 4B',
    city: 'London',
    postcode: 'SW1A 1AA',
    country: 'GB'
  }
  
  // ✅ Calculate which month to ship
  const cycleKey = getNextCycleKey(
    new Date(invoice.created * 1000), // Convert Unix timestamp to Date
    subscription.plan.cutoff_day
  )
  
  console.log('Payment date:', new Date(invoice.created * 1000).toISOString())
  console.log('Cutoff day:', subscription.plan.cutoff_day)
  console.log('Cycle key:', cycleKey) // "2026-03" (after cutoff, so next month)
  console.log('Display:', formatCycleKey(cycleKey)) // "March 2026"
  
  // Create order in database
  const order = {
    order_number: `SUB-${Date.now()}-${subscription.id.slice(0, 8)}`,
    customer_id: subscription.customer_id,
    customer_email: subscription.customer_email,
    order_type: 'subscription_renewal',
    stripe_subscription_id: subscription.stripe_subscription_id,
    stripe_payment_intent_id: invoice.payment_intent,
    
    // Pricing
    subtotal_gbp: invoice.amount_paid / 100,
    shipping_gbp: 0,
    tax_gbp: invoice.tax / 100,
    total_gbp: invoice.amount_paid / 100,
    
    // Address snapshot
    shipping_name: address.name,
    shipping_address_line1: address.address_line1,
    shipping_address_line2: address.address_line2,
    shipping_city: address.city,
    shipping_postcode: address.postcode,
    shipping_country: address.country,
    
    // Fulfillment
    cycle_key: cycleKey, // ✅ "2026-03"
    status: 'queued'
  }
  
  console.log('Order created:', order)
  // In real code: await supabase.from('orders').insert(order)
}

// ============================================================================
// EXAMPLE 2: Admin UI - Filter Orders by Current Month
// ============================================================================

async function exampleAdminUI() {
  // Get current month's cycle key
  const currentCycle = getCurrentCycleKey()
  console.log('Current cycle:', currentCycle) // e.g., "2026-02"
  console.log('Display:', formatCycleKey(currentCycle)) // "February 2026"
  
  // In real code: Query orders for current cycle
  /*
  const { data: orders } = await supabase
    .from('orders')
    .select('*, customer:customers(*)')
    .eq('order_type', 'subscription_renewal')
    .eq('cycle_key', currentCycle)
    .in('status', ['queued', 'packed'])
    .order('created_at', { ascending: true })
  */
  
  // Simulated orders
  const orders = [
    { id: '1', cycle_key: '2026-02', customer_email: 'alice@example.com', status: 'queued' },
    { id: '2', cycle_key: '2026-02', customer_email: 'bob@example.com', status: 'packed' },
  ]
  
  console.log(`\nOrders to ship in ${formatCycleKey(currentCycle)}:`)
  orders.forEach(order => {
    console.log(`- ${order.customer_email} (${order.status})`)
  })
}

// ============================================================================
// EXAMPLE 3: Customer UI - Show Upcoming Shipments
// ============================================================================

async function exampleCustomerUI() {
  // Get next 6 months of cycles
  const upcomingCycles = getNextCycles(getCurrentCycleKey(), 6)
  
  console.log('\nUpcoming shipments:')
  upcomingCycles.forEach((cycle, index) => {
    const { monthName, year } = parseCycleKey(cycle)
    console.log(`${index + 1}. ${monthName} ${year} (${cycle})`)
  })
  
  // Output:
  // 1. February 2026 (2026-02)
  // 2. March 2026 (2026-03)
  // 3. April 2026 (2026-04)
  // 4. May 2026 (2026-05)
  // 5. June 2026 (2026-06)
  // 6. July 2026 (2026-07)
}

// ============================================================================
// EXAMPLE 4: Email Template - Format Cycle for Display
// ============================================================================

function exampleEmailTemplate(cycleKey: string) {
  const { monthName, year } = parseCycleKey(cycleKey)
  
  const emailSubject = `Your ${monthName} ${year} Lola Box is on its way! 📦`
  const emailBody = `
    Hi there!
    
    Great news! Your ${formatCycleKey(cycleKey)} box has been shipped.
    
    You can expect it to arrive during the first week of ${monthName}.
    
    Happy crafting!
    The Lola Team
  `
  
  console.log('\nEmail:')
  console.log('Subject:', emailSubject)
  console.log('Body:', emailBody)
}

// ============================================================================
// EXAMPLE 5: Validation - Check if Cycle Key is Valid
// ============================================================================

function exampleValidation(cycleKey: string) {
  try {
    const { year, month, monthName } = parseCycleKey(cycleKey)
    console.log(`✅ Valid cycle key: ${monthName} ${year}`)
    return true
  } catch (error) {
    console.error(`❌ Invalid cycle key: ${error.message}`)
    return false
  }
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

console.log('='.repeat(80))
console.log('CYCLE HELPERS EXAMPLES')
console.log('='.repeat(80))

console.log('\n📦 EXAMPLE 1: Webhook Handler')
console.log('-'.repeat(80))
await exampleWebhookHandler()

console.log('\n\n👨‍💼 EXAMPLE 2: Admin UI')
console.log('-'.repeat(80))
await exampleAdminUI()

console.log('\n\n👤 EXAMPLE 3: Customer UI')
console.log('-'.repeat(80))
await exampleCustomerUI()

console.log('\n\n📧 EXAMPLE 4: Email Template')
console.log('-'.repeat(80))
exampleEmailTemplate('2026-03')

console.log('\n\n✅ EXAMPLE 5: Validation')
console.log('-'.repeat(80))
exampleValidation('2026-02') // Valid
exampleValidation('2026/02') // Invalid
exampleValidation('2026-13') // Invalid

console.log('\n' + '='.repeat(80))

