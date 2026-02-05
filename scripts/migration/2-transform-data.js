/**
 * Step 2: Transform Firebase Data to Supabase Schema
 * 
 * This script transforms Firebase event data to match the Supabase schema:
 * - offerings (content shell)
 * - offering_events (event-specific details)
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const EXPORT_DIR = process.env.EXPORT_DIR || './exports';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title, existingSlugs = new Set()) {
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
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
 * Parse Firebase date to SQL DATE format (YYYY-MM-DD)
 */
function parseDate(dateValue) {
  if (!dateValue) return null;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch (error) {
    console.warn('⚠️  Invalid date:', dateValue);
    return null;
  }
}

/**
 * Parse Firebase time to SQL TIME format (HH:MM:SS)
 */
function parseTime(timeValue) {
  if (!timeValue) return null;
  
  try {
    // Handle various time formats
    if (typeof timeValue === 'string') {
      // If already in HH:MM or HH:MM:SS format
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeValue)) {
        const parts = timeValue.split(':');
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1];
        const seconds = parts[2] || '00';
        return `${hours}:${minutes}:${seconds}`;
      }
      
      // If it's a full ISO timestamp, extract time
      const date = new Date(timeValue);
      if (!isNaN(date.getTime())) {
        return date.toTimeString().split(' ')[0]; // HH:MM:SS
      }
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️  Invalid time:', timeValue);
    return null;
  }
}

/**
 * Combine multiple description fields into one long description
 */
function combineDescriptions(firebaseEvent) {
  const parts = [];

  if (firebaseEvent.description) {
    parts.push(firebaseEvent.description);
  }

  if (firebaseEvent.details) {
    parts.push(firebaseEvent.details);
  }

  if (firebaseEvent.instructions) {
    parts.push(`Instructions: ${firebaseEvent.instructions}`);
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/**
 * Transform a single Firebase event to Supabase format
 */
function transformEvent(firebaseEvent, existingSlugs) {
  // Use event_title field from your Firebase structure
  const title = firebaseEvent.event_title || firebaseEvent.title || 'Untitled Event';
  const slug = generateSlug(title, existingSlugs);

  // Determine status
  let status = 'draft';
  if (firebaseEvent.status) {
    status = firebaseEvent.status;
  } else if (firebaseEvent.published === true || firebaseEvent.publishedAt) {
    status = 'published';
  }

  // Create offering (content shell)
  const offering = {
    type: 'event',
    title: title,
    slug: slug,
    description_short: firebaseEvent.description || firebaseEvent.shortDescription || firebaseEvent.excerpt || null,
    description_long: combineDescriptions(firebaseEvent),
    featured_image_url: firebaseEvent.imageUrl || firebaseEvent.image || firebaseEvent.featuredImage || null,
    status: status,
    scheduled_publish_at: null,
    published_at: firebaseEvent.publishedAt || (status === 'published' ? new Date().toISOString() : null),
    featured: firebaseEvent.featured || false,
    metadata: {
      category: firebaseEvent.category || null,
      term: firebaseEvent.term || null,
      day_of_week: firebaseEvent.day_of_the_week || null,
      age_group: firebaseEvent.ageGroup || firebaseEvent.ageRange || null,
      difficulty: firebaseEvent.difficulty || null,
      tags: firebaseEvent.tags || [],
      event_id: firebaseEvent.event_id || null,
      // Preserve any other custom fields
      ...firebaseEvent.customFields,
    },
    meta_title: firebaseEvent.metaTitle || firebaseEvent.seoTitle || null,
    meta_description: firebaseEvent.metaDescription || firebaseEvent.seoDescription || null,
    // Store original Firebase ID for reference
    _firebase_id: firebaseEvent.firebaseId || firebaseEvent.event_id,
  };

  // Create offering_event (event-specific details)
  // Your Firebase uses start_date, start_time, end_time, quantity
  const offeringEvent = {
    event_date: parseDate(firebaseEvent.start_date || firebaseEvent.eventDate || firebaseEvent.date),
    event_start_time: parseTime(firebaseEvent.start_time || firebaseEvent.startTime || firebaseEvent.eventStartTime || '10:00:00'),
    event_end_time: parseTime(firebaseEvent.end_time || firebaseEvent.endTime || firebaseEvent.eventEndTime),
    location_name: firebaseEvent.locationName || firebaseEvent.venue || firebaseEvent.location || 'Lola As One Studio',
    location_address: firebaseEvent.address || firebaseEvent.locationAddress || null,
    location_city: firebaseEvent.city || firebaseEvent.locationCity || null,
    location_postcode: firebaseEvent.postcode || firebaseEvent.postalCode || firebaseEvent.zip || null,
    max_capacity: parseInt(firebaseEvent.quantity || firebaseEvent.maxCapacity || firebaseEvent.capacity || firebaseEvent.maxAttendees || 10),
    current_bookings: parseInt(firebaseEvent.currentBookings || firebaseEvent.bookedSpaces || 0),
    price_gbp: parseFloat(firebaseEvent.price || firebaseEvent.priceGBP || 0).toFixed(2),
    vat_rate: parseFloat(firebaseEvent.vatRate || 20.00).toFixed(2),
    // Store original Firebase ID for reference
    _firebase_id: firebaseEvent.firebaseId || firebaseEvent.event_id,
  };

  return { offering, offeringEvent };
}

/**
 * Transform all Firebase events
 */
function transformEvents() {
  console.log('🔄 Transforming Firebase data to Supabase schema...\n');
  
  try {
    // Read Firebase export
    const eventsPath = path.join(EXPORT_DIR, 'firebase-events-latest.json');
    
    if (!fs.existsSync(eventsPath)) {
      console.error('❌ Firebase events export not found. Please run step 1 first.');
      console.error(`   Expected file: ${eventsPath}`);
      process.exit(1);
    }
    
    const firebaseEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    console.log(`📖 Loaded ${firebaseEvents.length} events from Firebase export\n`);
    
    const existingSlugs = new Set();
    const transformedData = {
      offerings: [],
      offering_events: [],
      errors: [],
    };
    
    // Transform each event
    firebaseEvents.forEach((fbEvent, index) => {
      try {
        const { offering, offeringEvent } = transformEvent(fbEvent, existingSlugs);
        transformedData.offerings.push(offering);
        transformedData.offering_events.push(offeringEvent);
        
        if ((index + 1) % 10 === 0) {
          console.log(`   Transformed ${index + 1}/${firebaseEvents.length} events...`);
        }
      } catch (error) {
        console.error(`❌ Error transforming event "${fbEvent.title}":`, error.message);
        transformedData.errors.push({
          firebaseId: fbEvent.firebaseId,
          title: fbEvent.title,
          error: error.message,
        });
      }
    });
    
    // Save transformed data
    const outputPath = path.join(EXPORT_DIR, `supabase-data-${TIMESTAMP}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));
    
    // Create symlink to latest
    const latestPath = path.join(EXPORT_DIR, 'supabase-data-latest.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(path.basename(outputPath), latestPath);
    
    console.log(`\n✅ Transformed ${transformedData.offerings.length} events`);
    console.log(`   Saved to: ${outputPath}`);
    
    if (transformedData.errors.length > 0) {
      console.log(`\n⚠️  ${transformedData.errors.length} events had errors:`);
      transformedData.errors.forEach(err => {
        console.log(`   - ${err.title}: ${err.error}`);
      });
    }
    
    return transformedData;
  } catch (error) {
    console.error('❌ Transformation failed:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    transformEvents();
    console.log('\n✅ Transformation complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Transformation failed:', error);
    process.exit(1);
  }
})();

