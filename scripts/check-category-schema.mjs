#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch, { Headers, Request, Response } from 'node-fetch'

// Polyfill for Node.js 18 and below
if (!globalThis.fetch) {
  globalThis.fetch = fetch
  globalThis.Headers = Headers
  globalThis.Request = Request
  globalThis.Response = Response
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../app/.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking event_categories table schema...\n')

  try {
    // Fetch one category to see the structure
    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      console.log('✅ Table exists. Columns found:')
      console.log(Object.keys(data[0]).join(', '))
      console.log('\n📋 Sample record:')
      console.log(JSON.stringify(data[0], null, 2))
      
      // Check if featured_image_url exists
      if ('featured_image_url' in data[0]) {
        console.log('\n✅ featured_image_url column EXISTS')
      } else {
        console.log('\n❌ featured_image_url column DOES NOT EXIST')
      }
    } else {
      console.log('⚠️  Table exists but has no records')
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

checkSchema()

