import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
  // Check for duplicate bookings (same customer, same event)
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      customer_email,
      customer_name,
      number_of_attendees,
      offering_event_id,
      offering_event:offering_events(
        event_date,
        event_start_time,
        offering:offerings(title)
      )
    `)
    .order('customer_email');
  
  // Group by customer_email + offering_event_id
  const groups = {};
  bookings.forEach(b => {
    const key = `${b.customer_email}|${b.offering_event_id}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });
  
  // Find duplicates
  console.log('Checking for duplicate bookings (same customer + same event):\n');
  let duplicateCount = 0;
  Object.entries(groups).forEach(([key, bookings]) => {
    if (bookings.length > 1) {
      duplicateCount++;
      console.log(`Duplicate found:`);
      console.log(`  Customer: ${bookings[0].customer_email} (${bookings[0].customer_name})`);
      console.log(`  Event: ${bookings[0].offering_event?.offering?.title}`);
      console.log(`  Date: ${bookings[0].offering_event?.event_date}`);
      console.log(`  Number of bookings: ${bookings.length}`);
      console.log(`  Booking IDs: ${bookings.map(b => b.id.substring(0, 8)).join(', ')}`);
      console.log('');
    }
  });
  
  if (duplicateCount === 0) {
    console.log('No duplicate bookings found!');
  } else {
    console.log(`Total duplicate groups: ${duplicateCount}`);
  }
}

checkDuplicates();

