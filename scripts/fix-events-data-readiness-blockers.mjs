#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const applyFixes = process.env.APPLY_FIXES === 'true'
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

const fileEnvs = {
  root: readEnvFile(resolve(root, '.env.local')),
  app: readEnvFile(resolve(root, 'app/.env.local')),
  functions: readEnvFile(resolve(root, 'supabase/functions/.env')),
  migration: readEnvFile(resolve(root, 'scripts/migration/.env'))
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

const normalizedUrl = supabaseUrl.replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${normalizedUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!response.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body)
    throw new Error(`${response.status} ${response.statusText}: ${detail}`)
  }

  return body
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function isFutureOrToday(value) {
  return value ? String(value).slice(0, 10) >= auditDate : false
}

const [offerings, events, capacities, categories, bookings, bookingAttendees] = await Promise.all([
  request('/rest/v1/offerings?type=eq.event&select=*'),
  request('/rest/v1/offering_events?select=*'),
  request('/rest/v1/event_capacity?select=*'),
  request('/rest/v1/event_categories?select=*'),
  request('/rest/v1/bookings?select=id,offering_event_id,number_of_attendees,status'),
  request('/rest/v1/booking_attendees?select=id,booking_id')
])

const offeringById = new Map(asArray(offerings).map((offering) => [offering.id, offering]))
const capacityByEventId = new Map(asArray(capacities).map((capacity) => [capacity.offering_event_id, capacity]))
const categoryBySlug = new Map(asArray(categories).map((category) => [category.slug, category]))
const bookingAttendeeCountByBookingId = new Map()

for (const attendee of asArray(bookingAttendees)) {
  const current = bookingAttendeeCountByBookingId.get(attendee.booking_id) || 0
  bookingAttendeeCountByBookingId.set(attendee.booking_id, current + 1)
}

const bookingStatsByEventId = new Map()

for (const booking of asArray(bookings)) {
  if (!booking.offering_event_id || booking.status === 'cancelled') continue

  const stats = bookingStatsByEventId.get(booking.offering_event_id) || {
    bookingCount: 0,
    attendeeTotalFromBookings: 0,
    attendeeRows: 0
  }

  stats.bookingCount += 1
  stats.attendeeTotalFromBookings += Number(booking.number_of_attendees || 0)
  stats.attendeeRows += bookingAttendeeCountByBookingId.get(booking.id) || 0
  bookingStatsByEventId.set(booking.offering_event_id, stats)
}

const actions = []
const skipped = []

const vasesOffering = asArray(offerings).find((offering) => offering.slug === 'fri-lo-vases-of-flowers')
const vasesEvent = vasesOffering
  ? asArray(events).find((event) => event.offering_id === vasesOffering.id)
  : null
const littleOnesFriCategory = categoryBySlug.get('little-ones-fri-2-4')

if (vasesEvent && !vasesEvent.category_id && littleOnesFriCategory) {
  actions.push({
    type: 'set_event_category',
    eventId: vasesEvent.id,
    offeringSlug: vasesOffering.slug,
    before: null,
    after: littleOnesFriCategory.id,
    categorySlug: littleOnesFriCategory.slug
  })
}

for (const event of asArray(events)) {
  if (!isFutureOrToday(event.event_date)) continue

  const offering = offeringById.get(event.offering_id)
  if (offering?.status !== 'published') continue

  const capacity = capacityByEventId.get(event.id)
  if (!capacity) continue

  const stats = bookingStatsByEventId.get(event.id) || {
    bookingCount: 0,
    attendeeTotalFromBookings: 0,
    attendeeRows: 0
  }

  const actualBooked = stats.attendeeTotalFromBookings
  const currentBookings = Number(event.current_bookings || 0)
  const spacesBooked = Number(capacity.spaces_booked || 0)

  if (currentBookings === actualBooked && spacesBooked === actualBooked) continue

  if (actualBooked > Number(capacity.total_capacity || 0)) {
    skipped.push({
      type: 'capacity_reconcile',
      eventId: event.id,
      offeringSlug: offering?.slug,
      reason: 'booking attendee total exceeds total capacity',
      attendeeTotalFromBookings: actualBooked,
      totalCapacity: capacity.total_capacity
    })
    continue
  }

  actions.push({
    type: 'reconcile_capacity_to_bookings',
    eventId: event.id,
    capacityId: capacity.id,
    offeringSlug: offering?.slug,
    title: offering?.title,
    before: {
      current_bookings: currentBookings,
      spaces_booked: spacesBooked,
      spaces_available: capacity.spaces_available
    },
    after: {
      current_bookings: actualBooked,
      spaces_booked: actualBooked
    },
    bookingCount: stats.bookingCount,
    attendeeTotalFromBookings: actualBooked,
    attendeeRows: stats.attendeeRows,
    warning: stats.attendeeRows !== actualBooked
      ? 'booking_attendees row count does not match booking.number_of_attendees total'
      : null
  })
}

const applied = []

if (applyFixes) {
  for (const action of actions) {
    if (action.type === 'set_event_category') {
      await request(`/rest/v1/offering_events?id=eq.${encodeURIComponent(action.eventId)}`, {
        method: 'PATCH',
        body: { category_id: action.after }
      })
    }

    if (action.type === 'reconcile_capacity_to_bookings') {
      await request(`/rest/v1/offering_events?id=eq.${encodeURIComponent(action.eventId)}`, {
        method: 'PATCH',
        body: { current_bookings: action.after.current_bookings }
      })

      await request(`/rest/v1/event_capacity?id=eq.${encodeURIComponent(action.capacityId)}`, {
        method: 'PATCH',
        body: {
          spaces_booked: action.after.spaces_booked,
          last_updated_at: new Date().toISOString()
        }
      })
    }

    applied.push(action)
  }
}

console.log(JSON.stringify({
  mode: applyFixes ? 'apply' : 'dry-run',
  auditDate,
  plannedActions: actions.length,
  appliedActions: applied.length,
  skippedActions: skipped.length,
  actions,
  skipped
}, null, 2))
