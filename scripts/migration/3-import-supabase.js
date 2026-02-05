/**
 * Step 3: Import Transformed Data to Supabase
 * 
 * This script imports the transformed data into Supabase:
 * 1. Creates offerings (content shell)
 * 2. Creates offering_events (event-specific details)
 * 3. Optionally creates event_capacity records
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EXPORT_DIR = process.env.EXPORT_DIR || './exports';
const LOGS_DIR = process.env.LOGS_DIR || './logs';
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase configuration. Please set:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Import a single event (offering + offering_event)
 */
async function importEvent(offering, offeringEvent, index, total) {
  try {
    console.log(`\n[${index + 1}/${total}] Importing: ${offering.title}`);
    
    if (DRY_RUN) {
      console.log('   🔍 DRY RUN - Would create offering:', {
        title: offering.title,
        slug: offering.slug,
        status: offering.status,
      });
      console.log('   🔍 DRY RUN - Would create offering_event:', {
        event_date: offeringEvent.event_date,
        event_start_time: offeringEvent.event_start_time,
        max_capacity: offeringEvent.max_capacity,
        price_gbp: offeringEvent.price_gbp,
      });
      return { success: true, dryRun: true };
    }
    
    // Step 1: Create offering
    const { data: createdOffering, error: offeringError } = await supabase
      .from('offerings')
      .insert({
        type: offering.type,
        title: offering.title,
        slug: offering.slug,
        description_short: offering.description_short,
        description_long: offering.description_long,
        featured_image_url: offering.featured_image_url,
        status: offering.status,
        scheduled_publish_at: offering.scheduled_publish_at,
        published_at: offering.published_at,
        featured: offering.featured,
        metadata: offering.metadata,
        meta_title: offering.meta_title,
        meta_description: offering.meta_description,
      })
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
    
    // Step 3: Create event_capacity record (optional)
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
      offeringId: createdOffering.id,
      eventId: createdEvent.id,
      firebaseId: offering._firebase_id,
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      firebaseId: offering._firebase_id,
      title: offering.title,
    };
  }
}

/**
 * Import all events in batches
 */
async function importAllEvents() {
  console.log('📥 Importing data to Supabase...\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No data will be written to Supabase\n');
  }
  
  try {
    // Read transformed data
    const dataPath = path.join(EXPORT_DIR, 'supabase-data-latest.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Transformed data not found. Please run step 2 first.');
      console.error(`   Expected file: ${dataPath}`);
      process.exit(1);
    }
    
    const transformedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const { offerings, offering_events } = transformedData;
    
    console.log(`📖 Loaded ${offerings.length} events to import\n`);
    
    const results = {
      successful: [],
      failed: [],
      total: offerings.length,
    };
    
    // Import events
    for (let i = 0; i < offerings.length; i++) {
      const result = await importEvent(offerings[i], offering_events[i], i, offerings.length);
      
      if (result.success) {
        results.successful.push(result);
      } else {
        results.failed.push(result);
      }
      
      // Small delay to avoid rate limiting
      if (!DRY_RUN && i < offerings.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Save results
    const resultsPath = path.join(LOGS_DIR, `import-results-${TIMESTAMP}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary:');
    console.log('='.repeat(60));
    console.log(`   Total Events: ${results.total}`);
    console.log(`   ✅ Successful: ${results.successful.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n   Failed Events:');
      results.failed.forEach(fail => {
        console.log(`   - ${fail.title}: ${fail.error}`);
      });
    }
    
    console.log(`\n   Results saved to: ${resultsPath}`);
    console.log('='.repeat(60) + '\n');
    
    return results;
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    await importAllEvents();
    console.log('✅ Import complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
})();

