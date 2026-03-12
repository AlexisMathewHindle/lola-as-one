#!/usr/bin/env node

/**
 * Check for common checkout issues
 * This script helps diagnose why checkout might be failing
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Check specific event from the error
async function checkSpecificEvent() {
  console.log('🔍 Checking specific event from cart...\n')

  const eventId = '52604556-e927-481f-887a-8df9d6e36c41'
  const offeringId = '3bb7ffe8-8a17-4957-97f0-494dbb2f1987'

  console.log(`Event ID: ${eventId}`)
  console.log(`Offering ID: ${offeringId}\n`)

  // Check if event exists
  const { data: event, error: eventError } = await supabase
    .from('offering_events')
    .select('id, max_capacity, current_bookings, offering_id, event_date, event_time')
    .eq('id', eventId)
    .single()

  if (eventError) {
    console.error('❌ Event NOT found in offering_events table')
    console.error('Error:', eventError.message)
    console.error('Error code:', eventError.code)
    console.error('Error details:', eventError.details)
  } else if (event) {
    console.log('✅ Event found in offering_events:')
    console.log(JSON.stringify(event, null, 2))
  } else {
    console.error('❌ Event not found (no error, but no data)')
  }

  console.log('\n')

  // Check if offering exists
  const { data: offering, error: offeringError } = await supabase
    .from('offerings')
    .select('id, title, type, status')
    .eq('id', offeringId)
    .single()

  if (offeringError) {
    console.error('❌ Offering NOT found')
    console.error('Error:', offeringError.message)
  } else if (offering) {
    console.log('✅ Offering found:')
    console.log(JSON.stringify(offering, null, 2))
  }

  console.log('\n')
}

async function checkCheckoutIssues() {
  console.log('🔍 Checking for common checkout issues...\n')

  // 1. Check for events without offering_events records
  console.log('1️⃣ Checking for offerings without offering_events...')
  const { data: offeringsWithoutEvents, error: error1 } = await supabase
    .from('offerings')
    .select(`
      id,
      title,
      type,
      offering_events (id)
    `)
    .eq('type', 'event')
    .eq('status', 'active')

  if (error1) {
    console.error('Error:', error1)
  } else {
    const missing = offeringsWithoutEvents.filter(o => !o.offering_events || o.offering_events.length === 0)
    if (missing.length > 0) {
      console.log(`⚠️  Found ${missing.length} active event offerings without offering_events:`)
      missing.forEach(o => console.log(`   - ${o.title} (${o.id})`))
    } else {
      console.log('✅ All active event offerings have offering_events')
    }
  }
  console.log('')

  // 2. Check for sold out events
  console.log('2️⃣ Checking for sold out events...')
  const { data: soldOutEvents, error: error2 } = await supabase
    .from('offering_events')
    .select(`
      id,
      offering:offerings(title),
      max_capacity,
      current_bookings,
      event_date
    `)
    .gte('event_date', new Date().toISOString().split('T')[0])

  if (error2) {
    console.error('Error:', error2)
  } else {
    const soldOut = soldOutEvents.filter(e => e.current_bookings >= e.max_capacity)
    if (soldOut.length > 0) {
      console.log(`⚠️  Found ${soldOut.length} sold out upcoming events:`)
      soldOut.forEach(e => {
        console.log(`   - ${e.offering?.title} on ${e.event_date} (${e.current_bookings}/${e.max_capacity})`)
      })
    } else {
      console.log('✅ No sold out events found')
    }
  }
  console.log('')

  // 3. Check event_capacity table consistency
  console.log('3️⃣ Checking event_capacity table...')
  const { data: capacityRecords, error: error3 } = await supabase
    .from('event_capacity')
    .select(`
      offering_event_id,
      spaces_available,
      offering_event:offering_events(
        id,
        max_capacity,
        current_bookings,
        offering:offerings(title)
      )
    `)

  if (error3) {
    console.error('Error:', error3)
  } else {
    const inconsistent = capacityRecords.filter(c => {
      const calculated = c.offering_event.max_capacity - c.offering_event.current_bookings
      return c.spaces_available !== calculated
    })
    
    if (inconsistent.length > 0) {
      console.log(`⚠️  Found ${inconsistent.length} events with inconsistent capacity:`)
      inconsistent.forEach(c => {
        const calculated = c.offering_event.max_capacity - c.offering_event.current_bookings
        console.log(`   - ${c.offering_event.offering?.title}: event_capacity says ${c.spaces_available}, calculated is ${calculated}`)
      })
    } else {
      console.log('✅ All event_capacity records are consistent')
    }
  }
  console.log('')

  // 4. Check for events with invalid dates
  console.log('4️⃣ Checking for events with past dates still marked as active...')
  const { data: pastEvents, error: error4 } = await supabase
    .from('offering_events')
    .select(`
      id,
      event_date,
      offering:offerings(title, status)
    `)
    .lt('event_date', new Date().toISOString().split('T')[0])
    .eq('offerings.status', 'active')

  if (error4) {
    console.error('Error:', error4)
  } else {
    if (pastEvents.length > 0) {
      console.log(`⚠️  Found ${pastEvents.length} past events still active:`)
      pastEvents.slice(0, 10).forEach(e => {
        console.log(`   - ${e.offering?.title} on ${e.event_date}`)
      })
      if (pastEvents.length > 10) {
        console.log(`   ... and ${pastEvents.length - 10} more`)
      }
    } else {
      console.log('✅ No past events marked as active')
    }
  }
  console.log('')

  console.log('✅ Checkout issue check complete!')
  console.log('\n💡 Next steps:')
  console.log('   1. Check the Supabase function logs for the actual error')
  console.log('   2. Try checkout again and note which event causes the error')
  console.log('   3. Check if that event has an offering_events record')
}

checkCheckoutIssues().catch(console.error)

