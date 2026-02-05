/**
 * Step 4: Validate Migration
 * 
 * This script validates that the migration was successful by:
 * 1. Comparing counts between Firebase and Supabase
 * 2. Checking data integrity
 * 3. Verifying relationships
 * 4. Generating a validation report
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
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Count records in Supabase
 */
async function countSupabaseRecords() {
  console.log('📊 Counting Supabase records...\n');
  
  const { count: offeringsCount, error: offeringsError } = await supabase
    .from('offerings')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'event');
  
  if (offeringsError) {
    throw new Error(`Failed to count offerings: ${offeringsError.message}`);
  }
  
  const { count: eventsCount, error: eventsError } = await supabase
    .from('offering_events')
    .select('*', { count: 'exact', head: true });
  
  if (eventsError) {
    throw new Error(`Failed to count offering_events: ${eventsError.message}`);
  }
  
  console.log(`   Offerings (type=event): ${offeringsCount}`);
  console.log(`   Offering Events: ${eventsCount}`);
  
  return { offeringsCount, eventsCount };
}

/**
 * Verify data integrity
 */
async function verifyDataIntegrity() {
  console.log('\n🔍 Verifying data integrity...\n');
  
  const issues = [];
  
  // Check 1: All offering_events have a valid offering_id
  const { data: orphanedEvents, error: orphanedError } = await supabase
    .from('offering_events')
    .select('id, offering_id')
    .is('offering_id', null);
  
  if (orphanedError) {
    issues.push(`Failed to check orphaned events: ${orphanedError.message}`);
  } else if (orphanedEvents && orphanedEvents.length > 0) {
    issues.push(`Found ${orphanedEvents.length} offering_events without a valid offering_id`);
  } else {
    console.log('   ✅ All offering_events have valid offering_id');
  }
  
  // Check 2: All offerings of type 'event' have a corresponding offering_event
  const { data: offerings, error: offeringsError } = await supabase
    .from('offerings')
    .select('id, title')
    .eq('type', 'event');
  
  if (offeringsError) {
    issues.push(`Failed to fetch offerings: ${offeringsError.message}`);
  } else {
    const offeringIds = offerings.map(o => o.id);
    
    const { data: events, error: eventsError } = await supabase
      .from('offering_events')
      .select('offering_id')
      .in('offering_id', offeringIds);
    
    if (eventsError) {
      issues.push(`Failed to fetch offering_events: ${eventsError.message}`);
    } else {
      const eventOfferingIds = new Set(events.map(e => e.offering_id));
      const missingEvents = offerings.filter(o => !eventOfferingIds.has(o.id));
      
      if (missingEvents.length > 0) {
        issues.push(`Found ${missingEvents.length} offerings without offering_events`);
        missingEvents.forEach(o => {
          console.log(`   ⚠️  Missing offering_event for: ${o.title} (${o.id})`);
        });
      } else {
        console.log('   ✅ All event offerings have corresponding offering_events');
      }
    }
  }
  
  // Check 3: Required fields are not null
  const { data: invalidEvents, error: invalidError } = await supabase
    .from('offering_events')
    .select('id, offering_id, event_date, event_start_time, max_capacity, price_gbp')
    .or('event_date.is.null,event_start_time.is.null,max_capacity.is.null,price_gbp.is.null');
  
  if (invalidError) {
    issues.push(`Failed to check required fields: ${invalidError.message}`);
  } else if (invalidEvents && invalidEvents.length > 0) {
    issues.push(`Found ${invalidEvents.length} offering_events with missing required fields`);
  } else {
    console.log('   ✅ All offering_events have required fields');
  }
  
  return issues;
}

/**
 * Sample data comparison
 */
async function sampleDataComparison() {
  console.log('\n🔬 Sampling data for comparison...\n');
  
  // Get a few random events from Supabase
  const { data: sampleEvents, error } = await supabase
    .from('offering_events')
    .select(`
      *,
      offering:offerings(*)
    `)
    .limit(5);
  
  if (error) {
    console.error('   ❌ Failed to fetch sample events:', error.message);
    return [];
  }
  
  console.log(`   Fetched ${sampleEvents.length} sample events:`);
  sampleEvents.forEach((event, i) => {
    console.log(`\n   ${i + 1}. ${event.offering.title}`);
    console.log(`      Date: ${event.event_date}`);
    console.log(`      Time: ${event.event_start_time}`);
    console.log(`      Capacity: ${event.max_capacity}`);
    console.log(`      Price: £${event.price_gbp}`);
    console.log(`      Status: ${event.offering.status}`);
  });
  
  return sampleEvents;
}

/**
 * Generate validation report
 */
async function generateValidationReport() {
  console.log('📋 Generating validation report...\n');
  
  try {
    // Read Firebase export
    const firebaseEventsPath = path.join(EXPORT_DIR, 'firebase-events-latest.json');
    const firebaseEvents = fs.existsSync(firebaseEventsPath)
      ? JSON.parse(fs.readFileSync(firebaseEventsPath, 'utf8'))
      : [];
    
    // Count Supabase records
    const supabaseCounts = await countSupabaseRecords();
    
    // Verify data integrity
    const integrityIssues = await verifyDataIntegrity();
    
    // Sample data
    const sampleData = await sampleDataComparison();
    
    const report = {
      timestamp: new Date().toISOString(),
      firebaseEventCount: firebaseEvents.length,
      supabaseOfferingsCount: supabaseCounts.offeringsCount,
      supabaseEventsCount: supabaseCounts.eventsCount,
      countsMatch: firebaseEvents.length === supabaseCounts.offeringsCount,
      integrityIssues: integrityIssues,
      integrityPassed: integrityIssues.length === 0,
      sampleData: sampleData.map(e => ({
        title: e.offering.title,
        date: e.event_date,
        time: e.event_start_time,
        capacity: e.max_capacity,
        price: e.price_gbp,
        status: e.offering.status,
      })),
    };
    
    // Save report
    const reportPath = path.join(LOGS_DIR, `validation-report-${TIMESTAMP}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Validation Report');
    console.log('='.repeat(60));
    console.log(`   Firebase Events: ${report.firebaseEventCount}`);
    console.log(`   Supabase Offerings: ${report.supabaseOfferingsCount}`);
    console.log(`   Supabase Events: ${report.supabaseEventsCount}`);
    console.log(`   Counts Match: ${report.countsMatch ? '✅' : '❌'}`);
    console.log(`   Data Integrity: ${report.integrityPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!report.integrityPassed) {
      console.log('\n   Issues Found:');
      report.integrityIssues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }
    
    console.log(`\n   Full report saved to: ${reportPath}`);
    console.log('='.repeat(60) + '\n');
    
    return report;
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    const report = await generateValidationReport();
    
    if (report.countsMatch && report.integrityPassed) {
      console.log('✅ Migration validation PASSED!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Migration validation completed with issues. Please review the report.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
})();

