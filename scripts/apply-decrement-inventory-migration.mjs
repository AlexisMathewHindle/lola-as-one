import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('📦 Applying decrement_inventory migration...\n')

  // Read the migration file
  const migrationSQL = fs.readFileSync(
    'supabase/migrations/20260209_add_decrement_inventory_function.sql',
    'utf8'
  )

  console.log('SQL to execute:')
  console.log('='.repeat(60))
  console.log(migrationSQL)
  console.log('='.repeat(60))
  console.log('')

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      // Try direct execution if exec_sql doesn't exist
      console.log('⚠️  exec_sql RPC not available, trying direct execution...\n')
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.length === 0) continue
        
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        
        const { error: execError } = await supabase.rpc('exec', {
          query: statement
        })

        if (execError) {
          console.error('❌ Error:', execError)
          throw execError
        }
      }
    }

    console.log('✅ Migration applied successfully!')
    console.log('\n📝 The decrement_inventory function is now available.')
    console.log('   It will be called automatically when orders are placed.')
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    console.error('\n💡 Please apply this migration manually:')
    console.error('   1. Go to Supabase Dashboard > SQL Editor')
    console.error('   2. Paste the SQL from: supabase/migrations/20260209_add_decrement_inventory_function.sql')
    console.error('   3. Click "Run"')
    process.exit(1)
  }
}

applyMigration()

