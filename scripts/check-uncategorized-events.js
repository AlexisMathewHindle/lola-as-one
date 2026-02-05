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
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUncategorizedEvents() {
  console.log('🔍 Checking for uncategorized events...\n');

  try {
    // Get all events with their offering titles
    const { data: events, error } = await supabase
      .from('offering_events')
      .select(`
        id,
        category_id,
        event_date,
        offering:offerings(title)
      `)
      .is('category_id', null)
      .order('event_date', { ascending: false });

    if (error) {
      console.error('❌ Error fetching events:', error);
      return;
    }

    console.log(`Found ${events.length} events without category_id\n`);

    if (events.length > 0) {
      console.log('📋 Uncategorized events:');
      
      // Group by offering title
      const grouped = {};
      events.forEach(event => {
        const title = event.offering?.title || 'Unknown';
        if (!grouped[title]) {
          grouped[title] = [];
        }
        grouped[title].push(event);
      });

      Object.entries(grouped).forEach(([title, eventList]) => {
        console.log(`\n   "${title}" - ${eventList.length} events`);
        eventList.slice(0, 3).forEach(e => {
          console.log(`      - ${e.event_date} (ID: ${e.id})`);
        });
        if (eventList.length > 3) {
          console.log(`      ... and ${eventList.length - 3} more`);
        }
      });

      console.log('\n============================================================');
      console.log('📊 SUMMARY');
      console.log('============================================================');
      console.log(`Total uncategorized events: ${events.length}`);
      console.log(`Unique offering titles: ${Object.keys(grouped).length}`);
      console.log('============================================================\n');
    } else {
      console.log('✅ All events have categories assigned!\n');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkUncategorizedEvents();

