#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const confirmed = process.env.CONFIRM_ADMIN_BOOKING_ATTENDEE_BACKFILL === '1'
const evidencePath = resolve(root, 'docs/admin-booking-attendee-backfill-evidence.md')

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

function escapeCell(value) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function formatTable(headers, rows) {
  if (!rows.length) return '_No rows._'

  const headerLine = `| ${headers.map(escapeCell).join(' | ')} |`
  const separator = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`)

  return [headerLine, separator, ...body].join('\n')
}

function maskEmail(value) {
  if (!value || !String(value).includes('@')) return '-'
  const [local, domain] = String(value).split('@')
  return `${local.slice(0, 2) || '*'}***@${domain}`
}

function splitName(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Booking', lastName: 'Attendee' }
  if (parts.length === 1) return { firstName: parts[0], lastName: 'Attendee' }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  }
}

function maskName(value) {
  if (!value) return '-'
  const words = String(value).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '-'
  return words.map((word) => `${word.slice(0, 1)}***`).join(' ')
}

async function checked(label, callback) {
  const { data, error } = await callback()
  if (error) throw new Error(`${label}: ${error.message}`)
  return data || []
}

const bookings = await checked('future confirmed bookings lookup', () =>
  supabase
    .from('bookings')
    .select(`
      id,
      order_id,
      order_item_id,
      offering_event_id,
      customer_email,
      customer_name,
      number_of_attendees,
      status,
      created_at,
      order:orders(
        order_number,
        status
      ),
      booking_attendees(
        id
      ),
      offering_event:offering_events(
        id,
        event_date,
        event_start_time,
        offering:offerings(
          title,
          slug
        )
      )
    `)
    .eq('status', 'confirmed')
    .gte('offering_event.event_date', auditDate)
    .order('created_at', { ascending: false })
)

const targets = bookings
  .filter((booking) => booking.offering_event?.event_date >= auditDate)
  .map((booking) => {
    const required = Number(booking.number_of_attendees || 0)
    const existing = (booking.booking_attendees || []).length
    return {
      booking,
      existing,
      required,
      missing: Math.max(required - existing, 0)
    }
  })
  .filter((target) => target.missing > 0)

const rowsToInsert = []
for (const target of targets) {
  const { booking, existing, missing } = target
  const { firstName, lastName } = splitName(booking.customer_name)

  for (let index = 0; index < missing; index += 1) {
    const attendeeNumber = existing + index + 1
    rowsToInsert.push({
      booking_id: booking.id,
      first_name: firstName,
      last_name: attendeeNumber === 1 ? lastName : `${lastName} ${attendeeNumber}`,
      email: booking.customer_email || null,
      phone: null,
      allergies: null,
      notes: `Backfilled from booking customer data on ${auditDate} because attendee rows were missing before events launch.`
    })
  }
}

let insertedRows = []
if (confirmed && rowsToInsert.length > 0) {
  const { data, error } = await supabase
    .from('booking_attendees')
    .insert(rowsToInsert)
    .select('id,booking_id,first_name,last_name')

  if (error) throw new Error(`booking_attendees backfill insert: ${error.message}`)
  insertedRows = data || []
}

const targetRows = targets.map((target) => [
  target.booking.id,
  target.booking.order?.order_number || '-',
  target.booking.offering_event?.offering?.title || '-',
  target.booking.offering_event?.event_date || '-',
  maskEmail(target.booking.customer_email),
  target.existing,
  target.required,
  target.missing
])

const insertedEvidenceRows = insertedRows.map((row) => [
  row.booking_id,
  row.id,
  maskName(`${row.first_name} ${row.last_name}`)
])

const markdown = `# Admin Booking Attendee Backfill Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Admin Booking Operations](./admin-booking-operations-readiness.md)
Script: \`scripts/backfill-admin-booking-attendees.mjs\`
Supabase project: ${new URL(supabaseUrl).host}

## Run Summary

| Check | Result |
| --- | --- |
| Mode | ${confirmed ? 'applied' : 'dry-run'} |
| Future confirmed bookings with missing attendees | ${targets.length} |
| Missing attendee rows identified | ${rowsToInsert.length} |
| Attendee rows inserted | ${insertedRows.length} |

## Target Bookings

${formatTable(
  ['Booking ID', 'Order', 'Event', 'Date', 'Customer email', 'Existing attendees', 'Required attendees', 'Missing attendees'],
  targetRows
)}

## Inserted Attendees

${formatTable(['Booking ID', 'Attendee ID', 'Backfilled name'], insertedEvidenceRows)}

## Notes

- This backfill is idempotent by count. Rerunning it only inserts rows for bookings where \`booking_attendees.length < bookings.number_of_attendees\`.
- Backfilled attendee rows use the booking customer name and customer email because the original attendee rows were missing.
- Allergy data is left empty; staff should confirm any allergies manually if needed for these legacy/imported bookings.
`

writeFileSync(evidencePath, markdown, 'utf8')

console.log(`Admin booking attendee backfill ${confirmed ? 'applied' : 'dry-run'}: ${insertedRows.length}/${rowsToInsert.length} attendee row(s) inserted`)
if (!confirmed && rowsToInsert.length > 0) {
  console.log('Set CONFIRM_ADMIN_BOOKING_ATTENDEE_BACKFILL=1 to apply this backfill.')
}
