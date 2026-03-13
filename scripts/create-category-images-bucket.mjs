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
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createCategoryImagesBucket() {
  console.log('🪣 Creating category-images storage bucket...\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) throw listError

    const bucketExists = buckets.some(b => b.id === 'category-images')

    if (bucketExists) {
      console.log('✅ Bucket "category-images" already exists')
    } else {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('category-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })

      if (error) throw error

      console.log('✅ Created bucket "category-images"')
      console.log('   - Public: Yes')
      console.log('   - Max file size: 5MB')
      console.log('   - Allowed types: JPG, PNG, WEBP, GIF')
    }

    console.log('\n📋 Next steps:')
    console.log('1. Go to Supabase Dashboard → Storage → category-images')
    console.log('2. Click on "Policies" tab')
    console.log('3. Add the following policies:\n')
    
    console.log('Policy 1: Public Read Access')
    console.log('  Name: Public read access for category images')
    console.log('  Operation: SELECT')
    console.log('  Target: public')
    console.log('  USING: bucket_id = \'category-images\'\n')
    
    console.log('Policy 2: Admin Upload')
    console.log('  Name: Admins can upload category images')
    console.log('  Operation: INSERT')
    console.log('  Target: authenticated')
    console.log('  WITH CHECK: bucket_id = \'category-images\' AND (auth.jwt() -> \'app_metadata\' ->> \'role\') = \'admin\'\n')
    
    console.log('Policy 3: Admin Update')
    console.log('  Name: Admins can update category images')
    console.log('  Operation: UPDATE')
    console.log('  Target: authenticated')
    console.log('  USING: bucket_id = \'category-images\' AND (auth.jwt() -> \'app_metadata\' ->> \'role\') = \'admin\'\n')
    
    console.log('Policy 4: Admin Delete')
    console.log('  Name: Admins can delete category images')
    console.log('  Operation: DELETE')
    console.log('  Target: authenticated')
    console.log('  USING: bucket_id = \'category-images\' AND (auth.jwt() -> \'app_metadata\' ->> \'role\') = \'admin\'\n')

  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

createCategoryImagesBucket()

