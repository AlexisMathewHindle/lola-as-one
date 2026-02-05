/**
 * Step 1: Export Themes from Firebase Firestore
 * 
 * This script exports all themes from the Firebase 'themes' collection
 * to prepare for migration to Supabase offering_events table.
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const THEMES_COLLECTION = process.env.FIREBASE_THEMES_COLLECTION || 'themes';
const EXPORT_DIR = process.env.EXPORT_DIR || path.join(__dirname, '..', 'exports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Initialize Firebase Admin
let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, '..', 'firebase-service-account.json');

// If the path is relative, resolve it from the parent directory (migration folder)
if (serviceAccountPath && !path.isAbsolute(serviceAccountPath)) {
  serviceAccountPath = path.join(__dirname, '..', serviceAccountPath);
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

/**
 * Export themes from Firebase
 */
async function exportThemes() {
  console.log('📤 Exporting themes from Firebase...\n');

  try {
    const themesSnapshot = await db.collection(THEMES_COLLECTION).get();
    const themes = [];

    themesSnapshot.forEach(doc => {
      const data = doc.data();
      themes.push({
        firebaseId: doc.id,
        ...data,
        // Convert Firebase Timestamps to ISO strings if they exist
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      });
    });

    // Export events for pricing lookup
    console.log('📤 Exporting events for pricing...\n');
    const eventsSnapshot = await db.collection('events').get();
    const events = {};

    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      events[data.event_id] = data;
    });

    const exportData = {
      themes,
      events,
    };

    const outputPath = path.join(EXPORT_DIR, `firebase-themes-${TIMESTAMP}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    console.log(`✅ Exported ${themes.length} themes and ${Object.keys(events).length} events to ${outputPath}`);
    
    // Create a symlink to latest export
    const latestPath = path.join(EXPORT_DIR, 'firebase-themes-latest.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(path.basename(outputPath), latestPath);
    
    // Print summary
    console.log('\n📊 Export Summary:');
    console.log(`   Total themes: ${themes.length}`);
    
    // Group by term
    const byTerm = themes.reduce((acc, theme) => {
      const term = theme.term || 'unknown';
      acc[term] = (acc[term] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n   By term:');
    Object.entries(byTerm).forEach(([term, count]) => {
      console.log(`   - ${term}: ${count}`);
    });
    
    // Group by event_id
    const byEventId = themes.reduce((acc, theme) => {
      const eventId = theme.event_id || 'unknown';
      acc[eventId] = (acc[eventId] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n   Unique event types: ${Object.keys(byEventId).length}`);
    
    return themes;
  } catch (error) {
    console.error('❌ Error exporting themes:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Firebase Themes Export\n');
  console.log(`Collection: ${THEMES_COLLECTION}`);
  console.log(`Export directory: ${EXPORT_DIR}\n`);
  
  try {
    await exportThemes();
    console.log('\n✅ Export complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  }
}

main();

