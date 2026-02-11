import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load from root .env.local first (has service role key)
dotenv.config({ path: '.env.local' })
// Then load from app/.env.local (has VITE_ vars)
dotenv.config({ path: 'app/.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLS() {
  console.log('🔍 Checking RLS policies on inventory_items table...\n')
  
  // Query the pg_policies view
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        policyname,
        permissive,
        roles,
        cmd,
        qual
      FROM pg_policies 
      WHERE tablename = 'inventory_items'
      ORDER BY policyname;
    `
  })
  
  if (error) {
    console.error('❌ Error querying policies:', error)
    console.log('\nTrying alternative method...\n')
    
    // Alternative: Just check if RLS is enabled
    const { data: tableInfo, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tablename,
          rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename = 'inventory_items';
      `
    })
    
    if (tableError) {
      console.error('❌ Error:', tableError)
    } else {
      console.log('Table info:', tableInfo)
    }
    return
  }
  
  console.log('RLS Policies:', data)
}

checkRLS()

