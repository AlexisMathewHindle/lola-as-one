import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function maskEmail(email = '') {
  return email.replace(/^(.).+(@.+)$/, '$1***$2')
}

async function checkRecentOrders() {
  console.log('📦 Checking Recent Orders and Email Logs...\n')
  console.log('='.repeat(60))

  // Get recent orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (ordersError) {
    console.error('❌ Error fetching orders:', ordersError)
    return
  }

  if (!orders || orders.length === 0) {
    console.log('📭 No orders found')
    return
  }

  console.log(`\n📦 Found ${orders.length} recent orders:\n`)

  for (const order of orders) {
    console.log(`Order: ${order.order_number}`)
    console.log(`  Customer: ${maskEmail(order.customer_email)}`)
    console.log(`  Total: £${order.total_gbp.toFixed(2)}`)
    console.log(`  Status: ${order.status}`)
    console.log(`  Created: ${new Date(order.created_at).toLocaleString()}`)

    // Check for emails sent for this exact order. Matching by recipient and
    // timestamp over-counts for repeat customers.
    const { data: emails, error: emailsError } = await supabase
      .from('email_logs')
      .select('*')
      .contains('metadata', { orderNumber: order.order_number })
      .order('sent_at', { ascending: false })

    if (emailsError) {
      console.error('  ❌ Error fetching emails:', emailsError)
    } else if (emails && emails.length > 0) {
      console.log(`  📧 Emails sent: ${emails.length}`)
      emails.forEach(email => {
        console.log(`     - ${email.template} to ${maskEmail(email.recipient)} (${email.status}) at ${new Date(email.sent_at).toLocaleTimeString()}`)
        if (email.error_message) {
          console.log(`       Error: ${email.error_message}`)
        }
      })
    } else {
      console.log('  ⚠️  No emails found for this order!')
    }

    console.log('')
  }

  // Check for admin emails
  console.log('='.repeat(60))
  console.log('\n📧 Admin Notification Emails:\n')

  const { data: adminEmails, error: adminEmailsError } = await supabase
    .from('email_logs')
    .select('*')
    .in('template', ['new-order-admin', 'event-booking-admin'])
    .order('sent_at', { ascending: false })
    .limit(5)

  if (adminEmailsError) {
    console.error('❌ Error fetching admin emails:', adminEmailsError)
  } else if (adminEmails && adminEmails.length > 0) {
    console.log(`Found ${adminEmails.length} admin notification emails:\n`)
    adminEmails.forEach(email => {
      const metadata = email.metadata || {}
      console.log(`  Order: ${metadata.orderNumber || 'Unknown'}`)
      console.log(`  Status: ${email.status}`)
      console.log(`  Sent: ${new Date(email.sent_at).toLocaleString()}`)
      console.log('')
    })
  } else {
    console.log('⚠️  No admin notification emails found')
    console.log('This is expected if you haven\'t deployed the updated webhook yet.')
  }

  console.log('='.repeat(60))
}

checkRecentOrders()
