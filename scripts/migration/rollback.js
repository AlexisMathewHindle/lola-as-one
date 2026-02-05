/**
 * Rollback Script - Delete Migrated Events from Supabase
 * 
 * This script safely removes all migrated events from Supabase.
 * Use this if you need to start the migration over.
 * 
 * WARNING: This will delete data! Make sure you have backups.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOGS_DIR = process.env.LOGS_DIR || './logs';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Prompt user for confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Count events to be deleted
 */
async function countEvents() {
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

  return { offeringsCount, eventsCount };
}

/**
 * Delete all migrated events
 */
async function rollbackMigration() {
  console.log('🔄 Rollback Migration - Delete All Events\n');
  console.log('⚠️  WARNING: This will delete all events from Supabase!');
  console.log('⚠️  This action cannot be undone!\n');

  try {
    // Count events
    const counts = await countEvents();
    console.log(`📊 Current counts:`);
    console.log(`   Offerings (type=event): ${counts.offeringsCount}`);
    console.log(`   Offering Events: ${counts.eventsCount}\n`);

    if (counts.offeringsCount === 0 && counts.eventsCount === 0) {
      console.log('ℹ️  No events found. Nothing to rollback.');
      return;
    }

    // Ask for confirmation
    const confirmed = await askConfirmation(
      `Are you sure you want to delete ${counts.offeringsCount} events? (yes/no): `
    );

    if (!confirmed) {
      console.log('\n❌ Rollback cancelled.');
      return;
    }

    console.log('\n🗑️  Deleting events...\n');

    // Delete offerings (cascade will delete offering_events and event_capacity)
    const { error: deleteError } = await supabase
      .from('offerings')
      .delete()
      .eq('type', 'event');

    if (deleteError) {
      throw new Error(`Failed to delete offerings: ${deleteError.message}`);
    }

    console.log('✅ Deleted all event offerings');
    console.log('✅ Cascade deleted all offering_events');
    console.log('✅ Cascade deleted all event_capacity records');

    // Verify deletion
    const newCounts = await countEvents();
    console.log(`\n📊 New counts:`);
    console.log(`   Offerings (type=event): ${newCounts.offeringsCount}`);
    console.log(`   Offering Events: ${newCounts.eventsCount}`);

    // Save rollback log
    const rollbackLog = {
      timestamp: new Date().toISOString(),
      deletedOfferings: counts.offeringsCount,
      deletedEvents: counts.eventsCount,
      remainingOfferings: newCounts.offeringsCount,
      remainingEvents: newCounts.eventsCount,
    };

    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    const logPath = path.join(LOGS_DIR, `rollback-${TIMESTAMP}.json`);
    fs.writeFileSync(logPath, JSON.stringify(rollbackLog, null, 2));

    console.log(`\n📝 Rollback log saved to: ${logPath}`);
    console.log('\n✅ Rollback complete!\n');

  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    await rollbackMigration();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    process.exit(1);
  }
})();

