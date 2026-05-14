#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const appUrl = (process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const screenshotDir = resolve(root, 'docs/evidence/public-discovery-screenshots')
const manifestPath = resolve(root, 'docs/public-discovery-responsive-screenshots.md')
const flowEvidencePath = resolve(root, 'docs/public-discovery-event-detail-flow-evidence.md')
const screenshotMaxHeight = Number(process.env.SCREENSHOT_MAX_HEIGHT || 9000)
const renderTimeoutMs = Number(process.env.SCREENSHOT_RENDER_TIMEOUT_MS || 15000)

const viewports = [
  { key: 'desktop', label: 'Desktop', width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false },
  { key: 'mobile', label: 'Mobile', width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
]

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

if (!existsSync(chromePath)) {
  throw new Error(`Chrome executable not found: ${chromePath}`)
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
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function publicUrl(path) {
  return `${appUrl}${path.startsWith('/') ? path : `/${path}`}`
}

async function fetchLaunchEvents() {
  const { data, error } = await supabase
    .from('offering_events')
    .select(`
      id,
      event_date,
      event_start_time,
      price_gbp,
      location_name,
      offering:offerings!inner(
        id,
        title,
        slug,
        status,
        type
      ),
      category:event_categories(
        id,
        name,
        slug,
        layout_key
      ),
      capacity:event_capacity(
        spaces_available,
        total_capacity,
        spaces_booked
      )
    `)
    .eq('offering.status', 'published')
    .eq('offering.type', 'event')
    .gte('event_date', auditDate)
    .order('event_date', { ascending: true })
    .order('event_start_time', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch launch events: ${error.message}`)
  }

  return data || []
}

function getCapacity(event) {
  if (Array.isArray(event.capacity)) return event.capacity[0] || null
  return event.capacity || null
}

function chooseRepresentativeEvents(events) {
  const seenSlugs = new Set()
  const uniqueEvents = events.filter((event) => {
    const slug = event.offering?.slug
    if (!slug || seenSlugs.has(slug)) return false
    seenSlugs.add(slug)
    return true
  })

  const hasSpaces = (event) => Number(getCapacity(event)?.spaces_available ?? 1) > 0
  const standard = uniqueEvents.find((event) =>
    event.category?.layout_key === 'standard' &&
    event.category?.slug !== 'half-term' &&
    hasSpaces(event)
  ) || uniqueEvents.find((event) => event.category?.layout_key === 'standard')

  const adult = uniqueEvents.find((event) =>
    event.category?.layout_key === 'adult_workshop' &&
    hasSpaces(event)
  ) || uniqueEvents.find((event) => event.category?.layout_key === 'adult_workshop')

  const enquiry = uniqueEvents.find((event) =>
    event.category?.layout_key === 'enquiry_only'
  )

  return { standard, adult, enquiry }
}

function buildTargets(events) {
  const reps = chooseRepresentativeEvents(events)
  const pageTargets = [
    {
      key: 'workshops',
      label: 'Workshops calendar',
      path: '/workshops',
      expectedText: ['Creative Workshops', 'today'],
      category: 'Public route'
    },
    {
      key: 'adult-workshops',
      label: 'Adult workshops',
      path: '/adult-workshops',
      expectedText: ['Adult Art Workshops', 'Upcoming Sessions'],
      category: 'Public route'
    },
    {
      key: 'half-term',
      label: 'Half term',
      path: '/half-term',
      expectedText: ['Half Term', 'Book your workshops below'],
      category: 'Public route'
    },
    {
      key: 'summer-holiday',
      label: 'Summer holiday',
      path: '/summer-holiday',
      expectedText: ['Summer Holiday'],
      category: 'Public route'
    }
  ]

  const detailTargets = [
    reps.standard && {
      key: `detail-standard-${slugify(reps.standard.offering.slug)}`,
      label: `Standard detail: ${reps.standard.offering.title}`,
      path: `/workshops/${encodeURIComponent(reps.standard.offering.slug)}`,
      expectedText: [reps.standard.offering.title],
      category: `${reps.standard.category?.name || 'Standard'} detail`
    },
    reps.adult && {
      key: `detail-adult-${slugify(reps.adult.offering.slug)}`,
      label: `Adult detail: ${reps.adult.offering.title}`,
      path: `/workshops/${encodeURIComponent(reps.adult.offering.slug)}`,
      expectedText: [reps.adult.offering.title, 'Book Now'],
      category: `${reps.adult.category?.name || 'Adult'} detail`
    },
    reps.enquiry && {
      key: `detail-enquiry-${slugify(reps.enquiry.offering.slug)}`,
      label: `Enquiry detail: ${reps.enquiry.offering.title}`,
      path: `/workshops/${encodeURIComponent(reps.enquiry.offering.slug)}`,
      expectedText: [reps.enquiry.offering.title, 'Book By Email'],
      category: `${reps.enquiry.category?.name || 'Enquiry-only'} detail`
    }
  ].filter(Boolean)

  return [...pageTargets, ...detailTargets]
}

async function waitForChromeWebSocket(process) {
  return new Promise((resolvePromise, rejectPromise) => {
    let stderr = ''
    const timeout = setTimeout(() => {
      rejectPromise(new Error(`Timed out waiting for Chrome DevTools URL. stderr: ${stderr.slice(-1000)}`))
    }, 15000)

    process.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (!match) return

      clearTimeout(timeout)
      resolvePromise(match[1])
    })

    process.on('error', (error) => {
      clearTimeout(timeout)
      rejectPromise(error)
    })

    process.on('exit', (code, signal) => {
      if (code === null && signal) return
      clearTimeout(timeout)
      rejectPromise(new Error(`Chrome exited before DevTools was ready: code=${code} signal=${signal}`))
    })
  })
}

function portFromBrowserWsUrl(wsUrl) {
  return new URL(wsUrl).port
}

async function createPageTarget(browserWsUrl) {
  const port = portFromBrowserWsUrl(browserWsUrl)
  const endpoint = `http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`
  let response = await fetch(endpoint, { method: 'PUT' })

  if (!response.ok) {
    response = await fetch(endpoint)
  }

  if (!response.ok) {
    throw new Error(`Failed to create Chrome target: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.ws = null
    this.nextId = 1
    this.pending = new Map()
    this.eventWaiters = new Map()
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl)

    await new Promise((resolvePromise, rejectPromise) => {
      this.ws.addEventListener('open', resolvePromise, { once: true })
      this.ws.addEventListener('error', rejectPromise, { once: true })
    })

    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)

      if (message.id && this.pending.has(message.id)) {
        const { resolve: resolvePending, reject, timer } = this.pending.get(message.id)
        clearTimeout(timer)
        this.pending.delete(message.id)

        if (message.error) {
          reject(new Error(`${message.error.message}: ${message.error.data || ''}`.trim()))
        } else {
          resolvePending(message.result || {})
        }
        return
      }

      if (message.method && this.eventWaiters.has(message.method)) {
        const waiters = this.eventWaiters.get(message.method)
        const waiter = waiters.shift()
        if (waiter) {
          clearTimeout(waiter.timer)
          waiter.resolve(message.params || {})
        }
      }
    })
  }

  send(method, params = {}, timeoutMs = 10000) {
    const id = this.nextId++
    const payload = JSON.stringify({ id, method, params })

    return new Promise((resolvePromise, rejectPromise) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        rejectPromise(new Error(`CDP command timed out: ${method}`))
      }, timeoutMs)

      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise, timer })
      this.ws.send(payload)
    })
  }

  waitForEvent(method, timeoutMs = 15000) {
    return new Promise((resolvePromise, rejectPromise) => {
      const timer = setTimeout(() => {
        const waiters = this.eventWaiters.get(method) || []
        this.eventWaiters.set(method, waiters.filter((waiter) => waiter.timer !== timer))
        rejectPromise(new Error(`Timed out waiting for CDP event: ${method}`))
      }, timeoutMs)

      const waiters = this.eventWaiters.get(method) || []
      waiters.push({ resolve: resolvePromise, timer })
      this.eventWaiters.set(method, waiters)
    })
  }

  close() {
    this.ws?.close()
  }
}

async function launchChrome() {
  const userDataDir = mkdtempSync(join(tmpdir(), 'lola-public-screenshots-'))
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-gpu',
    '--no-default-browser-check',
    '--no-first-run',
    '--remote-debugging-port=0',
    '--window-size=1440,1200',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], {
    stdio: ['ignore', 'ignore', 'pipe']
  })

  const browserWsUrl = await waitForChromeWebSocket(chrome)
  const pageTarget = await createPageTarget(browserWsUrl)
  const cdp = new CdpSession(pageTarget.webSocketDebuggerUrl)
  await cdp.connect()
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')

  return { chrome, cdp, userDataDir }
}

async function stopChrome({ chrome, cdp, userDataDir }) {
  cdp.close()

  if (!chrome.killed) {
    chrome.kill('SIGTERM')
  }

  await Promise.race([
    new Promise((resolvePromise) => chrome.once('exit', resolvePromise)),
    delay(2500)
  ])

  rmSync(userDataDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200
  })
}

async function setViewport(cdp, viewport) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile
  })

  await cdp.send('Emulation.setTouchEmulationEnabled', {
    enabled: viewport.mobile
  })
}

async function readPageState(cdp) {
  const result = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const doc = document.documentElement;
      const body = document.body;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
      const scrollHeight = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
      const offenders = Array.from(document.querySelectorAll('body *'))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const text = (element.innerText || element.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
          return {
            tag: element.tagName.toLowerCase(),
            className: String(element.className || '').slice(0, 90),
            text,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          };
        })
        .filter((item) => item.width > 0 && (item.left < -2 || item.right > viewportWidth + 2))
        .slice(0, 8);

      return {
        href: window.location.href,
        title: document.title,
        text: body ? body.innerText : '',
        readyState: document.readyState,
        viewportWidth,
        viewportHeight,
        scrollWidth,
        scrollHeight,
        hasHorizontalOverflow: scrollWidth > viewportWidth + 2,
        overflowOffenders: offenders
      };
    })()`,
    returnByValue: true
  })

  return result.result?.value || {}
}

function routeIsReady(state, target) {
  const text = state.text || ''
  const missingExpected = target.expectedText.filter((expected) => !normalizeText(text).includes(normalizeText(expected)))
  const loading = /Loading (workshops|workshop details|adult workshops|holiday workshops)/i.test(text)
  const failureMarkers = [
    'Failed to load',
    'Error Loading',
    'Workshop not found',
    'This site can\'t be reached',
    'ERR_CONNECTION',
    'Cannot GET'
  ].filter((marker) => normalizeText(text).includes(normalizeText(marker)))

  return {
    passed: missingExpected.length === 0 && !loading && failureMarkers.length === 0,
    missingExpected,
    loading,
    failureMarkers
  }
}

async function navigateAndWait(cdp, target) {
  const loadPromise = cdp.waitForEvent('Page.loadEventFired', 15000).catch(() => null)
  await cdp.send('Page.navigate', { url: publicUrl(target.path) })
  await loadPromise

  const startedAt = Date.now()
  let state = await readPageState(cdp)
  let readiness = routeIsReady(state, target)

  while (Date.now() - startedAt < renderTimeoutMs) {
    if (readiness.passed) break
    if (readiness.failureMarkers.length > 0) break

    await delay(350)
    state = await readPageState(cdp)
    readiness = routeIsReady(state, target)
  }

  return { state, readiness }
}

async function capturePng(cdp, screenshotPath) {
  const metrics = await cdp.send('Page.getLayoutMetrics')
  const contentSize = metrics.contentSize || {}
  const width = Math.ceil(contentSize.width || 1)
  const rawHeight = Math.ceil(contentSize.height || 1)
  const height = Math.max(1, Math.min(rawHeight, screenshotMaxHeight))

  const screenshot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
    clip: {
      x: 0,
      y: 0,
      width,
      height,
      scale: 1
    }
  }, 30000)

  writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'))

  return {
    width,
    capturedHeight: height,
    fullHeight: rawHeight,
    cropped: rawHeight > height
  }
}

async function captureTarget(cdp, target, viewport) {
  await setViewport(cdp, viewport)
  const { state, readiness } = await navigateAndWait(cdp, target)
  const filename = `${viewport.key}-${target.key}.png`
  const absolutePath = join(screenshotDir, filename)
  const imageMeta = await capturePng(cdp, absolutePath)

  return {
    target: target.label,
    path: target.path,
    category: target.category,
    viewport: viewport.label,
    viewportSize: `${viewport.width}x${viewport.height}`,
    screenshot: `docs/evidence/public-discovery-screenshots/${filename}`,
    absolutePath,
    finalUrl: state.href,
    passed: readiness.passed && !state.hasHorizontalOverflow,
    renderPassed: readiness.passed,
    missingExpected: readiness.missingExpected,
    failureMarkers: readiness.failureMarkers,
    hasHorizontalOverflow: state.hasHorizontalOverflow,
    overflowOffenders: state.overflowOffenders || [],
    documentSize: `${state.scrollWidth || imageMeta.width}x${state.scrollHeight || imageMeta.fullHeight}`,
    capturedSize: `${imageMeta.width}x${imageMeta.capturedHeight}`,
    cropped: imageMeta.cropped
  }
}

function writeManifest(results, targets) {
  const failed = results.filter((result) => !result.passed)
  const markdown = `# Public Discovery Responsive Screenshots

Status: current
Last updated: ${auditDate}
Parent workstream: [Public Discovery And Event Detail Flow](./public-discovery-event-detail-flow.md)
Source app: ${appUrl}

## Run Summary

| Check | Result |
|-------|--------|
| Public/discovery targets | ${targets.length} |
| Viewports per target | ${viewports.length} |
| Screenshots captured | ${results.length} |
| Passed layout checks | ${results.length - failed.length} |
| Failed layout checks | ${failed.length} |

## Screenshot Manifest

${formatTable(
  ['Result', 'Target', 'Viewport', 'Route', 'Document size', 'Captured size', 'Cropped', 'Screenshot', 'Failure'],
  results.map((result) => [
    result.passed ? 'passed' : 'review',
    result.target,
    `${result.viewport} ${result.viewportSize}`,
    result.path,
    result.documentSize,
    result.capturedSize,
    result.cropped ? 'yes' : 'no',
    `[${result.screenshot}](./evidence/public-discovery-screenshots/${result.screenshot.split('/').pop()})`,
    [
      ...result.failureMarkers,
      ...result.missingExpected.map((item) => `Missing expected text: ${item}`),
      result.hasHorizontalOverflow ? `Horizontal overflow: ${result.overflowOffenders.map((item) => `${item.tag} ${item.text || item.className}`).join('; ')}` : null
    ].filter(Boolean).join(' | ') || '-'
  ])
)}

## Targets

${formatTable(
  ['Target', 'Route', 'Expected text'],
  targets.map((target) => [target.label, target.path, target.expectedText.join(', ')])
)}
`

  writeFileSync(manifestPath, markdown, 'utf8')
}

function updateFlowEvidence() {
  if (!existsSync(flowEvidencePath)) return

  const text = readFileSync(flowEvidencePath, 'utf8')
  const section = `## Responsive Screenshot Checks

| Evidence item | Result |
| --- | --- |
| Screenshot manifest | [Public Discovery Responsive Screenshots](./public-discovery-responsive-screenshots.md) |
| Viewports | Desktop 1440x1200 and mobile 390x844 |
| Routes | /workshops, /adult-workshops, /half-term, /summer-holiday, plus standard, adult, and enquiry-only detail pages |
`

  const nextActionsHeading = '\n## Next Actions'
  const withoutOldSection = text.replace(/\n## Responsive Screenshot Checks\n\n[\s\S]*?(?=\n## Next Actions|\n$)/, '')
  const updated = withoutOldSection.includes(nextActionsHeading)
    ? withoutOldSection.replace(nextActionsHeading, `\n${section}${nextActionsHeading}`)
    : `${withoutOldSection.trim()}\n\n${section}\n`

  const withNextActions = updated.replace(
    /\n## Next Actions\n\n[\s\S]*$/,
    '\n## Next Actions\n\n1. Verify booking-state examples for bookable, enquiry-only, sold-out, and waitlist-enabled events.\n2. Confirm legacy workshop URL handling before moving to Event Cart And Checkout.\n'
  )

  writeFileSync(flowEvidencePath, withNextActions, 'utf8')
}

let chromeContext

try {
  mkdirSync(screenshotDir, { recursive: true })
  const events = await fetchLaunchEvents()
  const targets = buildTargets(events)

  chromeContext = await launchChrome()

  const results = []
  for (const target of targets) {
    for (const viewport of viewports) {
      const result = await captureTarget(chromeContext.cdp, target, viewport)
      results.push(result)
      console.log(`${result.passed ? 'PASS' : 'REVIEW'} ${viewport.key} ${target.path} -> ${result.screenshot}`)
    }
  }

  writeManifest(results, targets)
  updateFlowEvidence()

  const failed = results.filter((result) => !result.passed)
  console.log(JSON.stringify({
    manifestPath,
    screenshotDir,
    auditDate,
    appUrl,
    targets: targets.length,
    screenshots: results.length,
    failed: failed.length,
    failures: failed.map((result) => ({
      target: result.target,
      viewport: result.viewport,
      path: result.path,
      missingExpected: result.missingExpected,
      failureMarkers: result.failureMarkers,
      hasHorizontalOverflow: result.hasHorizontalOverflow
    }))
  }, null, 2))

  if (failed.length) {
    process.exitCode = 1
  }
} finally {
  if (chromeContext) {
    await stopChrome(chromeContext)
  }
}
