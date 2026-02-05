/**
 * Step 4: Update Pricing for Existing Offering Events
 * 
 * This script updates the price_gbp field for existing offering_events in Supabase
 * based on the transformed data with pricing from Firebase events.
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
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10');
const BATCH_DELAY_MS = parseInt(process.env.BATCH_DELAY_MS || '1000');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Update pricing for offering events
 */
async function updatePricing() {
  console.log('🚀 Supabase Offering Events Pricing Update\n');
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Batch delay: ${BATCH_DELAY_MS}ms\n`);
  
  try {
    // Read transformed data
    const transformedPath = path.join(EXPORT_DIR, 'supabase-themes-latest.json');
    
    if (!fs.existsSync(transformedPath)) {
      console.error('❌ Transformed data not found. Please run steps 1 and 2 first.');
      console.error(`   Expected file: ${transformedPath}`);
      process.exit(1);
    }
    
    const transformedData = JSON.parse(fs.readFileSync(transformedPath, 'utf8'));
    const offeringEvents = transformedData.offering_events;
    
    console.log(`📖 Loaded ${offeringEvents.length} offering events to update\n`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process in batches
    for (let i = 0; i < offeringEvents.length; i++) {
      const event = offeringEvents[i];
      const firebaseId = event._firebase_id;
      const priceGbp = event.price_gbp;
      
      console.log(`[${i + 1}/${offeringEvents.length}] Updating pricing for Firebase ID: ${firebaseId} (£${priceGbp})`);
      
      try {
        // Find the offering_event by matching the offering's metadata
        const { data: offerings, error: offeringError } = await supabase
          .from('offerings')
          .select('id')
          .eq('metadata->>firebase_id', firebaseId)
          .single();
        
        if (offeringError || !offerings) {
          console.log(`   ⚠️  Offering not found for Firebase ID: ${firebaseId}`);
          failureCount++;
          continue;
        }
        
        // Update the offering_event price
        const { error: updateError } = await supabase
          .from('offering_events')
          .update({ price_gbp: priceGbp })
          .eq('offering_id', offerings.id);
        
        if (updateError) {
          console.log(`   ❌ Failed to update: ${updateError.message}`);
          failureCount++;
        } else {
          console.log(`   ✅ Updated to £${priceGbp}`);
          successCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failureCount++;
      }
      
      // Batch delay
      if ((i + 1) % BATCH_SIZE === 0 && i + 1 < offeringEvents.length) {
        console.log(`\n⏸️  Batch complete. Processed ${i + 1}/${offeringEvents.length}\n`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`   Total: ${offeringEvents.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failureCount}`);
    
    if (failureCount === 0) {
      console.log('\n✅ All offering events pricing updated successfully!');
    } else {
      console.log(`\n⚠️  ${failureCount} offering events failed to update.`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updatePricing();

