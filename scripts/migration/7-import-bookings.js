import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const EXPORT_DIR = process.env.EXPORT_DIR || path.join(__dirname, 'exports');
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, 'logs');
const DRY_RUN = process.env.DRY_RUN === 'true';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to generate order number
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

async function importBookings() {
  console.log('📥 Importing customers and bookings to Supabase...\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No data will be written\n');
  }

  try {
    // Load transformed data
    const dataPath = path.join(EXPORT_DIR, 'supabase-bookings-latest.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error('Transformed bookings not found. Run 6-transform-bookings.js first.');
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📖 Loaded transformed data:`);
    console.log(`   Customers: ${data.customers.length}`);
    console.log(`   Bookings: ${data.bookings.length}`);
    console.log(`   Booking Attendees: ${data.bookingAttendees.length}\n`);

    if (DRY_RUN) {
      console.log('✅ DRY RUN: Data validation passed\n');
      return;
    }

    // Step 0: Ensure event_capacity records exist with sufficient capacity
    console.log('🔧 Preparing event capacity records...\n');
    const eventBookingCounts = {};
    data.bookings.forEach(booking => {
      const eventId = booking.offering_event_id;
      eventBookingCounts[eventId] = (eventBookingCounts[eventId] || 0) + booking.number_of_attendees;
    });

    for (const [eventId, totalAttendees] of Object.entries(eventBookingCounts)) {
      // Check if event_capacity exists
      const { data: existingCapacity } = await supabase
        .from('event_capacity')
        .select('*')
        .eq('offering_event_id', eventId)
        .single();

      if (existingCapacity) {
        // Update to ensure sufficient capacity (current booked + new attendees we're importing)
        const requiredCapacity = existingCapacity.spaces_booked + existingCapacity.spaces_reserved + totalAttendees;
        const newTotalCapacity = Math.max(existingCapacity.total_capacity, requiredCapacity);

        console.log(`   Event ${eventId}: current=${existingCapacity.spaces_booked}, adding=${totalAttendees}, new_capacity=${newTotalCapacity}`);

        await supabase
          .from('event_capacity')
          .update({ total_capacity: newTotalCapacity })
          .eq('offering_event_id', eventId);
      } else {
        // Create new capacity record
        const { data: eventData } = await supabase
          .from('offering_events')
          .select('max_capacity')
          .eq('id', eventId)
          .single();

        const totalCapacity = Math.max(eventData?.max_capacity || 0, totalAttendees);

        console.log(`   Event ${eventId}: new record, capacity=${totalCapacity}, attendees=${totalAttendees}`);

        await supabase
          .from('event_capacity')
          .insert({
            offering_event_id: eventId,
            total_capacity: totalCapacity,
            spaces_booked: 0,
            spaces_reserved: 0,
          });
      }
    }
    console.log(`✅ Prepared capacity for ${Object.keys(eventBookingCounts).length} events\n`);

    // Step 1: Fetch existing customers (skip import as they're already done)
    console.log('👥 Fetching existing customers...\n');
    const customerIdMapping = {}; // email -> customer_id

    // Fetch all existing customers
    const { data: existingCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id, email');

    if (fetchError) {
      console.error('❌ Error fetching customers:', fetchError.message);
      throw fetchError;
    }

    // Build email -> id mapping
    existingCustomers.forEach(customer => {
      customerIdMapping[customer.email.toLowerCase()] = customer.id;
    });

    console.log(`✅ Loaded ${existingCustomers.length} existing customers\n`);

    // Step 2: Fetch offering event details for creating orders
    console.log('📋 Fetching event details...\n');
    const eventDetailsCache = {};

    for (const booking of data.bookings) {
      if (!eventDetailsCache[booking.offering_event_id]) {
        const { data: event, error } = await supabase
          .from('offering_events')
          .select('offering_id, event_date, event_start_time, price_gbp')
          .eq('id', booking.offering_event_id)
          .single();

        if (error) {
          console.error(`   ❌ Error fetching event ${booking.offering_event_id}:`, error.message);
          continue;
        }

        // Fetch offering title
        const { data: offering, error: offeringError } = await supabase
          .from('offerings')
          .select('title')
          .eq('id', event.offering_id)
          .single();

        if (offeringError) {
          console.error(`   ❌ Error fetching offering ${event.offering_id}:`, offeringError.message);
          continue;
        }

        eventDetailsCache[booking.offering_event_id] = {
          ...event,
          title: offering.title,
        };
      }
    }

    console.log(`✅ Cached ${Object.keys(eventDetailsCache).length} event details\n`);

    // Step 3: Create orders and bookings together
    console.log('🎫 Importing bookings with orders...\n');
    const bookingIdMapping = {}; // booking_index -> booking_id
    let ordersCreated = 0;
    let orderItemsCreated = 0;

    for (let i = 0; i < data.bookings.length; i++) {
      const booking = data.bookings[i];
      const customerId = customerIdMapping[booking.customer_email];
      const eventDetails = eventDetailsCache[booking.offering_event_id];

      if (!eventDetails) {
        console.error(`   ❌ Event details not found for booking ${i}`);
        continue;
      }

      // Create order (tracking record for this booking)
      const orderNumber = generateOrderNumber();
      const unitPrice = parseFloat(eventDetails.price_gbp);
      const quantity = booking.number_of_attendees;
      const totalPrice = unitPrice * quantity;

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId || null,
          customer_email: booking.customer_email,
          order_type: 'one_time',
          subtotal_gbp: totalPrice,
          shipping_gbp: 0,
          tax_gbp: totalPrice * 0.2 / 1.2, // VAT included in price
          total_gbp: totalPrice,
          status: 'paid',
          fulfilled_at: booking.created_at, // Mark as fulfilled since these are historical bookings
          created_at: booking.created_at,
          updated_at: booking.created_at,
        })
        .select()
        .single();

      if (orderError) {
        console.error(`   ❌ Error creating order for booking ${i}:`, orderError.message);
        continue;
      }

      ordersCreated++;

      // Create order item
      const { data: createdOrderItem, error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: createdOrder.id,
          offering_id: eventDetails.offering_id,
          item_type: 'event',
          title: eventDetails.title,
          quantity: quantity,
          unit_price_gbp: unitPrice,
          total_price_gbp: totalPrice,
          event_date: eventDetails.event_date,
          event_start_time: eventDetails.event_start_time,
          created_at: booking.created_at,
        })
        .select()
        .single();

      if (orderItemError) {
        console.error(`   ❌ Error creating order item for booking ${i}:`, orderItemError.message);
        continue;
      }

      orderItemsCreated++;

      // Create booking
      const { data: createdBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          order_id: createdOrder.id,
          order_item_id: createdOrderItem.id,
          offering_event_id: booking.offering_event_id,
          customer_id: customerId || null,
          customer_email: booking.customer_email,
          customer_name: booking.customer_name,
          number_of_attendees: booking.number_of_attendees,
          status: booking.status,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
        })
        .select()
        .single();

      if (bookingError) {
        console.error(`   ❌ Error creating booking ${i}:`, bookingError.message);
        continue;
      }

      bookingIdMapping[i] = createdBooking.id;
    }

    console.log(`✅ Imported ${Object.keys(bookingIdMapping).length} bookings`);
    console.log(`✅ Created ${ordersCreated} orders (tracking records)`);
    console.log(`✅ Created ${orderItemsCreated} order items\n`);

    // Step 4: Import booking attendees
    console.log('👥 Importing booking attendees...\n');
    let attendeesImported = 0;

    for (const attendee of data.bookingAttendees) {
      const { booking_index, ...attendeeData } = attendee;
      const bookingId = bookingIdMapping[booking_index];

      if (!bookingId) {
        console.error(`   ❌ Booking not found for attendee`);
        continue;
      }

      const { error } = await supabase
        .from('booking_attendees')
        .insert({
          ...attendeeData,
          booking_id: bookingId,
        });

      if (error) {
        console.error(`   ❌ Error creating attendee:`, error.message);
        continue;
      }

      attendeesImported++;
    }

    console.log(`✅ Imported ${attendeesImported} booking attendees\n`);

    // Save import results
    const results = {
      timestamp: new Date().toISOString(),
      customersImported: Object.keys(customerIdMapping).length,
      ordersCreated,
      orderItemsCreated,
      bookingsImported: Object.keys(bookingIdMapping).length,
      attendeesImported,
    };

    const resultsPath = path.join(LOG_DIR, `booking-import-results-${TIMESTAMP}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    console.log('📊 Import Summary:');
    console.log(`   Customers: ${results.customersImported}`);
    console.log(`   Orders (tracking): ${results.ordersCreated}`);
    console.log(`   Order Items: ${results.orderItemsCreated}`);
    console.log(`   Bookings: ${results.bookingsImported}`);
    console.log(`   Attendees: ${results.attendeesImported}`);
    console.log(`\n   Results saved to: ${resultsPath}\n`);

    return results;
  } catch (error) {
    console.error('❌ Error importing bookings:', error);
    throw error;
  }
}

(async () => {
  try {
    await importBookings();
    console.log('✅ Import complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
})();

