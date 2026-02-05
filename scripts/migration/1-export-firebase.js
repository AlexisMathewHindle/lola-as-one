/**
 * Step 1: Export Firebase Events to JSON
 * 
 * This script exports all events from Firebase Firestore to a JSON file.
 * It preserves the original structure for transformation in the next step.
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const FIREBASE_SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
const EVENTS_COLLECTION = process.env.FIREBASE_EVENTS_COLLECTION || 'events';
const CATEGORIES_COLLECTION = process.env.FIREBASE_CATEGORIES_COLLECTION || 'categories';
const EXPORT_DIR = process.env.EXPORT_DIR || './exports';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
} catch (error) {
  console.error('❌ Error reading Firebase service account file:', error.message);
  console.error('Please download your Firebase service account JSON from:');
  console.error('Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

/**
 * Export events from Firebase
 */
async function exportEvents() {
  console.log('📤 Exporting events from Firebase...\n');
  
  try {
    const eventsSnapshot = await db.collection(EVENTS_COLLECTION).get();
    const events = [];
    
    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      events.push({
        firebaseId: doc.id,
        ...data,
        // Convert Firebase Timestamps to ISO strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
        eventDate: data.eventDate?.toDate?.()?.toISOString() || data.eventDate || null,
      });
    });
    
    const outputPath = path.join(EXPORT_DIR, `firebase-events-${TIMESTAMP}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(events, null, 2));
    
    console.log(`✅ Exported ${events.length} events to ${outputPath}`);
    
    // Create a symlink to latest export
    const latestPath = path.join(EXPORT_DIR, 'firebase-events-latest.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(path.basename(outputPath), latestPath);
    
    return events;
  } catch (error) {
    console.error('❌ Error exporting events:', error);
    throw error;
  }
}

/**
 * Export categories from Firebase (optional)
 */
async function exportCategories() {
  console.log('\n📤 Exporting categories from Firebase...\n');
  
  try {
    const categoriesSnapshot = await db.collection(CATEGORIES_COLLECTION).get();
    
    if (categoriesSnapshot.empty) {
      console.log('ℹ️  No categories collection found. Skipping...');
      return [];
    }
    
    const categories = [];
    
    categoriesSnapshot.forEach(doc => {
      const data = doc.data();
      categories.push({
        firebaseId: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      });
    });
    
    const outputPath = path.join(EXPORT_DIR, `firebase-categories-${TIMESTAMP}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(categories, null, 2));
    
    console.log(`✅ Exported ${categories.length} categories to ${outputPath}`);
    
    // Create a symlink to latest export
    const latestPath = path.join(EXPORT_DIR, 'firebase-categories-latest.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(path.basename(outputPath), latestPath);
    
    return categories;
  } catch (error) {
    console.error('⚠️  Error exporting categories:', error.message);
    return [];
  }
}

/**
 * Generate export summary
 */
function generateSummary(events, categories) {
  const summary = {
    exportDate: new Date().toISOString(),
    totalEvents: events.length,
    totalCategories: categories.length,
    eventsByStatus: {},
    sampleEvent: events[0] || null,
    sampleCategory: categories[0] || null,
  };
  
  // Count events by status
  events.forEach(event => {
    const status = event.status || event.published ? 'published' : 'draft';
    summary.eventsByStatus[status] = (summary.eventsByStatus[status] || 0) + 1;
  });
  
  const summaryPath = path.join(EXPORT_DIR, `export-summary-${TIMESTAMP}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n📊 Export Summary:');
  console.log(`   Total Events: ${summary.totalEvents}`);
  console.log(`   Total Categories: ${summary.totalCategories}`);
  console.log(`   Events by Status:`, summary.eventsByStatus);
  console.log(`\n   Summary saved to: ${summaryPath}`);
}

// Main execution
(async () => {
  try {
    const events = await exportEvents();
    const categories = await exportCategories();
    generateSummary(events, categories);
    
    console.log('\n✅ Export complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
})();

