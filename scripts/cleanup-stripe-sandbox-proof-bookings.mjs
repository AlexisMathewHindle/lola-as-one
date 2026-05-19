#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const evidencePath = resolve(root, 'docs/stripe-sandbox-proof-cleanup-evidence.md')
const confirmed = process.env.CONFIRM_STRIPE_SANDBOX_CLEANUP === '1'
const includeAllTestSessions = process.env.STRIPE_SANDBOX_CLEANUP_ALL_TEST_SESSIONS === '1'
const explicitSessionIds = (process.env.STRIPE_SANDBOX_CLEANUP_SESSION_IDS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const cancelReason = process.env.STRIPE_SANDBOX_CLEANUP_REASON ||
  'Automated cleanup of Stripe sandbox proof booking before production launch'

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

function passed(label, detail) {
  return { label, status: 'passed', detail, failure: '' }
}

function failed(label, detail, failure) {
  return { label, status: 'failed', detail, failure }
}

function skipped(label, detail) {
  return { label, status: 'skipped', detail, failure: '' }
}

function resultRows(results) {
  return results.map((result) => [
    result.status,
    result.label,
    result.detail,
    result.failure
  ])
}

async function checked(label, callback) {
  const { data, error } = await callback()
  if (error) throw new Error(`${label}: ${error.message}`)
  return data || []
}

async function fetchCandidateOrders() {
  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      customer_email,
      status,
      total_gbp,
      stripe_checkout_session_id,
      created_at,
      order_items (
        id,
        item_type,
        title,
        quantity,
        event_date,
        event_start_time
      ),
      bookings (
        id,
        offering_event_id,
        number_of_attendees,
        status,
        cancelled_at,
        cancel_reason,
        booking_attendees (
          id
        )
      )
    `)
    .like('stripe_checkout_session_id', 'cs_test_%')
    .order('created_at', { ascending: true })

  if (explicitSessionIds.length > 0) {
    query = query.in('stripe_checkout_session_id', explicitSessionIds)
  }

  const orders = await checked('candidate orders lookup', () => query)
  return orders.filter((order) => {
    const hasEventItem = (order.order_items || []).some((item) => item.item_type === 'event')
    const hasBooking = (order.bookings || []).length > 0
    if (!hasEventItem || !hasBooking) return false
    if (includeAllTestSessions || explicitSessionIds.length > 0) return true

    const proofEmail = /(^stripe-proof\+|codex|proof)/i.test(order.customer_email || '')
    const recentCodexOrder = /^ORD-202605(14|19)-0008/.test(order.order_number || '')
    return proofEmail || recentCodexOrder
  })
}

async function fetchCapacityState(eventIds) {
  if (!eventIds.length) return []

  const capacities = await checked('event capacity lookup', () =>
    supabase
      .from('event_capacity')
      .select('offering_event_id,total_capacity,spaces_booked,spaces_available')
      .in('offering_event_id', eventIds)
  )
  const events = await checked('offering events lookup', () =>
    supabase
      .from('offering_events')
      .select(`
        id,
        current_bookings,
        max_capacity,
        event_date,
        event_start_time,
        offering:offerings (
          title,
          slug
        )
      `)
      .in('id', eventIds)
  )

  return eventIds.map((eventId) => {
    const capacity = capacities.find((row) => row.offering_event_id === eventId) || {}
    const event = events.find((row) => row.id === eventId) || {}
    return {
      offering_event_id: eventId,
      title: event.offering?.title || '',
      slug: event.offering?.slug || '',
      event_date: event.event_date || '',
      event_start_time: event.event_start_time || '',
      total_capacity: Number(capacity.total_capacity || event.max_capacity || 0),
      spaces_booked: Number(capacity.spaces_booked || 0),
      spaces_available: Number(capacity.spaces_available || 0),
      current_bookings: Number(event.current_bookings || 0),
      max_capacity: Number(event.max_capacity || 0)
    }
  })
}

function summarizeOrders(orders) {
  return orders.map((order) => {
    const bookings = order.bookings || []
    const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed')
    const attendeeRows = bookings.reduce((sum, booking) => sum + (booking.booking_attendees || []).length, 0)
    return {
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      status: order.status,
      total_gbp: Number(order.total_gbp || 0),
      stripe_checkout_session_id: order.stripe_checkout_session_id,
      created_at: order.created_at,
      bookings: bookings.length,
      confirmed_bookings: confirmedBookings.length,
      booked_attendees: confirmedBookings.reduce((sum, booking) => sum + Number(booking.number_of_attendees || 0), 0),
      attendee_rows: attendeeRows,
      event_ids: [...new Set(bookings.map((booking) => booking.offering_event_id).filter(Boolean))]
    }
  })
}

function summarizeCapacity(rows) {
  return rows.map((row) => ({
    offering_event_id: row.offering_event_id,
    title: row.title,
    slug: row.slug,
    event_date: row.event_date,
    event_start_time: row.event_start_time,
    spaces_booked: row.spaces_booked,
    spaces_available: row.spaces_available,
    current_bookings: row.current_bookings,
    drift: row.spaces_booked !== row.current_bookings
  }))
}

function countConfirmedBookings(orders) {
  return orders.reduce((sum, order) => {
    return sum + (order.bookings || []).filter((booking) => booking.status === 'confirmed').length
  }, 0)
}

function countConfirmedAttendees(orders) {
  return orders.reduce((sum, order) => {
    return sum + (order.bookings || [])
      .filter((booking) => booking.status === 'confirmed')
      .reduce((bookingSum, booking) => bookingSum + Number(booking.number_of_attendees || 0), 0)
  }, 0)
}

async function cleanupOrders(orders) {
  const now = new Date().toISOString()
  const confirmedBookingIds = orders
    .flatMap((order) => order.bookings || [])
    .filter((booking) => booking.status === 'confirmed')
    .map((booking) => booking.id)
  const paidOrderIds = orders
    .filter((order) => ['paid', 'pending'].includes(order.status))
    .map((order) => order.id)

  if (confirmedBookingIds.length > 0) {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        cancel_reason: cancelReason
      })
      .in('id', confirmedBookingIds)

    if (error) throw new Error(`cancel bookings: ${error.message}`)
  }

  if (paidOrderIds.length > 0) {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: now
      })
      .in('id', paidOrderIds)

    if (error) throw new Error(`cancel orders: ${error.message}`)
  }

  return {
    cancelledBookings: confirmedBookingIds.length,
    cancelledOrders: paidOrderIds.length
  }
}

async function writeEvidence({
  beforeOrders,
  afterOrders,
  beforeCapacity,
  afterCapacity,
  cleanupResult,
  results
}) {
  const failures = results.filter((result) => result.status === 'failed')
  const skippedResults = results.filter((result) => result.status === 'skipped')
  const status = failures.length > 0 ? 'blocked' : skippedResults.length > 0 ? 'dry-run ready' : 'green'
  const beforeSummary = summarizeOrders(beforeOrders)
  const afterSummary = summarizeOrders(afterOrders)
  const beforeCapacitySummary = summarizeCapacity(beforeCapacity)
  const afterCapacitySummary = summarizeCapacity(afterCapacity)

  const markdown = `# Stripe Sandbox Proof Cleanup Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Audit source: production Supabase sandbox/test Checkout Session orders and event capacity rows

## Run Summary

| Check | Result |
|-------|--------|
| Overall status | ${status} |
| Mode | ${confirmed ? 'confirmed cleanup' : 'dry run'} |
| Candidate sandbox orders | ${beforeOrders.length} |
| Confirmed bookings before cleanup | ${countConfirmedBookings(beforeOrders)} |
| Confirmed attendee spaces before cleanup | ${countConfirmedAttendees(beforeOrders)} |
| Orders cancelled by this run | ${cleanupResult.cancelledOrders} |
| Bookings cancelled by this run | ${cleanupResult.cancelledBookings} |
| Failed checks | ${failures.length} |

## Checks

${formatTable(['Result', 'Check', 'Detail', 'Failure'], resultRows(results))}

## Candidate Orders Before Cleanup

${formatTable(
    ['Order', 'Status', 'Customer', 'Total', 'Checkout Session', 'Created', 'Bookings', 'Confirmed bookings', 'Confirmed spaces', 'Attendee rows'],
    beforeSummary.map((order) => [
      order.order_number,
      order.status,
      order.customer_email,
      order.total_gbp,
      order.stripe_checkout_session_id,
      order.created_at,
      order.bookings,
      order.confirmed_bookings,
      order.booked_attendees,
      order.attendee_rows
    ])
  )}

## Candidate Orders After Cleanup

${formatTable(
    ['Order', 'Status', 'Customer', 'Checkout Session', 'Bookings', 'Confirmed bookings', 'Confirmed spaces', 'Attendee rows'],
    afterSummary.map((order) => [
      order.order_number,
      order.status,
      order.customer_email,
      order.stripe_checkout_session_id,
      order.bookings,
      order.confirmed_bookings,
      order.booked_attendees,
      order.attendee_rows
    ])
  )}

## Capacity Before Cleanup

${formatTable(
    ['Event', 'Slug', 'Date', 'Spaces booked', 'Spaces available', 'Current bookings', 'Drift'],
    beforeCapacitySummary.map((row) => [
      row.title,
      row.slug,
      row.event_date,
      row.spaces_booked,
      row.spaces_available,
      row.current_bookings,
      row.drift ? 'yes' : 'no'
    ])
  )}

## Capacity After Cleanup

${formatTable(
    ['Event', 'Slug', 'Date', 'Spaces booked', 'Spaces available', 'Current bookings', 'Drift'],
    afterCapacitySummary.map((row) => [
      row.title,
      row.slug,
      row.event_date,
      row.spaces_booked,
      row.spaces_available,
      row.current_bookings,
      row.drift ? 'yes' : 'no'
    ])
  )}

## Notes

- Cleanup preserves order, order item, booking, attendee, Stripe event, and email log evidence.
- Confirmed proof bookings are marked \`cancelled\`, with a cancellation reason, so the booking cancellation trigger restores capacity.
- Orders touched by the cleanup are marked \`cancelled\` to keep admin order lists from treating sandbox payments as active launch revenue.
- Live Stripe cutover still requires a separate \`cs_live_...\` proof and live-mode replay/idempotency proof.
`

  writeFileSync(evidencePath, markdown)
  return { status, failures }
}

const beforeOrders = await fetchCandidateOrders()
const eventIds = [...new Set(beforeOrders.flatMap((order) =>
  (order.bookings || []).map((booking) => booking.offering_event_id).filter(Boolean)
))]
const beforeCapacity = await fetchCapacityState(eventIds)

console.log('Stripe sandbox proof cleanup target:')
console.log(`- Candidate sandbox orders: ${beforeOrders.length}`)
console.log(`- Confirmed bookings: ${countConfirmedBookings(beforeOrders)}`)
console.log(`- Confirmed attendee spaces: ${countConfirmedAttendees(beforeOrders)}`)
console.log(`- Event capacity rows: ${beforeCapacity.length}`)

if (!confirmed) {
  for (const order of summarizeOrders(beforeOrders)) {
    console.log(`- ${order.order_number}: ${order.status}; ${order.customer_email}; ${order.confirmed_bookings} confirmed booking(s); ${order.booked_attendees} space(s)`)
  }
}

let cleanupResult = {
  cancelledBookings: 0,
  cancelledOrders: 0
}

if (confirmed) {
  cleanupResult = await cleanupOrders(beforeOrders)
}

const afterOrders = await fetchCandidateOrders()
const afterEventIds = [...new Set([
  ...eventIds,
  ...afterOrders.flatMap((order) =>
    (order.bookings || []).map((booking) => booking.offering_event_id).filter(Boolean)
  )
])]
const afterCapacity = await fetchCapacityState(afterEventIds)

const beforeConfirmedBookings = countConfirmedBookings(beforeOrders)
const afterConfirmedBookings = countConfirmedBookings(afterOrders)
const beforeConfirmedAttendees = countConfirmedAttendees(beforeOrders)
const afterConfirmedAttendees = countConfirmedAttendees(afterOrders)
const beforeDrift = beforeCapacity.filter((row) => row.spaces_booked !== row.current_bookings)
const afterDrift = afterCapacity.filter((row) => row.spaces_booked !== row.current_bookings)

const results = [
  beforeOrders.length > 0
    ? passed('Sandbox proof orders identified', `${beforeOrders.length} order(s) with cs_test checkout sessions.`)
    : skipped('Sandbox proof orders identified', 'No candidate sandbox proof orders found.'),
  confirmed
    ? passed('Cleanup execution confirmed', 'CONFIRM_STRIPE_SANDBOX_CLEANUP=1 was set.')
    : skipped('Cleanup execution confirmed', 'Dry run only; set CONFIRM_STRIPE_SANDBOX_CLEANUP=1 to cancel proof bookings.'),
  !confirmed || cleanupResult.cancelledBookings === beforeConfirmedBookings
    ? passed('Confirmed proof bookings cancelled', `${cleanupResult.cancelledBookings} booking(s) cancelled.`)
    : failed('Confirmed proof bookings cancelled', `${cleanupResult.cancelledBookings}/${beforeConfirmedBookings}`, 'Not all confirmed proof bookings were cancelled.'),
  !confirmed || cleanupResult.cancelledOrders > 0 || beforeOrders.every((order) => order.status === 'cancelled')
    ? passed('Proof orders marked inactive', `${cleanupResult.cancelledOrders} order(s) marked cancelled.`)
    : failed('Proof orders marked inactive', '0 orders updated', 'Expected paid/pending proof orders to be cancelled.'),
  confirmed
    ? (afterConfirmedBookings === 0
      ? passed('No active proof bookings remain', '0 confirmed candidate proof bookings remain.')
      : failed('No active proof bookings remain', `${afterConfirmedBookings} confirmed booking(s)`, 'Candidate proof bookings still consume capacity.'))
    : skipped('No active proof bookings remain', 'Dry run only.'),
  confirmed
    ? (afterConfirmedAttendees === 0
      ? passed('Proof attendee spaces restored', `${beforeConfirmedAttendees} proof space(s) removed from active capacity.`)
      : failed('Proof attendee spaces restored', `${afterConfirmedAttendees} active proof space(s) remain`, 'Proof bookings still count toward capacity.'))
    : skipped('Proof attendee spaces restored', 'Dry run only.'),
  afterDrift.length === 0
    ? passed('Capacity consistency after cleanup', `${afterCapacity.length} event capacity row(s) consistent.`)
    : failed('Capacity consistency after cleanup', afterDrift.map((row) => row.offering_event_id).join(', '), 'event_capacity.spaces_booked does not match offering_events.current_bookings.'),
  beforeDrift.length === 0
    ? passed('Capacity consistency before cleanup', `${beforeCapacity.length} event capacity row(s) started consistent.`)
    : failed('Capacity consistency before cleanup', beforeDrift.map((row) => row.offering_event_id).join(', '), 'Pre-cleanup capacity drift found.')
]

const { failures, status } = await writeEvidence({
  beforeOrders,
  afterOrders,
  beforeCapacity,
  afterCapacity,
  cleanupResult,
  results
})

console.log(`Stripe sandbox proof cleanup audit complete: ${failures.length} failed; status ${status}`)

if (failures.length > 0) {
  console.log(formatTable(
    ['Check', 'Detail', 'Failure'],
    failures.map((result) => [result.label, result.detail, result.failure || 'Check failed'])
  ))
  process.exit(1)
}

if (!confirmed) {
  console.log('Dry run only. Run with CONFIRM_STRIPE_SANDBOX_CLEANUP=1 to cancel proof bookings and restore launch capacity.')
}
