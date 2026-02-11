import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testOrderConfirmationEmail() {
  console.log('🧪 Testing Order Confirmation Email...\n')

  const testData = {
    template: 'order-confirmation',
    to: 'alexishindle@gmail.com',
    data: {
      orderNumber: 'TEST-001',
      customerName: 'Alexis Hindle',
      orderItems: [
        { name: 'Handcrafted Candle', quantity: 2, price: 50.00 },
        { name: 'Artisan Soap Set', quantity: 1, price: 25.00 },
      ],
      subtotal: 75.00,
      shipping: 5.00,
      vat: 16.00,
      total: 96.00,
      shippingAddress: {
        line1: '123 Test Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'GB',
      },
      paymentMethod: 'Card ending in 4242',
      estimatedDelivery: '3-5 business days',
    },
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: testData,
    })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Email sent successfully!')
    console.log('📧 Response:', data)
    console.log('\n📬 Check your inbox at alexishindle@gmail.com')
  } catch (err) {
    console.error('❌ Exception:', err)
  }
}

async function testEventBookingEmail() {
  console.log('\n🧪 Testing Event Booking Confirmation Email...\n')

  const testData = {
    template: 'event-booking-confirmation',
    to: 'alexishindle@gmail.com',
    data: {
      customerName: 'Alexis Hindle',
      eventName: 'Candle Making Workshop',
      eventDate: 'Saturday, 15th February 2026',
      eventTime: '2:00 PM - 4:00 PM',
      location: 'Lola As One Studio, London',
      numberOfAttendees: 2,
      bookingReference: 'BKG-TEST-001',
      orderNumber: 'TEST-001',
      pricePaid: 60.00,
      whatToBring: 'Just yourself and your creativity!',
      parkingInfo: 'Free parking available on site',
      cancellationPolicy: 'Full refund if cancelled 48 hours before the event',
    },
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: testData,
    })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Email sent successfully!')
    console.log('📧 Response:', data)
    console.log('\n📬 Check your inbox at alexishindle@gmail.com')
  } catch (err) {
    console.error('❌ Exception:', err)
  }
}

async function testWaitlistEmail() {
  console.log('\n🧪 Testing Waitlist Event Available Email...\n')

  const testData = {
    template: 'waitlist-event-available',
    to: 'alexishindle@gmail.com',
    data: {
      customerName: 'Alexis Hindle',
      eventName: 'Pottery Workshop',
      eventDate: 'Sunday, 23rd February 2026',
      eventTime: '10:00 AM - 1:00 PM',
      location: 'Lola As One Studio, London',
      spacesAvailable: 1,
      price: 75.00,
      expiryTime: 'Tomorrow at 2:00 PM',
      bookingLink: 'https://lolaasone.com/events/pottery-workshop',
    },
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: testData,
    })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Email sent successfully!')
    console.log('📧 Response:', data)
    console.log('\n📬 Check your inbox at alexishindle@gmail.com')
  } catch (err) {
    console.error('❌ Exception:', err)
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Email Tests\n')
  console.log('=' .repeat(50))
  
  await testOrderConfirmationEmail()
  await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
  
  await testEventBookingEmail()
  await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
  
  await testWaitlistEmail()
  
  console.log('\n' + '='.repeat(50))
  console.log('\n✅ All tests complete!')
  console.log('📊 Check the email_logs table in your database')
  console.log('📧 Check your Resend dashboard for delivery status')
}

runAllTests()

