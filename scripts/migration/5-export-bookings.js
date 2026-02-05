import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const EXPORT_DIR = process.env.EXPORT_DIR || path.join(__dirname, 'exports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

function initializeFirebase() {
  // make the path absolute
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'firebase-service-account.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Firebase service account file not found: ${serviceAccountPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  return admin.firestore();
}

function convertTimestamp(timestamp) {
  if (!timestamp) return null;
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
}

async function exportBookings() {
  console.log('📤 Exporting bookings and customers from Firebase...\n');

  try {
    const db = initializeFirebase();
    const collectionName = process.env.FIREBASE_BOOKINGS_COLLECTION || 'bookings';

    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log('⚠️  No bookings found in Firebase.');
      return { bookings: [], customers: [] };
    }

    const bookings = [];
    const customersMap = new Map(); // email -> customer data

    snapshot.forEach(doc => {
      const data = doc.data();
      bookings.push({
        firebaseId: doc.id,
        ...data,
        timestamp: convertTimestamp(data.timestamp),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });

      // Extract customer data from parent field
      if (data.parent && data.parent.email) {
        const email = data.parent.email.toLowerCase().trim();

        // Only add if we haven't seen this email before, or update with more complete data
        if (!customersMap.has(email) ||
            (data.parent.firstName && data.parent.lastName)) {
          customersMap.set(email, {
            email: email,
            first_name: data.parent.firstName || null,
            last_name: data.parent.lastName || null,
            phone: data.parent.telephone || null,
            marketing_opt_in: data.agreements?.newsletter || false,
            created_at: convertTimestamp(data.timestamp) || new Date().toISOString(),
          });
        }
      }
    });

    // Convert customers map to array
    const customers = Array.from(customersMap.values());

    // Save bookings
    const bookingsOutputPath = path.join(EXPORT_DIR, `firebase-bookings-${TIMESTAMP}.json`);
    fs.writeFileSync(bookingsOutputPath, JSON.stringify(bookings, null, 2));

    const bookingsLatestPath = path.join(EXPORT_DIR, 'firebase-bookings-latest.json');
    if (fs.existsSync(bookingsLatestPath)) {
      fs.unlinkSync(bookingsLatestPath);
    }
    fs.symlinkSync(path.basename(bookingsOutputPath), bookingsLatestPath);

    // Save customers
    const customersOutputPath = path.join(EXPORT_DIR, `firebase-customers-${TIMESTAMP}.json`);
    fs.writeFileSync(customersOutputPath, JSON.stringify(customers, null, 2));

    const customersLatestPath = path.join(EXPORT_DIR, 'firebase-customers-latest.json');
    if (fs.existsSync(customersLatestPath)) {
      fs.unlinkSync(customersLatestPath);
    }
    fs.symlinkSync(path.basename(customersOutputPath), customersLatestPath);

    console.log(`✅ Exported ${bookings.length} bookings to ${bookingsOutputPath}`);
    console.log(`✅ Exported ${customers.length} unique customers to ${customersOutputPath}\n`);

    // Summary
    const statusCounts = {};
    const eventCounts = {};
    let totalAttendees = 0;

    bookings.forEach(booking => {
      const status = booking.status || 'confirmed';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (booking.attendees && Array.isArray(booking.attendees)) {
        totalAttendees += booking.attendees.length;

        booking.attendees.forEach(attendee => {
          if (attendee.workshop && Array.isArray(attendee.workshop)) {
            attendee.workshop.forEach(workshop => {
              const eventId = workshop.event_id;
              eventCounts[eventId] = (eventCounts[eventId] || 0) + 1;
            });
          }
        });
      }
    });

    console.log('📊 Export Summary:');
    console.log(`   Total Bookings: ${bookings.length}`);
    console.log(`   Unique Customers: ${customers.length}`);
    console.log(`   Total Attendees: ${totalAttendees}`);
    console.log(`   Unique Events Booked: ${Object.keys(eventCounts).length}`);
    console.log(`   Bookings by Status:`, statusCounts);

    const summaryPath = path.join(EXPORT_DIR, `bookings-export-summary-${TIMESTAMP}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify({
      totalBookings: bookings.length,
      uniqueCustomers: customers.length,
      totalAttendees,
      uniqueEvents: Object.keys(eventCounts).length,
      statusCounts,
      eventCounts,
      exportedAt: new Date().toISOString(),
    }, null, 2));

    console.log(`\n   Summary saved to: ${summaryPath}\n`);

    return { bookings, customers };
  } catch (error) {
    console.error('❌ Error exporting bookings:', error);
    throw error;
  }
}

(async () => {
  try {
    await exportBookings();
    console.log('✅ Export complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
})();

