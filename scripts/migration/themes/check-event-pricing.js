import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Firebase Admin
let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '..', 'firebase-service-account.json');

if (serviceAccountPath && !path.isAbsolute(serviceAccountPath)) {
  serviceAccountPath = path.join(__dirname, '..', serviceAccountPath);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function matchThemesToEvents() {
  // Get all themes
  const themesSnapshot = await db.collection('themes').get();
  const themes = themesSnapshot.docs.map(doc => doc.data());
  
  // Get all events
  const eventsSnapshot = await db.collection('events').get();
  const events = {};
  eventsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    events[data.event_id] = data;
  });
  
  console.log('Total themes:', themes.length);
  console.log('Total events:', Object.keys(events).length);
  
  // Check how many themes have matching events
  let matched = 0;
  let unmatched = 0;
  const unmatchedIds = [];
  
  themes.forEach(theme => {
    if (events[theme.event_id]) {
      matched++;
    } else {
      unmatched++;
      if (unmatchedIds.length < 5) {
        unmatchedIds.push(theme.event_id);
      }
    }
  });
  
  console.log('\nMatched themes:', matched);
  console.log('Unmatched themes:', unmatched);
  if (unmatchedIds.length > 0) {
    console.log('Sample unmatched event_ids:', unmatchedIds);
  }
  
  // Show a sample match
  const sampleTheme = themes.find(t => events[t.event_id]);
  if (sampleTheme) {
    console.log('\nSample match:');
    console.log('Theme event_id:', sampleTheme.event_id);
    console.log('Event price:', events[sampleTheme.event_id].price);
  }
  
  process.exit(0);
}

matchThemesToEvents().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

