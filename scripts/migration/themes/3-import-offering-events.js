/**
 * Step 3: Import Offering Events to Supabase
 * 
 * This script imports transformed theme data into Supabase:
 * - offerings table (content shell)
 * - offering_events table (event-specific details)
 * - event_capacity table (capacity tracking)
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import fetch, { Headers, Request, Response } from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

// Polyfill for Node 14
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const EXPORT_DIR = process.env.EXPORT_DIR || path.join(__dirname, 'exports');
const LOGS_DIR = process.env.LOGS_DIR || path.join(__dirname, '..', 'logs');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Import a single offering with its event details
 */
async function importOfferingEvent(offering, offeringEvent) {
  try {
    // Step 1: Create offering
    const { data: createdOffering, error: offeringError } = await supabase
      .from('offerings')
      .insert(offering)
      .select()
      .single();
    
    if (offeringError) {
      throw new Error(`Failed to create offering: ${offeringError.message}`);
    }
    
    console.log(`   ✅ Created offering (ID: ${createdOffering.id})`);
    
    // Step 2: Create offering_event
    const { data: createdEvent, error: eventError } = await supabase
      .from('offering_events')
      .insert({
        offering_id: createdOffering.id,
        event_date: offeringEvent.event_date,
        event_start_time: offeringEvent.event_start_time,
        event_end_time: offeringEvent.event_end_time,
        location_name: offeringEvent.location_name,
        location_address: offeringEvent.location_address,
        location_city: offeringEvent.location_city,
        location_postcode: offeringEvent.location_postcode,
        max_capacity: offeringEvent.max_capacity,
        current_bookings: offeringEvent.current_bookings,
        price_gbp: offeringEvent.price_gbp,
        vat_rate: offeringEvent.vat_rate,
      })
      .select()
      .single();
    
    if (eventError) {
      // Rollback: delete the offering if event creation fails
      await supabase.from('offerings').delete().eq('id', createdOffering.id);
      throw new Error(`Failed to create offering_event: ${eventError.message}`);
    }
    
    console.log(`   ✅ Created offering_event (ID: ${createdEvent.id})`);
    
    // Step 3: Create event_capacity record
    const { error: capacityError } = await supabase
      .from('event_capacity')
      .insert({
        offering_event_id: createdEvent.id,
        total_capacity: offeringEvent.max_capacity,
        spaces_booked: offeringEvent.current_bookings,
        spaces_reserved: 0,
        waitlist_enabled: false,
        waitlist_count: 0,
      });
    
    if (capacityError) {
      console.warn(`   ⚠️  Failed to create event_capacity: ${capacityError.message}`);
    } else {
      console.log(`   ✅ Created event_capacity`);
    }
    
    return {
      success: true,
      offering_id: createdOffering.id,
      offering_event_id: createdEvent.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Import all offering events in batches
 */
async function importOfferingEvents() {
  console.log('📥 Importing offering events to Supabase...\n');
  
  try {
    // Read transformed data
    const dataPath = path.join(EXPORT_DIR, 'supabase-themes-latest.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Transformed data not found. Please run step 2 first.');
      console.error(`   Expected file: ${dataPath}`);
      process.exit(1);
    }
    
    const transformedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const { offerings, offering_events } = transformedData;
    
    console.log(`📖 Loaded ${offerings.length} offerings to import\n`);
    
    const results = {
      successful: [],
      failed: [],
      total: offerings.length,
    };

    // Import in batches
    for (let i = 0; i < offerings.length; i++) {
      const offering = offerings[i];
      const offeringEvent = offering_events[i];

      console.log(`\n[${i + 1}/${offerings.length}] Importing: ${offering.title}`);

      const result = await importOfferingEvent(offering, offeringEvent);

      if (result.success) {
        results.successful.push({
          title: offering.title,
          offering_id: result.offering_id,
          offering_event_id: result.offering_event_id,
        });
      } else {
        results.failed.push({
          title: offering.title,
          error: result.error,
        });
        console.error(`   ❌ Failed: ${result.error}`);
      }

      // Pause between batches
      if ((i + 1) % BATCH_SIZE === 0) {
        console.log(`\n⏸️  Batch complete. Processed ${i + 1}/${offerings.length}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Save results
    const resultsPath = path.join(LOGS_DIR, `offering-events-import-${TIMESTAMP}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    console.log('\n\n📊 Import Summary:');
    console.log(`   Total: ${results.total}`);
    console.log(`   Successful: ${results.successful.length}`);
    console.log(`   Failed: ${results.failed.length}`);
    console.log(`\n   Results saved to: ${resultsPath}`);

    if (results.failed.length > 0) {
      console.log('\n❌ Failed imports:');
      results.failed.forEach(fail => {
        console.log(`   - ${fail.title}: ${fail.error}`);
      });
    }

    return results;
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Supabase Offering Events Import\n');
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Logs directory: ${LOGS_DIR}\n`);

  try {
    const results = await importOfferingEvents();

    if (results.failed.length === 0) {
      console.log('\n✅ All offering events imported successfully!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Import completed with errors. Check the logs for details.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

main();

