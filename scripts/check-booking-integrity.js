import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch, { Headers } from 'node-fetch';

// Polyfill for Node 18
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from app/.env.local
dotenv.config({ path: path.join(__dirname, '../app/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingIntegrity() {
  console.log('🔍 Checking booking data integrity...\n');

  try {
    // Check bookings with missing offering_event relationship
    const { data: brokenBookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        offering_event_id,
        customer_name,
        customer_email,
        status,
        created_at
      `)
      .is('offering_event_id', null);

    if (error) {
      console.error('❌ Error fetching bookings:', error);
      return;
    }

    console.log(`Found ${brokenBookings.length} bookings with NULL offering_event_id\n`);

    if (brokenBookings.length > 0) {
      console.log('📋 Bookings with NULL offering_event_id:');
      brokenBookings.slice(0, 10).forEach(booking => {
        console.log(`   - ${booking.customer_name} (${booking.customer_email}) - ${booking.status}`);
      });
      if (brokenBookings.length > 10) {
        console.log(`   ... and ${brokenBookings.length - 10} more`);
      }
    }

    // Check bookings where offering_event_id points to non-existent events
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('id, offering_event_id, customer_name, customer_email')
      .not('offering_event_id', 'is', null);

    const orphanedBookings = [];
    
    for (const booking of allBookings) {
      const { data: event } = await supabase
        .from('offering_events')
        .select('id')
        .eq('id', booking.offering_event_id)
        .single();

      if (!event) {
        orphanedBookings.push(booking);
      }
    }

    console.log(`\nFound ${orphanedBookings.length} bookings with non-existent offering_event_id\n`);

    if (orphanedBookings.length > 0) {
      console.log('📋 Bookings with invalid offering_event_id:');
      orphanedBookings.slice(0, 10).forEach(booking => {
        console.log(`   - ${booking.customer_name} (${booking.customer_email}) - Event ID: ${booking.offering_event_id}`);
      });
      if (orphanedBookings.length > 10) {
        console.log(`   ... and ${orphanedBookings.length - 10} more`);
      }
    }

    // Summary
    console.log('\n============================================================');
    console.log('📊 SUMMARY');
    console.log('============================================================');
    console.log(`Total bookings checked: ${allBookings.length + brokenBookings.length}`);
    console.log(`Bookings with NULL offering_event_id: ${brokenBookings.length}`);
    console.log(`Bookings with invalid offering_event_id: ${orphanedBookings.length}`);
    console.log(`Total broken bookings: ${brokenBookings.length + orphanedBookings.length}`);
    console.log('============================================================\n');

    if (brokenBookings.length + orphanedBookings.length > 0) {
      console.log('⚠️  These bookings need to be fixed or deleted.');
      console.log('   Options:');
      console.log('   1. Delete these broken bookings');
      console.log('   2. Manually assign them to valid events');
      console.log('   3. Re-run the booking import with corrected data\n');
    } else {
      console.log('✅ All bookings have valid offering_event_id references!\n');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkBookingIntegrity();

