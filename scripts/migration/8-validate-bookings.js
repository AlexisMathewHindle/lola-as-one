import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const EXPORT_DIR = process.env.EXPORT_DIR || './exports';
const LOG_DIR = process.env.LOG_DIR || './logs';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateBookings() {
  console.log('🔍 Validating booking migration...\n');
  console.log('============================================================');
  console.log('📊 Validation Report');
  console.log('============================================================\n');

  try {
    // Load Firebase data
    const firebaseBookingsPath = path.join(EXPORT_DIR, 'firebase-bookings-latest.json');
    const firebaseBookings = JSON.parse(fs.readFileSync(firebaseBookingsPath, 'utf8'));

    // Count total workshops in Firebase bookings
    let firebaseWorkshopCount = 0;
    firebaseBookings.forEach(booking => {
      if (booking.attendees) {
        booking.attendees.forEach(attendee => {
          if (attendee.workshop) {
            firebaseWorkshopCount += attendee.workshop.length;
          }
        });
      }
    });

    // Count Supabase records
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { count: orderItemsCount } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true });

    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    const { count: attendeesCount } = await supabase
      .from('booking_attendees')
      .select('*', { count: 'exact', head: true });

    const { count: offeringsCount } = await supabase
      .from('offerings')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'event');

    const { count: offeringEventsCount } = await supabase
      .from('offering_events')
      .select('*', { count: 'exact', head: true });

    // Check event capacity
    const { data: capacityData } = await supabase
      .from('event_capacity')
      .select('offering_event_id, total_capacity, spaces_booked, spaces_available');

    const totalSpacesBooked = capacityData?.reduce((sum, ec) => sum + (ec.spaces_booked || 0), 0) || 0;

    // Sample bookings
    const { data: sampleBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_email,
        customer_name,
        number_of_attendees,
        status,
        created_at,
        offering_events (
          event_date,
          event_start_time,
          offerings (
            title
          )
        )
      `)
      .limit(5);

    // Print results
    console.log('📈 Record Counts:');
    console.log(`   Firebase Bookings: ${firebaseBookings.length}`);
    console.log(`   Firebase Workshop Bookings: ${firebaseWorkshopCount}`);
    console.log(`   Supabase Orders: ${ordersCount || 0}`);
    console.log(`   Supabase Order Items: ${orderItemsCount || 0}`);
    console.log(`   Supabase Bookings: ${bookingsCount || 0}`);
    console.log(`   Supabase Booking Attendees: ${attendeesCount || 0}`);
    console.log(`   Supabase Event Offerings: ${offeringsCount || 0}`);
    console.log(`   Supabase Offering Events: ${offeringEventsCount || 0}\n`);

    console.log('🎫 Event Capacity:');
    console.log(`   Total Events with Capacity Tracking: ${capacityData?.length || 0}`);
    console.log(`   Total Spaces Booked (across all events): ${totalSpacesBooked}\n`);

    console.log('📋 Sample Bookings:');
    sampleBookings?.forEach((booking, i) => {
      console.log(`   ${i + 1}. ${booking.customer_name} (${booking.customer_email})`);
      console.log(`      Event: ${booking.offering_events?.offerings?.title || 'N/A'}`);
      console.log(`      Date: ${booking.offering_events?.event_date || 'N/A'}`);
      console.log(`      Time: ${booking.offering_events?.event_start_time || 'N/A'}`);
      console.log(`      Attendees: ${booking.number_of_attendees}`);
      console.log(`      Status: ${booking.status}\n`);
    });

    // Validation checks
    const checks = {
      ordersMatch: ordersCount === firebaseBookings.length,
      bookingsMatch: bookingsCount === firebaseWorkshopCount,
      attendeesMatch: attendeesCount === firebaseWorkshopCount,
      capacityUpdated: totalSpacesBooked > 0,
    };

    console.log('✅ Validation Checks:');
    console.log(`   Orders count matches: ${checks.ordersMatch ? '✅' : '❌'}`);
    console.log(`   Bookings count matches: ${checks.bookingsMatch ? '✅' : '❌'}`);
    console.log(`   Attendees count matches: ${checks.attendeesMatch ? '✅' : '❌'}`);
    console.log(`   Event capacity updated: ${checks.capacityUpdated ? '✅' : '❌'}\n`);

    const allPassed = Object.values(checks).every(check => check === true);

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      firebaseBookings: firebaseBookings.length,
      firebaseWorkshopBookings: firebaseWorkshopCount,
      supabaseOrders: ordersCount,
      supabaseOrderItems: orderItemsCount,
      supabaseBookings: bookingsCount,
      supabaseAttendees: attendeesCount,
      supabaseOfferings: offeringsCount,
      supabaseOfferingEvents: offeringEventsCount,
      totalSpacesBooked,
      checks,
      allPassed,
    };

    const reportPath = path.join(LOG_DIR, `booking-validation-report-${TIMESTAMP}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('============================================================');
    console.log(`   Full report saved to: ${reportPath}`);
    console.log('============================================================\n');

    if (allPassed) {
      console.log('✅ All validation checks passed!\n');
    } else {
      console.log('⚠️  Some validation checks failed. Please review the report.\n');
    }

    return report;
  } catch (error) {
    console.error('❌ Error validating bookings:', error);
    throw error;
  }
}

(async () => {
  try {
    await validateBookings();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
})();

