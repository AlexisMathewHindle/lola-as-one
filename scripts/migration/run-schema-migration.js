import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

async function runMigration() {
  console.log('🔧 Running schema migration: decouple-customers-from-auth.sql\n');

  // Use local database by default
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

  console.log(`📡 Connecting to database...\n`);

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'decouple-customers-from-auth.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executing migration SQL...\n');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('');

    // Execute the entire SQL file
    await client.query(sql);

    console.log('\n✅ Schema migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. npm run export-bookings');
    console.log('2. npm run transform-bookings');
    console.log('3. npm run import-bookings\n');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

