#!/usr/bin/env node

/**
 * Populate category_id for existing events based on metadata
 * 
 * This script maps the old metadata.category field to the new category_id field
 * in the offering_events table.
 */

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

// Load environment variables from app/.env.local (or .env as fallback)
const envPath = path.join(__dirname, '../app/.env.local')
const envFallback = path.join(__dirname, '../app/.env')
dotenv.config({ path: envPath })
if (!process.env.VITE_SUPABASE_URL) {
  dotenv.config({ path: envFallback })
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in app/.env.local or app/.env')
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)')
  process.exit(1)
}

console.log('🔑 Using key type:', supabaseKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') ? 'Service Role' : 'Anon')

const supabase = createClient(supabaseUrl, supabaseKey)

// Category mapping based on the seeded categories
const CATEGORY_MAPPINGS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Open Studio',
    patterns: ['open studio', 'open-studio', 'openstudio']
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Little Ones',
    patterns: ['little ones', 'little-ones', 'littleones', 'littles ones', 'toddler']
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Kids Workshops',
    patterns: ['kids', 'children', 'child']
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Adult Workshops',
    patterns: ['adult', 'grown-up', 'creative saturdays', 'creative saturday']
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Holiday Programs',
    patterns: ['holiday']
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Private Events',
    patterns: ['private', 'party', 'parties']
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'Special Programs',
    patterns: ['storytime', 'story time', 'club', 'special']
  }
]

/**
 * Determine category ID based on metadata and title
 */
function determineCategoryId(offering) {
  const category = offering.metadata?.category || ''
  const title = offering.title || ''
  const searchText = `${category} ${title}`.toLowerCase()

  for (const mapping of CATEGORY_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      if (searchText.includes(pattern.toLowerCase())) {
        return mapping.id
      }
    }
  }

  return null
}

async function main() {
  console.log('🚀 Starting event category population...\n')

  try {
    // Fetch all events with their offerings
    console.log('📥 Fetching events from database...')
    const { data: events, error: fetchError } = await supabase
      .from('offering_events')
      .select(`
        id,
        category_id,
        offering:offerings(
          id,
          title,
          metadata
        )
      `)

    if (fetchError) throw fetchError

    console.log(`   Found ${events.length} events\n`)

    // Filter events that need categorization
    const eventsToUpdate = events.filter(event => !event.category_id && event.offering)

    console.log(`📊 Events needing categorization: ${eventsToUpdate.length}\n`)

    if (eventsToUpdate.length === 0) {
      console.log('✅ All events already have categories assigned!')
      return
    }

    // Categorize and update events
    const updates = []
    const uncategorized = []

    for (const event of eventsToUpdate) {
      const categoryId = determineCategoryId(event.offering)
      
      if (categoryId) {
        updates.push({
          eventId: event.id,
          categoryId: categoryId,
          title: event.offering.title,
          oldCategory: event.offering.metadata?.category
        })
      } else {
        uncategorized.push({
          eventId: event.id,
          title: event.offering.title,
          oldCategory: event.offering.metadata?.category
        })
      }
    }

    console.log(`✅ Matched ${updates.length} events to categories`)
    console.log(`⚠️  ${uncategorized.length} events could not be auto-categorized\n`)

    // Show what will be updated
    if (updates.length > 0) {
      console.log('📝 Updates to be applied:')
      const categoryCounts = {}
      updates.forEach(u => {
        const mapping = CATEGORY_MAPPINGS.find(m => m.id === u.categoryId)
        const categoryName = mapping?.name || 'Unknown'
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1
      })
      
      Object.entries(categoryCounts).forEach(([name, count]) => {
        console.log(`   ${name}: ${count} events`)
      })
      console.log()
    }

    // Perform updates
    console.log('💾 Updating database...')
    let successCount = 0
    let errorCount = 0

    for (const update of updates) {
      const { error } = await supabase
        .from('offering_events')
        .update({ category_id: update.categoryId })
        .eq('id', update.eventId)

      if (error) {
        console.error(`   ❌ Failed to update "${update.title}": ${error.message}`)
        errorCount++
      } else {
        successCount++
      }
    }

    console.log(`\n✅ Successfully updated ${successCount} events`)
    if (errorCount > 0) {
      console.log(`❌ Failed to update ${errorCount} events`)
    }

    // Show uncategorized events
    if (uncategorized.length > 0) {
      console.log(`\n⚠️  Uncategorized events (${uncategorized.length}):`)
      console.log('   These events need manual categorization:\n')
      uncategorized.slice(0, 10).forEach(event => {
        console.log(`   - "${event.title}"`)
        if (event.oldCategory) {
          console.log(`     Old category: ${event.oldCategory}`)
        }
      })
      if (uncategorized.length > 10) {
        console.log(`   ... and ${uncategorized.length - 10} more`)
      }
      console.log('\n   Please categorize these manually through the admin interface.')
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total events: ${events.length}`)
    console.log(`Already categorized: ${events.length - eventsToUpdate.length}`)
    console.log(`Newly categorized: ${successCount}`)
    console.log(`Still uncategorized: ${uncategorized.length}`)
    console.log(`Errors: ${errorCount}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

main()

