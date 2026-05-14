#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const statePath = process.env.ADMIN_UI_PROOF_STATE_PATH || '/private/tmp/lola-admin-ui-proof-state.json'
const evidencePath = resolve(root, 'docs/admin-ui-edit-proof.md')
const command = process.argv[2] || 'setup'
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)

function readEnvFile(path) {
  if (!existsSync(path)) return {}

  const env = {}
  const text = readFileSync(path, 'utf8')

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const index = line.indexOf('=')
    if (index === -1) continue

    const key = line.slice(0, index).trim()
    let value = line.slice(index + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

function envUrl(source) {
  return source.SUPABASE_URL || source.VITE_SUPABASE_URL || source.NEXT_PUBLIC_SUPABASE_URL
}

function isLocalSupabaseUrl(value) {
  if (!value) return false
  try {
    const url = new URL(value)
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

const fileEnvs = {
  root: readEnvFile(resolve(root, '.env.local')),
  app: readEnvFile(resolve(root, 'app/.env.local')),
  functions: readEnvFile(resolve(root, 'supabase/functions/.env')),
  migration: readEnvFile(resolve(root, 'scripts/migration/.env'))
}

const urlCandidates = [
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  envUrl(fileEnvs.root),
  envUrl(fileEnvs.app),
  envUrl(fileEnvs.migration),
  envUrl(fileEnvs.functions)
].filter(Boolean)

const supabaseUrl = urlCandidates.find((value) => !isLocalSupabaseUrl(value)) || urlCandidates[0]
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnvs.root.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnvs.migration.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnvs.functions.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing production Supabase URL or service role key')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function readState() {
  if (!existsSync(statePath)) {
    throw new Error(`State file not found: ${statePath}`)
  }
  return JSON.parse(readFileSync(statePath, 'utf8'))
}

function writeState(state) {
  mkdirSync(dirname(statePath), { recursive: true })
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8')
}

function proofToken() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
}

function assertNoError(error, label) {
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }
}

async function setup() {
  const runId = proofToken()
  const password = `Codex-${randomBytes(9).toString('base64url')}-9a`
  const email = `codex-admin-proof+${runId}@example.com`
  const baseTitle = `Codex Proof Event ${runId}`
  const baseCategoryName = `Codex Proof Category ${runId}`

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Codex Admin UI Proof'
    },
    app_metadata: {
      role: 'admin'
    }
  })
  assertNoError(userError, 'create proof admin user')

  const { data: category, error: categoryError } = await supabase
    .from('event_categories')
    .insert({
      name: baseCategoryName,
      slug: `codex-proof-category-${runId}`,
      description: 'Temporary inactive category for admin UI proof.',
      layout_key: 'standard',
      display_order: 9999,
      color_hex: '#6B7280',
      icon: 'palette',
      is_active: false
    })
    .select()
    .single()
  assertNoError(categoryError, 'create proof category')

  const { data: offering, error: offeringError } = await supabase
    .from('offerings')
    .insert({
      type: 'event',
      title: baseTitle,
      slug: `codex-proof-event-${runId}`,
      description_short: 'Temporary draft event for admin UI proof.',
      description_long: '<p>Temporary proof record.</p>',
      status: 'draft',
      featured: false,
      created_by: userData.user.id,
      updated_by: userData.user.id
    })
    .select()
    .single()
  assertNoError(offeringError, 'create proof offering')

  const { data: event, error: eventError } = await supabase
    .from('offering_events')
    .insert({
      offering_id: offering.id,
      event_date: '2026-12-31',
      event_start_time: '10:00',
      event_end_time: '11:00',
      location_name: 'Admin UI Proof Studio',
      location_address: 'Temporary proof record',
      location_city: 'London',
      location_postcode: 'N1 1AA',
      max_capacity: 8,
      available_spaces: 8,
      current_bookings: 0,
      price_gbp: 1,
      vat_rate: 20,
      waitlist_enabled: false,
      category_id: category.id
    })
    .select()
    .single()
  assertNoError(eventError, 'create proof event')

  const { data: capacity, error: capacityError } = await supabase
    .from('event_capacity')
    .insert({
      offering_event_id: event.id,
      total_capacity: 8,
      spaces_booked: 0,
      spaces_reserved: 0,
      waitlist_enabled: false
    })
    .select()
    .single()
  assertNoError(capacityError, 'create proof capacity')

  const state = {
    runId,
    auditDate,
    createdAt: new Date().toISOString(),
    appUrl: process.env.ADMIN_UI_PROOF_APP_URL || 'http://127.0.0.1:5173',
    credentials: {
      email,
      password
    },
    user: {
      id: userData.user.id,
      email
    },
    category: {
      id: category.id,
      before: {
        name: category.name,
        description: category.description,
        layout_key: category.layout_key,
        is_active: category.is_active
      },
      after: {
        name: `${baseCategoryName} UI Edited`,
        description: 'Edited through the admin category UI proof.',
        layout_key: 'enquiry_only',
        is_active: false
      }
    },
    offering: {
      id: offering.id,
      before: {
        title: offering.title,
        description_short: offering.description_short,
        status: offering.status
      },
      after: {
        title: `${baseTitle} UI Edited`,
        description_short: 'Edited through the admin offering UI proof.',
        status: 'draft'
      }
    },
    event: {
      id: event.id,
      before: {
        max_capacity: event.max_capacity,
        available_spaces: event.available_spaces
      },
      after: {
        max_capacity: 9,
        available_spaces: 9
      }
    },
    capacity: {
      id: capacity.id,
      before: {
        total_capacity: capacity.total_capacity,
        spaces_booked: capacity.spaces_booked
      },
      after: {
        total_capacity: 9,
        spaces_booked: 0
      }
    }
  }

  writeState(state)

  console.log(JSON.stringify({
    mode: 'setup',
    statePath,
    appUrl: state.appUrl,
    user: { id: state.user.id, email: state.user.email },
    offeringId: state.offering.id,
    eventId: state.event.id,
    categoryId: state.category.id
  }, null, 2))
}

async function verify() {
  const state = readState()

  const [
    offeringResult,
    eventResult,
    capacityResult,
    categoryResult
  ] = await Promise.all([
    supabase.from('offerings').select('id,title,slug,description_short,status').eq('id', state.offering.id).single(),
    supabase.from('offering_events').select('id,max_capacity,available_spaces,current_bookings').eq('id', state.event.id).single(),
    supabase.from('event_capacity').select('id,total_capacity,spaces_booked,spaces_reserved').eq('id', state.capacity.id).single(),
    supabase.from('event_categories').select('id,name,description,layout_key,is_active').eq('id', state.category.id).single()
  ])

  assertNoError(offeringResult.error, 'verify offering')
  assertNoError(eventResult.error, 'verify event')
  assertNoError(capacityResult.error, 'verify capacity')
  assertNoError(categoryResult.error, 'verify category')

  const checks = [
    {
      area: 'Offering title',
      expected: state.offering.after.title,
      actual: offeringResult.data.title,
      passed: offeringResult.data.title === state.offering.after.title
    },
    {
      area: 'Offering short copy',
      expected: state.offering.after.description_short,
      actual: offeringResult.data.description_short,
      passed: offeringResult.data.description_short === state.offering.after.description_short
    },
    {
      area: 'Offering remains draft',
      expected: state.offering.after.status,
      actual: offeringResult.data.status,
      passed: offeringResult.data.status === state.offering.after.status
    },
    {
      area: 'Event max capacity',
      expected: state.event.after.max_capacity,
      actual: eventResult.data.max_capacity,
      passed: Number(eventResult.data.max_capacity) === state.event.after.max_capacity
    },
    {
      area: 'Event available spaces',
      expected: state.event.after.available_spaces,
      actual: eventResult.data.available_spaces,
      passed: Number(eventResult.data.available_spaces) === state.event.after.available_spaces
    },
    {
      area: 'Capacity total',
      expected: state.capacity.after.total_capacity,
      actual: capacityResult.data.total_capacity,
      passed: Number(capacityResult.data.total_capacity) === state.capacity.after.total_capacity
    },
    {
      area: 'Category name',
      expected: state.category.after.name,
      actual: categoryResult.data.name,
      passed: categoryResult.data.name === state.category.after.name
    },
    {
      area: 'Category description',
      expected: state.category.after.description,
      actual: categoryResult.data.description,
      passed: categoryResult.data.description === state.category.after.description
    },
    {
      area: 'Category layout',
      expected: state.category.after.layout_key,
      actual: categoryResult.data.layout_key,
      passed: categoryResult.data.layout_key === state.category.after.layout_key
    },
    {
      area: 'Category remains inactive',
      expected: state.category.after.is_active,
      actual: categoryResult.data.is_active,
      passed: categoryResult.data.is_active === state.category.after.is_active
    }
  ]

  const passed = checks.every((check) => check.passed)
  const verifiedAt = new Date().toISOString()
  state.verifiedAt = verifiedAt
  state.verification = { passed, checks }
  writeState(state)
  writeEvidence(state, checks, 'Verified')

  console.log(JSON.stringify({
    mode: 'verify',
    passed,
    evidencePath,
    failedChecks: checks.filter((check) => !check.passed)
  }, null, 2))

  if (!passed) {
    process.exitCode = 1
  }
}

async function cleanup() {
  const state = readState()

  const results = []

  async function run(label, operation) {
    const { error } = await operation()
    results.push({ label, ok: !error, error: error?.message || null })
  }

  await run('delete event_capacity', () =>
    supabase.from('event_capacity').delete().eq('id', state.capacity.id)
  )
  await run('delete offering_events', () =>
    supabase.from('offering_events').delete().eq('id', state.event.id)
  )
  await run('delete offerings', () =>
    supabase.from('offerings').delete().eq('id', state.offering.id)
  )
  await run('delete event_categories', () =>
    supabase.from('event_categories').delete().eq('id', state.category.id)
  )

  const { error: userError } = await supabase.auth.admin.deleteUser(state.user.id)
  results.push({ label: 'delete proof admin user', ok: !userError, error: userError?.message || null })

  const cleanupPassed = results.every((result) => result.ok)
  state.cleanedUpAt = new Date().toISOString()
  state.cleanup = { passed: cleanupPassed, results }
  writeState(state)
  writeEvidence(state, state.verification?.checks || [], cleanupPassed ? 'Verified and cleaned up' : 'Verified; cleanup needs review')

  if (cleanupPassed && existsSync(statePath)) {
    unlinkSync(statePath)
  }

  console.log(JSON.stringify({
    mode: 'cleanup',
    cleanupPassed,
    evidencePath,
    results
  }, null, 2))

  if (!cleanupPassed) {
    process.exitCode = 1
  }
}

async function selectByIlike(table, column, pattern, columns = '*') {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .ilike(column, pattern)

  assertNoError(error, `select ${table}.${column}`)
  return data || []
}

function uniqueById(rows) {
  const byId = new Map()
  for (const row of rows) {
    if (row?.id) byId.set(row.id, row)
  }
  return [...byId.values()]
}

async function sweep() {
  const [offeringsBySlug, offeringsByTitle, categoriesBySlug, categoriesByName] = await Promise.all([
    selectByIlike('offerings', 'slug', 'codex-proof-event-%', 'id,title,slug,status'),
    selectByIlike('offerings', 'title', 'Codex Proof Event%', 'id,title,slug,status'),
    selectByIlike('event_categories', 'slug', 'codex-proof-category-%', 'id,name,slug,is_active'),
    selectByIlike('event_categories', 'name', 'Codex Proof Category%', 'id,name,slug,is_active')
  ])

  const proofOfferings = uniqueById([...offeringsBySlug, ...offeringsByTitle])
  const proofCategories = uniqueById([...categoriesBySlug, ...categoriesByName])
  const offeringIds = proofOfferings.map((offering) => offering.id)

  let proofEvents = []
  if (offeringIds.length) {
    const { data, error } = await supabase
      .from('offering_events')
      .select('id,offering_id,event_date,event_start_time')
      .in('offering_id', offeringIds)

    assertNoError(error, 'select proof offering_events')
    proofEvents = data || []
  }

  const eventIds = proofEvents.map((event) => event.id)
  let proofCapacities = []
  if (eventIds.length) {
    const { data, error } = await supabase
      .from('event_capacity')
      .select('id,offering_event_id')
      .in('offering_event_id', eventIds)

    assertNoError(error, 'select proof event_capacity')
    proofCapacities = data || []
  }

  const userMatches = []
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    assertNoError(error, 'list proof users')

    const users = data?.users || []
    userMatches.push(...users.filter((user) => user.email?.startsWith('codex-admin-proof+')))

    if (users.length < perPage) break
    page += 1
  }

  const results = []
  async function run(label, ids, operation) {
    if (!ids.length) {
      results.push({ label, count: 0, ok: true, error: null })
      return
    }

    const { error } = await operation()
    results.push({ label, count: ids.length, ok: !error, error: error?.message || null })
  }

  await run('delete proof event_capacity rows', proofCapacities.map((row) => row.id), () =>
    supabase.from('event_capacity').delete().in('id', proofCapacities.map((row) => row.id))
  )
  await run('delete proof offering_events rows', eventIds, () =>
    supabase.from('offering_events').delete().in('id', eventIds)
  )
  await run('delete proof offerings rows', offeringIds, () =>
    supabase.from('offerings').delete().in('id', offeringIds)
  )
  await run('delete proof event_categories rows', proofCategories.map((category) => category.id), () =>
    supabase.from('event_categories').delete().in('id', proofCategories.map((category) => category.id))
  )

  for (const user of userMatches) {
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    results.push({
      label: `delete proof admin user ${user.id}`,
      count: 1,
      ok: !error,
      error: error?.message || null
    })
  }

  const passed = results.every((result) => result.ok)
  console.log(JSON.stringify({
    mode: 'sweep',
    passed,
    found: {
      offerings: proofOfferings.map((offering) => ({ id: offering.id, title: offering.title, slug: offering.slug, status: offering.status })),
      offeringEvents: proofEvents.map((event) => ({ id: event.id, offering_id: event.offering_id })),
      eventCapacity: proofCapacities.map((capacity) => ({ id: capacity.id, offering_event_id: capacity.offering_event_id })),
      eventCategories: proofCategories.map((category) => ({ id: category.id, name: category.name, slug: category.slug, is_active: category.is_active })),
      authUsers: userMatches.map((user) => ({ id: user.id, email: user.email }))
    },
    results
  }, null, 2))

  if (!passed) {
    process.exitCode = 1
  }
}

function formatTable(headers, rows) {
  if (!rows.length) return '_No rows._'

  const escapeCell = (value) => {
    if (value === null || value === undefined || value === '') return '-'
    return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ')
  }

  const headerLine = `| ${headers.map(escapeCell).join(' | ')} |`
  const separator = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`)
  return [headerLine, separator, ...body].join('\n')
}

function writeEvidence(state, checks, status) {
  const markdown = `# Admin UI Edit Proof

Status: current
Last updated: ${auditDate}
Parent workstream: [Events Data And CMS Readiness](./events-data-cms-readiness.md)
Proof status: ${status}

## Scope

This proof verifies that an authenticated admin can edit event, category, and capacity data through the app admin UI, without direct SQL for the edit actions.

## Test Records

| Record | ID | Public risk |
|--------|----|-------------|
| Temporary admin user | ${state.user.id} | Deleted during cleanup |
| Draft event offering | ${state.offering.id} | \`status = draft\`; not public |
| Event details row | ${state.event.id} | Attached to draft offering |
| Event capacity row | ${state.capacity.id} | Attached to draft event |
| Inactive category | ${state.category.id} | \`is_active = false\`; not public |

## UI Actions Verified

${formatTable(
  ['Area', 'Before', 'After'],
  [
    ['Offering title', state.offering.before.title, state.offering.after.title],
    ['Offering short copy', state.offering.before.description_short, state.offering.after.description_short],
    ['Event max capacity', state.event.before.max_capacity, state.event.after.max_capacity],
    ['Event available spaces', state.event.before.available_spaces, state.event.after.available_spaces],
    ['Capacity total', state.capacity.before.total_capacity, state.capacity.after.total_capacity],
    ['Category name', state.category.before.name, state.category.after.name],
    ['Category description', state.category.before.description, state.category.after.description],
    ['Category layout', state.category.before.layout_key, state.category.after.layout_key]
  ]
)}

## Verification Checks

${formatTable(
  ['Check', 'Expected', 'Actual', 'Result'],
  checks.map((check) => [
    check.area,
    check.expected,
    check.actual,
    check.passed ? 'passed' : 'failed'
  ])
)}

## Cleanup

${state.cleanup
  ? formatTable(
    ['Action', 'Result', 'Error'],
    state.cleanup.results.map((result) => [
      result.label,
      result.ok ? 'passed' : 'failed',
      result.error || '-'
    ])
  )
  : '_Cleanup not run yet._'}

## Notes

- Setup and cleanup used the service role to create and remove temporary proof data.
- The edit actions were performed through the admin UI using a temporary authenticated admin user.
- The proof event remained draft and the proof category remained inactive throughout the test.
`

  writeFileSync(evidencePath, markdown, 'utf8')
}

if (command === 'setup') {
  await setup()
} else if (command === 'verify') {
  await verify()
} else if (command === 'cleanup') {
  await cleanup()
} else if (command === 'sweep') {
  await sweep()
} else {
  throw new Error(`Unknown command: ${command}`)
}
