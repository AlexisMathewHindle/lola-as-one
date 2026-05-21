#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const evidencePath = resolve(root, 'docs/admin-booking-operations-readiness-evidence.md')

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

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function sourceIncludes(source, terms) {
  return terms.every((term) => source.includes(term))
}

function makeResult(status, severity, check, detail, failure = '') {
  return { status, severity, check, detail, failure }
}

function pass(check, detail) {
  return makeResult('passed', '-', check, detail)
}

function fail(severity, check, detail, failure) {
  return makeResult('failed', severity, check, detail, failure)
}

function warn(severity, check, detail, failure) {
  return makeResult('warning', severity, check, detail, failure)
}

async function tableSelectCheck(table, columns, detail) {
  const { error } = await supabase
    .from(table)
    .select(columns)
    .limit(1)

  if (error) {
    return fail('P0', `Production ${table} columns`, detail, error.message)
  }

  return pass(`Production ${table} columns`, detail)
}

async function exactCount(table, applyFilters = (query) => query) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true })
  query = applyFilters(query)
  const { count, error } = await query
  if (error) throw new Error(`${table} count failed: ${error.message}`)
  return count || 0
}

async function fetchRows(label, query) {
  const { data, error } = await query
  if (error) throw new Error(`${label} failed: ${error.message}`)
  return data || []
}

function resultRows(results) {
  return results.map((result) => [
    result.status,
    result.severity,
    result.check,
    result.detail,
    result.failure
  ])
}

function rowCountRows(rowCounts) {
  return Object.entries(rowCounts).map(([label, count]) => [label, count])
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toISOString()
}

function maskEmail(value) {
  if (!value || !String(value).includes('@')) return '-'
  const [local, domain] = String(value).split('@')
  const prefix = local.slice(0, 2) || '*'
  return `${prefix}***@${domain}`
}

const sourceFiles = {
  router: readFileSync(resolve(root, 'app/src/router/index.js'), 'utf8'),
  bookingsList: readFileSync(resolve(root, 'app/src/views/admin/EventBookingsList.vue'), 'utf8'),
  bookingDetails: readFileSync(resolve(root, 'app/src/views/admin/BookingDetails.vue'), 'utf8'),
  eventDetails: readFileSync(resolve(root, 'app/src/views/admin/EventDetails.vue'), 'utf8'),
  checkIn: readFileSync(resolve(root, 'app/src/views/admin/AttendeeCheckIn.vue'), 'utf8'),
  ordersList: readFileSync(resolve(root, 'app/src/views/admin/OrdersList.vue'), 'utf8'),
  orderDetails: readFileSync(resolve(root, 'app/src/views/admin/OrderDetails.vue'), 'utf8'),
  checkInMigration: existsSync(resolve(root, 'supabase/migrations/20260519_add_booking_checkin_fields.sql'))
    ? readFileSync(resolve(root, 'supabase/migrations/20260519_add_booking_checkin_fields.sql'), 'utf8')
    : ''
}

const sourceResults = [
  sourceIncludes(sourceFiles.router, [
    "path: 'events/bookings'",
    'EventBookingsList',
    "path: 'events/:id'",
    'EventDetails',
    "path: 'events/:id/checkin'",
    'AttendeeCheckIn',
    "path: 'bookings/:id'",
    'BookingDetails',
    "path: 'orders'",
    'AdminOrders',
    "path: 'orders/:id'"
  ])
    ? pass('Admin booking routes', 'Booking list, event detail, check-in, booking detail, order list, and order detail routes are registered.')
    : fail('P0', 'Admin booking routes', 'Required admin booking routes should be registered.', 'One or more required routes are missing.'),
  sourceIncludes(sourceFiles.bookingsList, [
    "from('bookings')",
    'filters.categoryId',
    'filters.status',
    'filters.eventDate',
    'filters.search',
    '/admin/bookings/',
    '/admin/events/'
  ])
    ? pass('Booking list workflow source', 'Booking list supports event/category/date/status/search workflow and links into booking/event detail.')
    : fail('P1', 'Booking list workflow source', 'Booking list should support launch support filters and detail links.', 'Expected filters or links were not found.'),
  sourceIncludes(sourceFiles.bookingDetails, [
    "from('bookings')",
    'booking_attendees',
    "status: 'cancelled'",
    'cancelled_at',
    'cancel_reason',
    '/admin/orders/'
  ])
    ? pass('Booking detail workflow source', 'Booking detail loads attendees, supports cancellation, and links to the order detail route.')
    : fail('P1', 'Booking detail workflow source', 'Booking detail should support attendee review, cancellation, and payment/order reconciliation.', 'Expected attendee, cancellation, or order link source was not found.'),
  sourceIncludes(sourceFiles.eventDetails, [
    "from('event_capacity')",
    "from('bookings')",
    'booking_attendees',
    '/checkin',
    '/admin/orders/'
  ])
    ? pass('Event detail workflow source', 'Event detail shows capacity, bookings, attendee rows, check-in entry, and order links.')
    : fail('P1', 'Event detail workflow source', 'Event detail should support event-day capacity, attendee, booking, check-in, and order reconciliation.', 'Expected capacity, booking, check-in, or order link source was not found.'),
  sourceIncludes(sourceFiles.checkIn, [
    "from('bookings')",
    "status', 'confirmed'",
    'checked_in',
    'checked_in_at',
    'toggleCheckIn'
  ])
    ? pass('Check-in workflow source', 'Check-in screen reads confirmed bookings and toggles booking check-in fields.')
    : fail('P0', 'Check-in workflow source', 'Check-in screen should read confirmed bookings and persist check-in state.', 'Expected check-in source was not found.'),
  sourceFiles.ordersList.includes("item.item_type === 'product_physical'")
    ? fail('P1', 'Orders list event visibility source', 'Admin orders list should include event orders for payment reconciliation.', 'Orders list still filters to physical product orders.')
    : pass('Orders list event visibility source', 'Admin orders list no longer filters event-only orders out of the back office.'),
  sourceIncludes(sourceFiles.orderDetails, [
    'stripe_payment_intent_id',
    'dashboard.stripe.com/payments',
    "from('payments')",
    "from('order_items')"
  ])
    ? pass('Order detail reconciliation source', 'Order detail exposes payment and Stripe Dashboard reconciliation data.')
    : fail('P1', 'Order detail reconciliation source', 'Order detail should expose payment data and Stripe reconciliation links.', 'Expected payment or Stripe source was not found.'),
  sourceIncludes(sourceFiles.checkInMigration, [
    'ADD COLUMN IF NOT EXISTS checked_in',
    'ADD COLUMN IF NOT EXISTS checked_in_at',
    'idx_bookings_event_status_checkin'
  ])
    ? pass('Check-in migration source', 'Migration exists for booking check-in fields used by the admin UI.')
    : fail('P0', 'Check-in migration source', 'A production migration is required for booking check-in fields.', 'No local migration for checked_in and checked_in_at was found.')
]

const tableResults = []
tableResults.push(await tableSelectCheck(
  'bookings',
  'id,order_id,order_item_id,offering_event_id,customer_email,customer_name,number_of_attendees,status,cancelled_at,cancel_reason,created_at,updated_at',
  'Core booking operations columns are selectable.'
))
tableResults.push(await tableSelectCheck(
  'bookings',
  'id,checked_in,checked_in_at',
  'Event-day check-in columns are selectable in production.'
))
tableResults.push(await tableSelectCheck(
  'booking_attendees',
  'id,booking_id,first_name,last_name,email,phone,allergies,notes,created_at',
  'Attendee fields needed by admin booking detail are selectable.'
))
tableResults.push(await tableSelectCheck(
  'orders',
  'id,order_number,customer_email,status,total_gbp,stripe_checkout_session_id,stripe_payment_intent_id,created_at',
  'Order reconciliation fields are selectable.'
))
tableResults.push(await tableSelectCheck(
  'order_items',
  'id,order_id,item_type,title,quantity,total_price_gbp,event_date,event_start_time,created_at',
  'Event order item fields are selectable.'
))
tableResults.push(await tableSelectCheck(
  'event_capacity',
  'id,offering_event_id,total_capacity,spaces_booked,spaces_reserved,spaces_available,waitlist_enabled,waitlist_count',
  'Capacity fields used by admin event detail are selectable.'
))

const checkInColumnsAvailable = tableResults.some((result) =>
  result.check === 'Production bookings columns' &&
  result.detail === 'Event-day check-in columns are selectable in production.' &&
  result.status === 'passed'
)

const bookingSelect = `
  id,
  order_id,
  order_item_id,
  offering_event_id,
  customer_email,
  customer_name,
  number_of_attendees,
  status,
  cancelled_at,
  cancel_reason,
  created_at,
  ${checkInColumnsAvailable ? 'checked_in, checked_in_at,' : ''}
  order:orders(
    id,
    order_number,
    status,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    total_gbp
  ),
  booking_attendees(id, first_name, last_name),
  offering_event:offering_events(
    id,
    event_date,
    event_start_time,
    current_bookings,
    max_capacity,
    offering:offerings(title, slug, status)
  )
`

const [bookings, capacities, orders, rowCounts] = await Promise.all([
  fetchRows('bookings lookup', supabase
    .from('bookings')
    .select(bookingSelect)
    .order('created_at', { ascending: false })
    .limit(5000)),
  fetchRows('capacity lookup', supabase
    .from('event_capacity')
    .select('id,offering_event_id,total_capacity,spaces_booked,spaces_available')),
  fetchRows('orders lookup', supabase
    .from('orders')
    .select(`
      id,
      order_number,
      customer_email,
      status,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      total_gbp,
      created_at,
      order_items(id, item_type)
    `)
    .order('created_at', { ascending: false })
    .limit(5000)),
  (async () => ({
    'bookings total': await exactCount('bookings'),
    'bookings confirmed': await exactCount('bookings', (query) => query.eq('status', 'confirmed')),
    'bookings cancelled': await exactCount('bookings', (query) => query.eq('status', 'cancelled')),
    'bookings no_show': await exactCount('bookings', (query) => query.eq('status', 'no_show')),
    'booking_attendees total': await exactCount('booking_attendees'),
    'orders total': await exactCount('orders'),
    'orders paid': await exactCount('orders', (query) => query.eq('status', 'paid')),
    'orders cancelled': await exactCount('orders', (query) => query.eq('status', 'cancelled')),
    'event_capacity rows': await exactCount('event_capacity')
  }))()
])

const capacityByEventId = new Map(capacities.map((row) => [row.offering_event_id, row]))
const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed')
const futureConfirmedBookings = confirmedBookings.filter((booking) =>
  booking.offering_event?.event_date && booking.offering_event.event_date >= auditDate
)

const eventOrders = orders.filter((order) =>
  (order.order_items || []).some((item) => item.item_type === 'event')
)

const futureBookingIssueRows = []

for (const booking of futureConfirmedBookings) {
  const attendeeRows = booking.booking_attendees || []
  const attendeeCount = Number(booking.number_of_attendees || 0)
  const issues = []

  if (!booking.offering_event) issues.push('missing event relation')
  if (!booking.order) issues.push('missing order relation')
  if (booking.order && !['paid', 'fulfilled'].includes(booking.order.status)) {
    issues.push(`order status ${booking.order.status}`)
  }
  if (!booking.order_item_id) issues.push('missing order_item_id')
  if (attendeeRows.length !== attendeeCount) {
    issues.push(`attendee rows ${attendeeRows.length}/${attendeeCount}`)
  }
  if (!capacityByEventId.has(booking.offering_event_id)) {
    issues.push('missing event_capacity row')
  }

  if (issues.length) {
    futureBookingIssueRows.push([
      booking.id,
      booking.order?.order_number || '-',
      booking.offering_event?.offering?.title || '-',
      booking.offering_event?.event_date || '-',
      attendeeCount,
      issues.join(', ')
    ])
  }
}

const attendeesByEventId = new Map()
const bookingsByEventId = new Map()
for (const booking of confirmedBookings) {
  const eventId = booking.offering_event_id
  attendeesByEventId.set(eventId, (attendeesByEventId.get(eventId) || 0) + Number(booking.number_of_attendees || 0))
  bookingsByEventId.set(eventId, (bookingsByEventId.get(eventId) || 0) + 1)
}

const futureCapacityIssueRows = []
const historicalCapacityIssueRows = []
for (const [eventId, attendees] of attendeesByEventId.entries()) {
  const booking = confirmedBookings.find((row) => row.offering_event_id === eventId)
  const event = booking?.offering_event
  const capacity = capacityByEventId.get(eventId)
  if (!capacity || !event) continue

  const spacesBooked = Number(capacity.spaces_booked || 0)
  const currentBookings = Number(event.current_bookings || 0)
  if (spacesBooked !== currentBookings || spacesBooked !== attendees) {
    const issueRow = [
      eventId,
      event.offering?.title || '-',
      event.offering?.slug || '-',
      event.event_date || '-',
      bookingsByEventId.get(eventId) || 0,
      attendees,
      spacesBooked,
      currentBookings,
      spacesBooked - attendees
    ]

    if (event.event_date && event.event_date >= auditDate) {
      futureCapacityIssueRows.push(issueRow)
    } else {
      historicalCapacityIssueRows.push(issueRow)
    }
  }
}

const duplicateBusinessRows = []
const bookingKeyCounts = new Map()
for (const booking of confirmedBookings) {
  const key = [
    booking.order_id || '-',
    booking.order_item_id || '-',
    booking.offering_event_id || '-',
    normalizeText(booking.customer_email).toLowerCase()
  ].join('|')
  bookingKeyCounts.set(key, (bookingKeyCounts.get(key) || 0) + 1)
}
for (const [key, count] of bookingKeyCounts.entries()) {
  if (count > 1) duplicateBusinessRows.push([key, count])
}

const dataResults = [
  futureBookingIssueRows.length === 0
    ? pass('Future booking integrity', `${futureConfirmedBookings.length} future confirmed booking(s) have linked event, order, capacity, and attendee counts.`)
    : fail('P0', 'Future booking integrity', `${futureBookingIssueRows.length} future confirmed booking issue(s) found.`, 'See Future Booking Issues.'),
  futureCapacityIssueRows.length === 0
    ? pass('Future capacity consistency', `${futureConfirmedBookings.length} future confirmed booking(s) have no future capacity drift.`)
    : fail('P0', 'Future capacity consistency', `${futureCapacityIssueRows.length} future event capacity mismatch(es) found.`, 'See Future Capacity Issues.'),
  historicalCapacityIssueRows.length === 0
    ? pass('Historical capacity consistency', `${attendeesByEventId.size} event(s) with confirmed bookings have no historical capacity drift.`)
    : warn('P2', 'Historical capacity consistency', `${historicalCapacityIssueRows.length} historical event capacity mismatch(es) found.`, 'Historical drift should be reconciled, but it does not block future launch events unless one of these records is public/bookable.'),
  duplicateBusinessRows.length === 0
    ? pass('Duplicate confirmed bookings', 'No duplicate confirmed booking business keys were found in the sampled production rows.')
    : warn('P1', 'Duplicate confirmed bookings', `${duplicateBusinessRows.length} duplicate confirmed booking key(s) found.`, 'Review whether these are legitimate multi-bookings or duplicates.'),
  eventOrders.length > 0
    ? pass('Event order visibility data', `${eventOrders.length} event order(s) exist in production data and should now be visible in admin Orders.`)
    : warn('P2', 'Event order visibility data', 'No event orders found in the sampled production order rows.', 'This is acceptable before live bookings, but post-launch proof should include at least one event order.')
]

const sampleFutureBookings = futureConfirmedBookings.slice(0, 20).map((booking) => [
  booking.order?.order_number || '-',
  booking.offering_event?.offering?.title || '-',
  booking.offering_event?.event_date || '-',
  booking.offering_event?.event_start_time || '-',
  maskEmail(booking.customer_email),
  booking.number_of_attendees,
  (booking.booking_attendees || []).length,
  booking.order?.status || '-',
  checkInColumnsAvailable ? (booking.checked_in ? 'yes' : 'no') : 'missing column'
])

const eventOrderSamples = eventOrders.slice(0, 20).map((order) => [
  order.order_number,
  order.status,
  maskEmail(order.customer_email),
  order.total_gbp,
  order.stripe_checkout_session_id ? order.stripe_checkout_session_id.replace(/^(cs_(test|live)_).+$/, '$1...') : '-',
  order.stripe_payment_intent_id ? order.stripe_payment_intent_id.replace(/^(pi_).+$/, '$1...') : '-',
  formatDateTime(order.created_at)
])

const allResults = [...sourceResults, ...tableResults, ...dataResults]
const failedResults = allResults.filter((result) => result.status === 'failed')
const p0Failures = failedResults.filter((result) => result.severity === 'P0')
const p1Failures = failedResults.filter((result) => result.severity === 'P1')
const launchStatus = p0Failures.length === 0 && p1Failures.length === 0
  ? 'green for audited admin booking operations'
  : 'blocked for audited admin booking operations'

const markdown = `# Admin Booking Operations Readiness Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Admin Booking Operations](./admin-booking-operations-readiness.md)
Audit script: \`scripts/audit-admin-booking-operations-readiness.mjs\`
Supabase project: ${new URL(supabaseUrl).host}

## Run Summary

| Check | Result |
| --- | --- |
| Audit date | ${auditDate} |
| Launch status | ${launchStatus} |
| Source checks | ${sourceResults.length} |
| Production table checks | ${tableResults.length} |
| Data checks | ${dataResults.length} |
| Failed checks | ${failedResults.length} |
| P0 failures | ${p0Failures.length} |
| P1 failures | ${p1Failures.length} |
| Future confirmed bookings sampled | ${futureConfirmedBookings.length} |
| Event orders sampled | ${eventOrders.length} |

## Check Results

${formatTable(['Status', 'Severity', 'Check', 'Detail', 'Failure'], resultRows(allResults))}

## Production Row Counts

${formatTable(['Metric', 'Count'], rowCountRows(rowCounts))}

## Future Booking Issues

${formatTable(
  ['Booking ID', 'Order', 'Event', 'Event date', 'Attendees', 'Issues'],
  futureBookingIssueRows
)}

## Future Capacity Issues

${formatTable(
  ['Event ID', 'Event', 'Slug', 'Event date', 'Confirmed bookings', 'Confirmed attendees', 'Capacity spaces_booked', 'Event current_bookings', 'Drift vs attendees'],
  futureCapacityIssueRows
)}

## Historical Capacity Issues

${formatTable(
  ['Event ID', 'Event', 'Slug', 'Event date', 'Confirmed bookings', 'Confirmed attendees', 'Capacity spaces_booked', 'Event current_bookings', 'Drift vs attendees'],
  historicalCapacityIssueRows
)}

## Duplicate Confirmed Booking Keys

${formatTable(['Business key', 'Count'], duplicateBusinessRows)}

## Sample Future Confirmed Bookings

${formatTable(
  ['Order', 'Event', 'Date', 'Start', 'Customer email', 'Attendees', 'Attendee rows', 'Order status', 'Checked in'],
  sampleFutureBookings
)}

## Sample Event Orders

${formatTable(
  ['Order', 'Status', 'Customer email', 'Total', 'Stripe checkout session', 'Stripe payment intent', 'Created'],
  eventOrderSamples
)}

## Interpretation

- The audit is read-only against Supabase. It does not cancel bookings, mark check-ins, issue refunds, or change capacity.
- Source checks confirm the admin code paths needed for booking list, booking detail, event detail, check-in, order list, and Stripe reconciliation are present.
- Production table checks verify the columns the admin UI depends on are actually selectable in the configured production Supabase project.
- Capacity consistency compares confirmed booking attendee totals, \`event_capacity.spaces_booked\`, and \`offering_events.current_bookings\`.
- Refund handling is not automated by this audit. If a booking is cancelled in admin, the operational refund still needs a documented Stripe/manual process unless refund automation is added.
`

writeFileSync(evidencePath, markdown, 'utf8')

console.log(`Admin booking operations readiness audit complete: ${failedResults.length} failed, ${allResults.filter((result) => result.status === 'warning').length} warnings`)
if (failedResults.length > 0) {
  console.log(formatTable(['Severity', 'Check', 'Failure'], failedResults.map((result) => [result.severity, result.check, result.failure])))
}

if (p0Failures.length > 0 || p1Failures.length > 0) {
  throw new Error(`Admin booking operations readiness blocked: ${p0Failures.length} P0 and ${p1Failures.length} P1 failure(s)`)
}
