import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const EXPORT_DIR = process.env.EXPORT_DIR || path.join(__dirname, 'exports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Initialize Supabase client to fetch offering_events
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fetch event mapping from Supabase (Firebase event_id -> offering_event_id)
async function fetchEventMapping() {
  console.log('📥 Fetching event mapping from Supabase...\n');

  // Fetch offerings with their metadata (which contains Firebase event_id)
  const { data: offerings, error: offeringsError } = await supabase
    .from('offerings')
    .select('id, metadata')
    .eq('type', 'event');

  if (offeringsError) {
    throw new Error(`Failed to fetch offerings: ${offeringsError.message}`);
  }

  // Fetch offering_events
  const { data: offeringEvents, error: eventsError } = await supabase
    .from('offering_events')
    .select('id, offering_id, event_date, event_start_time');

  if (eventsError) {
    throw new Error(`Failed to fetch offering_events: ${eventsError.message}`);
  }

  // Build mapping: Firebase event_id -> offering_event_id
  const mapping = {};

  offerings.forEach(offering => {
    const firebaseEventId = offering.metadata?.event_id;
    if (firebaseEventId) {
      // Find the corresponding offering_event
      const offeringEvent = offeringEvents.find(oe => oe.offering_id === offering.id);
      if (offeringEvent) {
        mapping[firebaseEventId] = offeringEvent.id;
      }
    }
  });

  console.log(`✅ Loaded mapping for ${Object.keys(mapping).length} events\n`);
  return mapping;
}

async function transformBookings() {
  console.log('🔄 Transforming Firebase bookings and customers to Supabase format...\n');

  try {
    // Load Firebase bookings
    const bookingsPath = path.join(EXPORT_DIR, 'firebase-bookings-latest.json');
    if (!fs.existsSync(bookingsPath)) {
      throw new Error('Firebase bookings export not found. Run 5-export-bookings.js first.');
    }

    // Load Firebase customers
    const customersPath = path.join(EXPORT_DIR, 'firebase-customers-latest.json');
    if (!fs.existsSync(customersPath)) {
      throw new Error('Firebase customers export not found. Run 5-export-bookings.js first.');
    }

    const firebaseBookings = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));
    const firebaseCustomers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));

    console.log(`📖 Loaded ${firebaseBookings.length} Firebase bookings`);
    console.log(`📖 Loaded ${firebaseCustomers.length} Firebase customers\n`);

    // Fetch event mapping
    const eventMapping = await fetchEventMapping();

    // Transform customers (no changes needed, just pass through)
    const customers = firebaseCustomers;

    const bookings = [];
    const bookingAttendees = [];

    let skippedBookings = 0;
    let skippedWorkshops = 0;
    let unmappedEvents = new Set();

    firebaseBookings.forEach((fbBooking) => {
      const bookingTimestamp = fbBooking.timestamp || new Date().toISOString();
      const customerEmail = fbBooking.parent?.email?.toLowerCase().trim() || 'unknown@example.com';
      const customerName = `${fbBooking.parent?.firstName || ''} ${fbBooking.parent?.lastName || ''}`.trim() || 'Unknown';

      // Group attendees by workshop (event_id)
      // This ensures we create ONE booking per workshop with multiple attendees
      const workshopGroups = {}; // key: event_id, value: { workshop, attendees[], offeringEventId }

      if (fbBooking.attendees && Array.isArray(fbBooking.attendees)) {
        fbBooking.attendees.forEach((attendee) => {
          if (attendee.workshop && Array.isArray(attendee.workshop)) {
            attendee.workshop.forEach((workshop) => {
              const firebaseEventId = workshop.event_id;
              const offeringEventId = eventMapping[firebaseEventId];

              if (offeringEventId) {
                if (!workshopGroups[firebaseEventId]) {
                  workshopGroups[firebaseEventId] = {
                    workshop,
                    offeringEventId,
                    attendees: [],
                  };
                }
                workshopGroups[firebaseEventId].attendees.push(attendee);
              } else {
                unmappedEvents.add(firebaseEventId);
                skippedWorkshops++;
              }
            });
          }
        });
      }

      // Skip this entire booking if it has no valid workshops
      const validWorkshopGroups = Object.values(workshopGroups);
      if (validWorkshopGroups.length === 0) {
        skippedBookings++;
        return;
      }

      // Process each workshop group (one booking per workshop with multiple attendees)
      validWorkshopGroups.forEach(({ workshop, offeringEventId, attendees }) => {
        const numberOfAttendees = attendees.length;

        // Create ONE booking for this workshop with correct number_of_attendees
        // Note: customer_id will be set during import after matching with customer email
        const booking = {
          offering_event_id: offeringEventId,
          customer_email: customerEmail,
          customer_name: customerName,
          number_of_attendees: numberOfAttendees,
          status: 'confirmed',
          created_at: bookingTimestamp,
          updated_at: bookingTimestamp,
        };

        bookings.push(booking);

        // Create booking attendees (one record per attendee)
        attendees.forEach((attendee) => {
          const bookingAttendee = {
            booking_index: bookings.length - 1, // Temporary index - links to the booking we just created
            first_name: attendee.firstName || 'Unknown',
            last_name: attendee.lastName || '',
            email: null,
            phone: null,
            notes: attendee.allergies ? `Allergies: ${attendee.allergies}` : null,
          };

          bookingAttendees.push(bookingAttendee);
        });
      });
    });

    console.log('📊 Transformation Summary:');
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log(`   Booking Attendees: ${bookingAttendees.length}`);
    console.log(`   Skipped bookings (no matching events): ${skippedBookings}`);
    console.log(`   Skipped workshops (no matching events): ${skippedWorkshops}`);

    if (unmappedEvents.size > 0) {
      console.log(`\n⚠️  Historical events not in Supabase (${unmappedEvents.size}):`);
      console.log(`   ${Array.from(unmappedEvents).slice(0, 10).join(', ')}${unmappedEvents.size > 10 ? '...' : ''}`);
      console.log(`   These bookings were skipped.`);
    }

    // Save transformed data
    const outputPath = path.join(EXPORT_DIR, `supabase-bookings-${TIMESTAMP}.json`);
    fs.writeFileSync(outputPath, JSON.stringify({
      customers,
      bookings,
      bookingAttendees,
    }, null, 2));

    const latestPath = path.join(EXPORT_DIR, 'supabase-bookings-latest.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(path.basename(outputPath), latestPath);

    console.log(`\n✅ Transformed data saved to ${outputPath}\n`);

    return { customers, bookings, bookingAttendees };
  } catch (error) {
    console.error('❌ Error transforming bookings:', error);
    throw error;
  }
}

(async () => {
  try {
    await transformBookings();
    console.log('✅ Transformation complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Transformation failed:', error);
    process.exit(1);
  }
})();

