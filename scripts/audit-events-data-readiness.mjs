#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const outputPath = resolve(root, 'docs/events-data-cms-readiness-evidence.md')
const sqlRpcEvidencePath = resolve(root, 'docs/events-sql-rpc-verification.md')
const adminUiEvidencePath = resolve(root, 'docs/admin-ui-edit-proof.md')
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const sqlRpcEvidence = existsSync(sqlRpcEvidencePath)
  ? readFileSync(sqlRpcEvidencePath, 'utf8')
  : ''
const adminUiEvidence = existsSync(adminUiEvidencePath)
  ? readFileSync(adminUiEvidencePath, 'utf8')
  : ''
const sqlRpcVerified = (
  /\| P0 findings \| 0 \|/.test(sqlRpcEvidence) &&
  /\| P1 findings \| 0 \|/.test(sqlRpcEvidence)
)
const adminUiVerified = (
  /Proof status:\s*Verified and cleaned up/.test(adminUiEvidence) &&
  /\| delete proof admin user \| passed \| - \|/.test(adminUiEvidence) &&
  !/\| failed \|/.test(adminUiEvidence)
)

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

const env = {
  ...fileEnvs.functions,
  ...fileEnvs.migration,
  ...fileEnvs.root,
  ...fileEnvs.app,
  ...process.env
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

const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  fileEnvs.app.VITE_SUPABASE_ANON_KEY ||
  fileEnvs.app.SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const normalizedUrl = supabaseUrl.replace(/\/$/, '')

async function request(path, key = serviceRoleKey) {
  const response = await fetch(`${normalizedUrl}${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json'
    }
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

async function requestOptional(label, fn) {
  try {
    return { label, ok: true, data: await fn() }
  } catch (error) {
    return { label, ok: false, error: error.message }
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

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

function parseDate(value) {
  if (!value) return null
  return String(value).slice(0, 10)
}

function isFutureOrToday(value) {
  const date = parseDate(value)
  return date ? date >= auditDate : false
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

function publicHost(url) {
  try {
    return new URL(url).host
  } catch {
    return 'invalid-url'
  }
}

async function checkUrl(url) {
  if (isBlank(url)) {
    return { url, ok: false, status: 'missing' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    let response = await fetch(url, { method: 'HEAD', signal: controller.signal })

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: controller.signal
      })
    }

    return { url, ok: response.ok, status: response.status }
  } catch (error) {
    return { url, ok: false, status: error.name === 'AbortError' ? 'timeout' : error.message }
  } finally {
    clearTimeout(timeout)
  }
}

function uniqueBy(items, keyFn) {
  const seen = new Set()
  const result = []

  for (const item of items) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}

const [
  offeringsResult,
  eventsResult,
  capacityResult,
  categoriesResult,
  bookingsResult,
  sitePagesResult,
  pageSectionsResult,
  bucketsResult,
  anonPublishedOfferingsResult,
  anonNonPublishedOfferingsResult,
  anonEventsResult
] = await Promise.all([
  requestOptional('offerings', () => request('/rest/v1/offerings?type=eq.event&select=*')),
  requestOptional('offering_events', () => request('/rest/v1/offering_events?select=*')),
  requestOptional('event_capacity', () => request('/rest/v1/event_capacity?select=*')),
  requestOptional('event_categories', () => request('/rest/v1/event_categories?select=*')),
  requestOptional('bookings', () => request('/rest/v1/bookings?select=id,offering_event_id,number_of_attendees,status')),
  requestOptional('site_pages', () => request('/rest/v1/site_pages?select=*')),
  requestOptional('page_sections', () => request('/rest/v1/page_sections?select=id,page_id,section_key,section_type,is_enabled')),
  requestOptional('storage.buckets', () => request('/storage/v1/bucket')),
  requestOptional('anon.published_offerings', () =>
    anonKey
      ? request('/rest/v1/offerings?type=eq.event&status=eq.published&select=id,status&limit=25', anonKey)
      : Promise.reject(new Error('Missing anon key'))
  ),
  requestOptional('anon.non_published_offerings', () =>
    anonKey
      ? request('/rest/v1/offerings?type=eq.event&status=neq.published&select=id,status&limit=25', anonKey)
      : Promise.reject(new Error('Missing anon key'))
  ),
  requestOptional('anon.offering_events', () =>
    anonKey
      ? request('/rest/v1/offering_events?select=id,offering_id,event_date&limit=1000', anonKey)
      : Promise.reject(new Error('Missing anon key'))
  )
])

const queryResults = [
  offeringsResult,
  eventsResult,
  capacityResult,
  categoriesResult,
  bookingsResult,
  sitePagesResult,
  pageSectionsResult,
  bucketsResult,
  anonPublishedOfferingsResult,
  anonNonPublishedOfferingsResult,
  anonEventsResult
]

const offerings = asArray(offeringsResult.data)
const events = asArray(eventsResult.data)
const capacities = asArray(capacityResult.data)
const categories = asArray(categoriesResult.data)
const bookings = asArray(bookingsResult.data)
const sitePages = asArray(sitePagesResult.data)
const pageSections = asArray(pageSectionsResult.data)
const buckets = asArray(bucketsResult.data)

const offeringById = new Map(offerings.map((offering) => [offering.id, offering]))
const eventById = new Map(events.map((event) => [event.id, event]))
const capacityByEventId = new Map(capacities.map((capacity) => [capacity.offering_event_id, capacity]))
const categoryById = new Map(categories.map((category) => [category.id, category]))
const bookingAttendeeCountByEventId = new Map()

for (const booking of bookings) {
  if (!booking.offering_event_id || booking.status === 'cancelled') continue
  const current = bookingAttendeeCountByEventId.get(booking.offering_event_id) || 0
  bookingAttendeeCountByEventId.set(
    booking.offering_event_id,
    current + Number(booking.number_of_attendees || 0)
  )
}

const futureEvents = events
  .filter((event) => isFutureOrToday(event.event_date))
  .map((event) => ({
    event,
    offering: offeringById.get(event.offering_id),
    capacity: capacityByEventId.get(event.id),
    category: categoryById.get(event.category_id)
  }))
  .sort((a, b) => {
    const dateCompare = String(a.event.event_date || '').localeCompare(String(b.event.event_date || ''))
    if (dateCompare !== 0) return dateCompare
    const timeCompare = String(a.event.event_start_time || '').localeCompare(String(b.event.event_start_time || ''))
    if (timeCompare !== 0) return timeCompare
    return String(a.offering?.title || '').localeCompare(String(b.offering?.title || ''))
  })

const publishedFutureEvents = futureEvents.filter(({ offering }) => offering?.status === 'published')

const rowCounts = offerings.reduce((counts, offering) => {
  counts[offering.status || 'unknown'] = (counts[offering.status || 'unknown'] || 0) + 1
  return counts
}, {})

const missingRequiredFields = publishedFutureEvents.filter(({ event, offering }) => (
  isBlank(offering?.slug) ||
  isBlank(event.event_date) ||
  isBlank(event.event_start_time) ||
  event.price_gbp === null ||
  event.price_gbp === undefined ||
  event.max_capacity === null ||
  event.max_capacity === undefined ||
  Number(event.max_capacity) <= 0 ||
  isBlank(event.location_name) ||
  (isBlank(offering?.description_short) && isBlank(offering?.description_long)) ||
  isBlank(offering?.featured_image_url) && isBlank(categoryById.get(event.category_id)?.featured_image_url) ||
  isBlank(event.category_id)
))

const missingCapacityRows = publishedFutureEvents.filter(({ capacity }) => !capacity)

const capacityMismatches = publishedFutureEvents.filter(({ event, capacity }) => {
  if (!capacity) return false

  const intendedSellableCapacity = Number(event.available_spaces ?? event.max_capacity)
  const totalCapacity = Number(capacity.total_capacity)
  const spacesBooked = Number(capacity.spaces_booked)
  const currentBookings = Number(event.current_bookings || 0)
  const spacesReserved = Number(capacity.spaces_reserved || 0)
  const spacesAvailable = Number(capacity.spaces_available)

  return (
    totalCapacity !== intendedSellableCapacity ||
    spacesBooked !== currentBookings ||
    spacesBooked !== Number(bookingAttendeeCountByEventId.get(event.id) || 0) ||
    spacesAvailable < 0 ||
    spacesBooked + spacesReserved > totalCapacity
  )
})

const duplicateGroups = new Map()
for (const item of publishedFutureEvents) {
  const key = [
    normalizeText(item.offering?.title),
    parseDate(item.event.event_date),
    String(item.event.event_start_time || '').slice(0, 5)
  ].join('|')

  const group = duplicateGroups.get(key) || []
  group.push(item)
  duplicateGroups.set(key, group)
}

const duplicates = [...duplicateGroups.values()].filter((group) => group.length > 1)

const suspiciousPublicEvents = publishedFutureEvents.filter(({ offering }) => {
  const title = normalizeText(offering?.title)
  const slug = normalizeText(offering?.slug)
  return ['test', 'dummy', 'sample', 'duplicate', 'copy'].some((term) =>
    title.includes(term) || slug.includes(term)
  )
})

const invalidCategories = categories.filter((category) => (
  !['standard', 'adult_workshop', 'enquiry_only'].includes(category.layout_key) ||
  category.layout_key === null ||
  category.layout_key === undefined
))

const inactiveLaunchCategories = publishedFutureEvents.filter(({ category }) => (
  category && category.is_active === false
))

const requiredBucketIds = ['workshop-images', 'category-images', 'site-images']
const bucketById = new Map(buckets.map((bucket) => [bucket.id, bucket]))
const missingBuckets = requiredBucketIds.filter((bucketId) => !bucketById.has(bucketId))
const nonPublicBuckets = requiredBucketIds.filter((bucketId) => {
  const bucket = bucketById.get(bucketId)
  return bucket && bucket.public !== true
})

const imageTargets = uniqueBy([
  ...publishedFutureEvents.map(({ event, offering, category }) => ({
    label: `event:${offering?.slug || offering?.id || 'unknown'}`,
    type: offering?.featured_image_url ? 'event featured image' : 'event category fallback image',
    url: offering?.featured_image_url || category?.featured_image_url
  })),
  ...categories
    .filter((category) => category.featured_image_url)
    .map((category) => ({
      label: `category:${category.slug || category.id}`,
      type: 'category featured image',
      url: category.featured_image_url
    }))
], (item) => `${item.type}:${item.url}`)

const imageChecks = []
for (const target of imageTargets) {
  const check = await checkUrl(target.url)
  imageChecks.push({ ...target, ...check, host: target.url ? publicHost(target.url) : '-' })
}

const brokenImages = imageChecks.filter((check) => !check.ok)

const anonPublishedCount = asArray(anonPublishedOfferingsResult.data).length
const anonNonPublishedRows = asArray(anonNonPublishedOfferingsResult.data)
const anonEventsRows = asArray(anonEventsResult.data)
const nonPublishedEventIds = new Set(
  futureEvents
    .filter(({ offering }) => offering && offering.status !== 'published')
    .map(({ event }) => event.id)
)
const anonVisibleNonPublishedEventRows = anonEventsRows.filter((event) => nonPublishedEventIds.has(event.id))

const cmsRequiredPaths = [
  '/workshops',
  '/adult-workshops',
  '/contact',
  '/faqs',
  '/privacy-policy',
  '/terms-and-conditions'
]

const sitePageByPath = new Map(sitePages.map((page) => [page.path, page]))
const enabledSectionCountByPageId = pageSections.reduce((counts, section) => {
  if (section.is_enabled === false) return counts
  counts.set(section.page_id, (counts.get(section.page_id) || 0) + 1)
  return counts
}, new Map())
const missingCmsPaths = cmsRequiredPaths.filter((path) => !sitePageByPath.has(path))
const unpublishedCmsPaths = cmsRequiredPaths.filter((path) => {
  const page = sitePageByPath.get(path)
  return page && page.status !== 'published'
})
const missingCmsContentPaths = cmsRequiredPaths.filter((path) => {
  const page = sitePageByPath.get(path)
  return page?.page_kind === 'cms_page' && !enabledSectionCountByPageId.get(page.id)
})

const blockers = [
  ...missingRequiredFields.map(({ offering, event }) => ({
    severity: 'P0',
    area: 'Missing fields',
    detail: `${offering?.title || event.id} (${offering?.slug || 'missing slug'})`
  })),
  ...missingCapacityRows.map(({ offering, event }) => ({
    severity: 'P0',
    area: 'Missing capacity',
    detail: `${offering?.title || event.id} (${offering?.slug || 'missing slug'})`
  })),
  ...capacityMismatches.map(({ offering, event }) => ({
    severity: 'P0',
    area: 'Capacity mismatch',
    detail: `${offering?.title || event.id} (${offering?.slug || 'missing slug'}, event ${event.id})`
  })),
  ...duplicates.flatMap((group) => group.map(({ offering, event }) => ({
    severity: 'P0',
    area: 'Duplicate public event',
    detail: `${offering?.title || event.id} (${offering?.slug || 'missing slug'})`
  }))),
  ...suspiciousPublicEvents.map(({ offering, event }) => ({
    severity: 'P0',
    area: 'Suspicious public event',
    detail: `${offering?.title || event.id} (${offering?.slug || 'missing slug'})`
  })),
  ...invalidCategories.map((category) => ({
    severity: 'P0',
    area: 'Invalid category layout',
    detail: `${category.name || category.id} (${category.slug || 'missing slug'})`
  })),
  ...inactiveLaunchCategories.map(({ offering, category }) => ({
    severity: 'P0',
    area: 'Inactive launch category',
    detail: `${offering?.title || 'unknown'} uses ${category.name || category.id}`
  })),
  ...missingBuckets.map((bucketId) => ({
    severity: 'P0',
    area: 'Missing storage bucket',
    detail: bucketId
  })),
  ...nonPublicBuckets.map((bucketId) => ({
    severity: 'P0',
    area: 'Non-public storage bucket',
    detail: bucketId
  })),
  ...brokenImages.map((check) => ({
    severity: 'P1',
    area: 'Broken image',
    detail: `${check.label} (${check.status})`
  })),
  ...anonNonPublishedRows.map((row) => ({
    severity: 'P0',
    area: 'RLS exposure',
    detail: `Anon can read non-published offering ${row.id} (${row.status})`
  })),
  ...anonVisibleNonPublishedEventRows.map((row) => ({
    severity: 'P1',
    area: 'Event row exposure',
    detail: `Anon can read offering_events row for non-published offering: ${row.id}`
  })),
  ...missingCmsPaths.map((path) => ({
    severity: 'P1',
    area: 'Missing CMS/app route registry',
    detail: path
  })),
  ...unpublishedCmsPaths.map((path) => ({
    severity: 'P1',
    area: 'Unpublished CMS/app route registry',
    detail: path
  })),
  ...missingCmsContentPaths.map((path) => ({
    severity: 'P1',
    area: 'Missing CMS page content',
    detail: path
  }))
]

const nextActions = blockers.length
  ? [
    'Resolve every P0 blocker listed above before checkout validation.',
    ...(!sqlRpcVerified ? ['Run direct SQL policy/RPC verification from [Events Data And CMS Readiness](./events-data-cms-readiness.md).'] : []),
    ...(!adminUiVerified ? ['Capture admin UI edit proof for one safe draft event, one category, and one capacity change.'] : []),
    'Re-run this audit and keep this evidence pack current.'
  ]
  : [
    ...(!sqlRpcVerified ? ['Run direct SQL policy/RPC verification from [Events Data And CMS Readiness](./events-data-cms-readiness.md).'] : []),
    ...(!adminUiVerified ? ['Capture admin UI edit proof for one safe draft event, one category, and one capacity change.'] : []),
    'Review and approve seeded CMS policy/FAQ copy with the business owner before production launch.',
    'Move to Public Discovery And Event Detail Flow validation.'
  ]

const markdown = `# Events Data And CMS Readiness Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Events Data And CMS Readiness](./events-data-cms-readiness.md)
Audit source: production Supabase REST API using local service-role configuration

## Run Summary

| Check | Result |
|-------|--------|
| Audit date | ${auditDate} |
| Service-role data pull | ${queryResults.filter((result) => result.ok && !result.label.startsWith('anon.')).length}/${queryResults.filter((result) => !result.label.startsWith('anon.')).length} succeeded |
| Anonymous RLS probes | ${queryResults.filter((result) => result.ok && result.label.startsWith('anon.')).length}/${queryResults.filter((result) => result.label.startsWith('anon.')).length} succeeded |
| Future event rows | ${futureEvents.length} |
| Published future launch candidates | ${publishedFutureEvents.length} |
| P0 blockers | ${blockers.filter((blocker) => blocker.severity === 'P0').length} |
| P1 blockers | ${blockers.filter((blocker) => blocker.severity === 'P1').length} |
| Admin UI edit proof | ${adminUiVerified ? 'Verified and cleaned up in [Admin UI Edit Proof](./admin-ui-edit-proof.md).' : 'Pending. Requires an authenticated admin session and a safe draft/test event to edit.'} |

## Query Availability

${formatTable(
  ['Source', 'Status', 'Error'],
  queryResults.map((result) => [
    result.label,
    result.ok ? 'ok' : 'failed',
    result.ok ? '-' : result.error
  ])
)}

## Row Counts By Event Offering Status

${formatTable(
  ['Status', 'Event offerings'],
  Object.entries(rowCounts).sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => [status, count])
)}

## Launch Catalogue

${formatTable(
  ['Title', 'Slug', 'Status', 'Date', 'Start', 'Price', 'Capacity', 'Booked', 'Category', 'Layout'],
  publishedFutureEvents.map(({ event, offering, capacity, category }) => [
    offering?.title,
    offering?.slug,
    offering?.status,
    parseDate(event.event_date),
    String(event.event_start_time || '').slice(0, 5),
    event.price_gbp,
    capacity?.total_capacity ?? event.available_spaces ?? event.max_capacity,
    capacity?.spaces_booked ?? event.current_bookings ?? 0,
    category?.name || '-',
    category?.layout_key || '-'
  ])
)}

## Missing Required Fields

${formatTable(
  ['Title', 'Slug', 'Date', 'Missing'],
  missingRequiredFields.map(({ event, offering }) => {
    const missing = []
    if (isBlank(offering?.slug)) missing.push('slug')
    if (isBlank(event.event_date)) missing.push('event_date')
    if (isBlank(event.event_start_time)) missing.push('event_start_time')
    if (event.price_gbp === null || event.price_gbp === undefined) missing.push('price_gbp')
    if (event.max_capacity === null || event.max_capacity === undefined || Number(event.max_capacity) <= 0) missing.push('max_capacity')
    if (isBlank(event.location_name)) missing.push('location_name')
    if (isBlank(offering?.description_short) && isBlank(offering?.description_long)) missing.push('description')
    if (isBlank(offering?.featured_image_url) && isBlank(categoryById.get(event.category_id)?.featured_image_url)) {
      missing.push('featured_image_url or category fallback image')
    }
    if (isBlank(event.category_id)) missing.push('category_id')
    return [offering?.title || event.id, offering?.slug, parseDate(event.event_date), missing.join(', ')]
  })
)}

## Missing Capacity Rows

${formatTable(
  ['Title', 'Slug', 'Event ID', 'Date', 'Max capacity'],
  missingCapacityRows.map(({ event, offering }) => [
    offering?.title || event.id,
    offering?.slug,
    event.id,
    parseDate(event.event_date),
    event.max_capacity
  ])
)}

## Capacity Mismatches

${formatTable(
  ['Title', 'Slug', 'Event ID', 'Intended capacity', 'Capacity row total', 'Current bookings', 'Spaces booked', 'Booking attendee count', 'Reserved', 'Available'],
  capacityMismatches.map(({ event, offering, capacity }) => [
    offering?.title || event.id,
    offering?.slug,
    event.id,
    event.available_spaces ?? event.max_capacity,
    capacity?.total_capacity,
    event.current_bookings ?? 0,
    capacity?.spaces_booked,
    bookingAttendeeCountByEventId.get(event.id) || 0,
    capacity?.spaces_reserved,
    capacity?.spaces_available
  ])
)}

## Duplicate Public Events

${duplicates.length
  ? duplicates.map((group) => formatTable(
    ['Title', 'Slug', 'Date', 'Start'],
    group.map(({ event, offering }) => [
      offering?.title,
      offering?.slug,
      parseDate(event.event_date),
      String(event.event_start_time || '').slice(0, 5)
    ])
  )).join('\n\n')
  : '_No rows._'}

## Suspicious Public Event Records

${formatTable(
  ['Title', 'Slug', 'Date'],
  suspiciousPublicEvents.map(({ event, offering }) => [
    offering?.title,
    offering?.slug,
    parseDate(event.event_date)
  ])
)}

## Category Layout Audit

${formatTable(
  ['Name', 'Slug', 'Active', 'Layout', 'Image host'],
  categories.map((category) => [
    category.name,
    category.slug,
    category.is_active,
    category.layout_key,
    category.featured_image_url ? publicHost(category.featured_image_url) : '-'
  ])
)}

## Storage Bucket Audit

${formatTable(
  ['Bucket', 'Exists', 'Public'],
  requiredBucketIds.map((bucketId) => {
    const bucket = bucketById.get(bucketId)
    return [bucketId, bucket ? 'yes' : 'no', bucket ? bucket.public : '-']
  })
)}

## Image Spot Checks

${formatTable(
  ['Type', 'Label', 'Host', 'Status', 'Result'],
  imageChecks.map((check) => [
    check.type,
    check.label,
    check.host,
    check.status,
    check.ok ? 'ok' : 'failed'
  ])
)}

## Anonymous RLS Probes

| Probe | Result |
|-------|--------|
| Anonymous can read published event offerings | ${anonPublishedOfferingsResult.ok ? `${anonPublishedCount} sampled rows` : `failed: ${anonPublishedOfferingsResult.error}`} |
| Anonymous can read non-published event offerings | ${anonNonPublishedOfferingsResult.ok ? `${anonNonPublishedRows.length} sampled rows` : `failed: ${anonNonPublishedOfferingsResult.error}`} |
| Anonymous can read offering_events rows | ${anonEventsResult.ok ? `${anonEventsRows.length} sampled rows` : `failed: ${anonEventsResult.error}`} |
| Anonymous offering_events rows linked to non-published offerings | ${anonVisibleNonPublishedEventRows.length} sampled rows |

Note: REST probes validate runtime anonymous behavior. They do not replace direct production SQL review of \`pg_policies\`.

## CMS Route And Policy Link Registry

${formatTable(
  ['Path', 'Exists', 'Status', 'Kind', 'Title', 'Enabled sections'],
  cmsRequiredPaths.map((path) => {
    const page = sitePageByPath.get(path)
    return [
      path,
      page ? 'yes' : 'no',
      page?.status || '-',
      page?.page_kind || '-',
      page?.title || '-',
      page ? enabledSectionCountByPageId.get(page.id) || 0 : '-'
    ]
  })
)}

## Blockers

${formatTable(
  ['Severity', 'Area', 'Detail'],
  blockers.map((blocker) => [blocker.severity, blocker.area, blocker.detail])
)}

## Evidence Pack Status

| Evidence item | Status | Notes |
|---------------|--------|-------|
| Catalogue export | Done | Captured in Launch Catalogue. |
| Row counts | Done | Captured in Row Counts By Event Offering Status. |
| Required fields | ${missingRequiredFields.length ? 'Blocked' : 'Done'} | ${missingRequiredFields.length} rows need review. |
| Capacity rows | ${missingCapacityRows.length ? 'Blocked' : 'Done'} | ${missingCapacityRows.length} missing rows. |
| Capacity reconciliation | ${capacityMismatches.length ? 'Blocked' : 'Done'} | ${capacityMismatches.length} mismatches. |
| Duplicates and stale records | ${duplicates.length || suspiciousPublicEvents.length ? 'Blocked' : 'Done'} | ${duplicates.length} duplicate groups, ${suspiciousPublicEvents.length} suspicious public records. |
| Category audit | ${invalidCategories.length || inactiveLaunchCategories.length ? 'Blocked' : 'Done'} | ${invalidCategories.length} invalid layouts, ${inactiveLaunchCategories.length} inactive launch categories. |
| Image audit | ${brokenImages.length ? 'Review' : 'Done'} | ${brokenImages.length} failed image checks. |
| RLS review | ${anonNonPublishedRows.length ? 'Blocked' : sqlRpcVerified ? 'Done' : 'Partial'} | Anonymous REST probes complete.${sqlRpcVerified ? ' Direct `pg_policies` SQL review passed in [Events SQL/RPC Verification](./events-sql-rpc-verification.md).' : ' Direct `pg_policies` SQL review still required.'} |
| RPC review | ${sqlRpcVerified ? 'Done' : 'Pending'} | ${sqlRpcVerified ? 'Production `update_event_capacity_total` and `decrement_event_capacity` verification passed in [Events SQL/RPC Verification](./events-sql-rpc-verification.md).' : 'Requires direct SQL or Supabase CLI access to verify `update_event_capacity_total` and `decrement_event_capacity`.'} |
| Admin edit proof | ${adminUiVerified ? 'Done' : 'Pending'} | ${adminUiVerified ? 'Verified through the app admin UI against temporary non-public production records; cleanup passed in [Admin UI Edit Proof](./admin-ui-edit-proof.md).' : 'Requires authenticated admin UI session.'} |
| CMS policy links | ${missingCmsPaths.length || unpublishedCmsPaths.length || missingCmsContentPaths.length ? 'Review' : 'Done'} | ${missingCmsPaths.length} missing paths, ${unpublishedCmsPaths.length} unpublished paths, ${missingCmsContentPaths.length} CMS pages without enabled sections. |

## Next Actions

${nextActions.map((action, index) => `${index + 1}. ${action}`).join('\n')}
`

writeFileSync(outputPath, markdown, 'utf8')

console.log(JSON.stringify({
  outputPath,
  auditDate,
  futureEvents: futureEvents.length,
  publishedFutureEvents: publishedFutureEvents.length,
  blockers: blockers.length,
  p0Blockers: blockers.filter((blocker) => blocker.severity === 'P0').length,
  p1Blockers: blockers.filter((blocker) => blocker.severity === 'P1').length,
  sqlRpcVerified,
  adminUiVerified,
  failedSources: queryResults.filter((result) => !result.ok).map((result) => ({
    source: result.label,
    error: result.error
  }))
}, null, 2))
