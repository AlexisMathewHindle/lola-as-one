/**
 * Step 2: Transform Firebase Themes to Supabase Schema
 * 
 * This script transforms Firebase theme data to match the Supabase schema:
 * - offerings (content shell)
 * - offering_events (event-specific details)
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const EXPORT_DIR = process.env.EXPORT_DIR || path.join(__dirname, '..', 'exports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title, date, existingSlugs = new Set()) {
  let baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Add date to make it unique
  const dateStr = date.replace(/-/g, '');
  let slug = `${baseSlug}-${dateStr}`;
  
  // Handle duplicate slugs
  let uniqueSlug = slug;
  let counter = 1;
  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  existingSlugs.add(uniqueSlug);
  return uniqueSlug;
}

/**
 * Parse time string to SQL TIME format (HH:MM:SS)
 */
function parseTime(timeStr) {
  if (!timeStr) return null;
  
  // Already in HH:MM:SS format
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  
  // HH:MM format
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return `${timeStr}:00`;
  }
  
  return null;
}

/**
 * Transform a single Firebase theme to Supabase format
 */
function transformTheme(firebaseTheme, eventsLookup, existingSlugs) {
  // Look up event for pricing
  const event = eventsLookup[firebaseTheme.event_id];
  const price = event?.price ? parseFloat(event.price) : 0;

  // Create offering (content shell)
  const offering = {
    type: 'event',
    title: firebaseTheme.event_title || firebaseTheme.theme_title || 'Untitled Event',
    slug: generateSlug(
      firebaseTheme.event_title || firebaseTheme.theme_title || 'untitled',
      firebaseTheme.date,
      existingSlugs
    ),
    description_short: firebaseTheme.theme_title || null,
    description_long: null,
    featured_image_url: null,
    status: firebaseTheme.passed ? 'archived' : 'published',
    metadata: {
      theme_id: firebaseTheme.theme_id || null,
      event_id: firebaseTheme.event_id || null,
      term: firebaseTheme.term || null,
      firebase_id: firebaseTheme.firebaseId || firebaseTheme.id,
    },
  };

  // Create offering_event (event-specific details)
  const offeringEvent = {
    event_date: firebaseTheme.date,
    event_start_time: parseTime(firebaseTheme.start_time) || '10:00:00',
    event_end_time: parseTime(firebaseTheme.end_time),
    location_name: 'Lola As One Studio',
    location_address: null,
    location_city: null,
    location_postcode: null,
    max_capacity: parseInt(firebaseTheme.originalStock || firebaseTheme.stock || 10),
    current_bookings: parseInt((firebaseTheme.originalStock || 0) - (firebaseTheme.stock || 0)),
    price_gbp: price.toFixed(2),
    vat_rate: '20.00',
    _firebase_id: firebaseTheme.firebaseId || firebaseTheme.id,
  };

  return { offering, offeringEvent };
}

/**
 * Transform all Firebase themes
 */
function transformThemes() {
  console.log('🔄 Transforming Firebase themes to Supabase schema...\n');
  
  try {
    // Read Firebase export
    const themesPath = path.join(EXPORT_DIR, 'firebase-themes-latest.json');

    if (!fs.existsSync(themesPath)) {
      console.error('❌ Firebase themes export not found. Please run step 1 first.');
      console.error(`   Expected file: ${themesPath}`);
      process.exit(1);
    }

    const exportData = JSON.parse(fs.readFileSync(themesPath, 'utf8'));
    const firebaseThemes = exportData.themes || exportData; // Support both old and new format
    const eventsLookup = exportData.events || {};

    console.log(`📖 Loaded ${firebaseThemes.length} themes from Firebase export`);
    console.log(`📖 Loaded ${Object.keys(eventsLookup).length} events for pricing lookup\n`);

    const existingSlugs = new Set();
    const transformedData = {
      offerings: [],
      offering_events: [],
      errors: [],
    };

    // Transform each theme
    firebaseThemes.forEach((theme, index) => {
      try {
        const { offering, offeringEvent } = transformTheme(theme, eventsLookup, existingSlugs);
        transformedData.offerings.push(offering);
        transformedData.offering_events.push(offeringEvent);
      } catch (error) {
        console.error(`❌ Error transforming theme ${index + 1}:`, error.message);
        transformedData.errors.push({
          theme_id: theme.theme_id || theme.id,
          title: theme.event_title || theme.theme_title,
          error: error.message,
        });
      }
    });

    // Save transformed data
    const outputPath = path.join(EXPORT_DIR, `supabase-themes-${TIMESTAMP}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));

    // Create symlink to latest
    const latestPath = path.join(EXPORT_DIR, 'supabase-themes-latest.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(path.basename(outputPath), latestPath);

    console.log(`\n✅ Transformed ${transformedData.offerings.length} themes`);
    console.log(`   Saved to: ${outputPath}`);

    if (transformedData.errors.length > 0) {
      console.log(`\n⚠️  ${transformedData.errors.length} themes had errors:`);
      transformedData.errors.forEach(err => {
        console.log(`   - ${err.title}: ${err.error}`);
      });
    }

    // Print summary
    console.log('\n📊 Transformation Summary:');
    console.log(`   Offerings created: ${transformedData.offerings.length}`);
    console.log(`   Offering events created: ${transformedData.offering_events.length}`);
    console.log(`   Errors: ${transformedData.errors.length}`);

  } catch (error) {
    console.error('❌ Transformation failed:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Firebase Themes Transformation\n');

  try {
    transformThemes();
    console.log('\n✅ Transformation complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Transformation failed:', error.message);
    process.exit(1);
  }
}

main();

