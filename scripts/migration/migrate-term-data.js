#!/usr/bin/env node

/**
 * Migration Script: Populate Term Columns from Metadata
 * 
 * This script:
 * 1. Fetches all offerings with metadata.term
 * 2. Parses the legacy term format (e.g., "autumn_first_half_term")
 * 3. Extracts season, half, and infers year from event dates
 * 4. Populates term_season, term_half, term_year columns
 * 5. Validates against event_id patterns
 * 
 * Usage: node scripts/migration/migrate-term-data.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch, { Headers } from 'node-fetch';

// Polyfill for Node.js 18 and below
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
// Also try lola-workshops .env.local as fallback
dotenv.config({ path: path.join(__dirname, '../../lola-workshops/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL ||
                     process.env.NEXT_PUBLIC_SUPABASE_URL ||
                     process.env.VUE_APP_SUPABASE_URL;

const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ||
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                    process.env.VUE_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Checked: VITE_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, VUE_APP_SUPABASE_URL');
  console.error('   Checked: VITE_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, VUE_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse legacy term string to extract season and half
 * @param {string} termString - e.g., "autumn_first_half_term"
 * @returns {Object} { season, half }
 */
function parseLegacyTerm(termString) {
  if (!termString) return { season: null, half: null };
  
  // Pattern: {season}_{half}_half_term
  const match = termString.match(/^(\w+)_(first|second)_half_term$/);
  if (match) {
    return {
      season: match[1],
      half: match[2]
    };
  }
  
  // Pattern: {season}_term (full term)
  const fullTermMatch = termString.match(/^(\w+)_term$/);
  if (fullTermMatch) {
    return {
      season: fullTermMatch[1],
      half: 'full'
    };
  }
  
  console.warn(`⚠️  Unknown term format: ${termString}`);
  return { season: null, half: null };
}

/**
 * Infer year from event date
 * @param {string} eventDate - ISO date string
 * @returns {number|null} Year
 */
function inferYearFromDate(eventDate) {
  if (!eventDate) return null;
  const date = new Date(eventDate);
  return date.getFullYear();
}

/**
 * Validate event_id matches expected pattern for season/half
 * @param {string} eventId - e.g., "aw01_lo_tues"
 * @param {string} season - e.g., "autumn"
 * @param {string} half - e.g., "first"
 * @returns {boolean}
 */
function validateEventId(eventId, season, half) {
  if (!eventId || !season || !half) return true; // Skip validation if missing data
  
  const expectedPrefixes = {
    autumn: { first: 'aw01_', second: 'aw02_' },
    spring: { first: 'sp01_', second: 'sp02_' },
    summer: { first: 'su01_', second: 'su02_' }
  };
  
  const expectedPrefix = expectedPrefixes[season]?.[half];
  if (!expectedPrefix) return true; // Unknown pattern, skip validation
  
  return eventId.startsWith(expectedPrefix);
}

/**
 * Main migration function
 */
async function migrateTermData() {
  console.log('🚀 Starting term data migration...\n');
  
  try {
    // Step 1: Fetch all offerings with metadata.term
    console.log('📥 Fetching offerings with term data...');
    const { data: offerings, error: fetchError } = await supabase
      .from('offerings')
      .select('id, metadata, offering_events(event_date)')
      .eq('type', 'event')
      .not('metadata->term', 'is', null);
    
    if (fetchError) {
      throw new Error(`Failed to fetch offerings: ${fetchError.message}`);
    }
    
    console.log(`   Found ${offerings.length} offerings with term data\n`);
    
    // Step 2: Process each offering
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const warnings = [];
    
    for (const offering of offerings) {
      const termString = offering.metadata?.term;
      const eventId = offering.metadata?.event_id;
      const eventDate = offering.offering_events?.[0]?.event_date;
      
      // Parse term string
      const { season, half } = parseLegacyTerm(termString);
      
      if (!season || !half) {
        console.log(`   ⏭️  Skipping ${offering.id}: Could not parse term "${termString}"`);
        skipCount++;
        continue;
      }
      
      // Infer year from event date
      const year = inferYearFromDate(eventDate);
      
      // Validate event_id
      const isValid = validateEventId(eventId, season, half);
      if (!isValid) {
        warnings.push({
          id: offering.id,
          message: `Event ID "${eventId}" doesn't match expected pattern for ${season} ${half} half`
        });
      }
      
      // Update offering
      const { error: updateError } = await supabase
        .from('offerings')
        .update({
          term_season: season,
          term_half: half,
          term_year: year
        })
        .eq('id', offering.id);

      if (updateError) {
        console.error(`   ❌ Error updating ${offering.id}: ${updateError.message}`);
        errorCount++;
        continue;
      }

      successCount++;

      // Log progress every 10 records
      if (successCount % 10 === 0) {
        console.log(`   ✅ Processed ${successCount} offerings...`);
      }
    }

    // Step 3: Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${warnings.length}):`);
      warnings.forEach(w => {
        console.log(`   - ${w.id}: ${w.message}`);
      });
    }

    // Step 4: Verification
    console.log('\n🔍 Verifying migration...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('offerings')
      .select('term_season, term_half, term_year')
      .not('term_season', 'is', null);

    if (verifyError) {
      console.error(`❌ Verification failed: ${verifyError.message}`);
    } else {
      console.log(`   ✅ Found ${verifyData.length} offerings with populated term columns`);

      // Group by season and half
      const grouped = verifyData.reduce((acc, item) => {
        const key = `${item.term_season}_${item.term_half}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      console.log('\n   Distribution by term:');
      Object.entries(grouped).forEach(([key, count]) => {
        console.log(`   - ${key}: ${count}`);
      });
    }

    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateTermData();

