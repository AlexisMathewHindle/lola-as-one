import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DEFAULT_SITE_URL = 'https://lolacreativespace.com'
const STATIC_PATHS = [
  '/',
  '/workshops',
  '/adult-workshops',
  '/half-term',
  '/summer-holiday',
  '/blog',
  '/about',
  '/contact',
  '/workshop-faqs',
  '/privacy-policy',
  '/terms-and-conditions'
]

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sitemapPath = path.join(appRoot, 'public', 'sitemap.xml')

loadEnvFile(path.join(appRoot, '.env'))
loadEnvFile(path.join(appRoot, '.env.local'))

const siteUrl = normalizeSiteUrl(
  process.env.SITEMAP_SITE_URL ||
  (process.env.VITE_APP_ENV === 'production' ? process.env.VITE_APP_URL : '') ||
  DEFAULT_SITE_URL
)
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const urls = new Set(STATIC_PATHS.map((urlPath) => canonicalUrl(urlPath)))

if (supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    const [workshopPaths, blogPaths] = await Promise.all([
      fetchWorkshopPaths(supabase),
      fetchBlogPaths(supabase)
    ])

    for (const urlPath of [...workshopPaths, ...blogPaths]) {
      urls.add(canonicalUrl(urlPath))
    }
  } catch (error) {
    console.warn(`[sitemap] Dynamic URL fetch failed; generated static sitemap only. ${error.message}`)
  }
} else {
  console.warn('[sitemap] Supabase env vars missing; generated static sitemap only.')
}

writeFileSync(sitemapPath, renderSitemap([...urls].sort()), 'utf8')
console.log(`[sitemap] Wrote ${urls.size} URLs to ${path.relative(appRoot, sitemapPath)}`)

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return

  const envSource = readFileSync(filePath, 'utf8')

  for (const line of envSource.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function normalizeSiteUrl(value) {
  try {
    const url = new URL(value || DEFAULT_SITE_URL)
    return `${url.protocol}//${url.host}`.replace(/\/+$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

function canonicalUrl(urlPath) {
  const normalizedPath = urlPath === '/' ? '/' : `/${String(urlPath || '').replace(/^\/+|\/+$/g, '')}`
  return `${siteUrl}${normalizedPath}`
}

function isPlaceholder(value) {
  return !value || /your_|example|placeholder/i.test(value)
}

async function fetchWorkshopPaths(supabase) {
  const today = new Date().toISOString().slice(0, 10)
  const rows = await fetchAllPages((from, to) => supabase
    .from('offering_events')
    .select(`
      id,
      event_date,
      offering:offerings!inner(slug, status, type, metadata, term_season, term_half),
      category:event_categories(slug, layout_key)
    `)
    .eq('offering.status', 'published')
    .eq('offering.type', 'event')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .range(from, to)
  )

  return [...new Set(rows
    .filter(usesWorkshopDetailPage)
    .map((row) => row.offering?.slug)
    .filter(Boolean)
    .map((slug) => `/workshops/${slug}`))]
}

function getWorkshopLayoutKey(row) {
  if (row?.offering?.term_season && row?.offering?.term_half) {
    return 'term_series'
  }

  if (row?.offering?.metadata?.term) {
    return 'term_series'
  }

  return row?.category?.layout_key || 'standard'
}

function usesWorkshopDetailPage(row) {
  const categorySlug = row?.category?.slug

  if (!categorySlug) {
    return true
  }

  const layoutKey = getWorkshopLayoutKey(row)
  return layoutKey === 'adult_workshop' || layoutKey === 'enquiry_only'
}

async function fetchBlogPaths(supabase) {
  const rows = await fetchAllPages((from, to) => supabase
    .from('blog_posts')
    .select('id, slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to)
  )

  return rows
    .map((row) => row.slug)
    .filter(Boolean)
    .map((slug) => `/blog/${slug}`)
}

async function fetchAllPages(queryFactory) {
  const pageSize = 1000
  const rows = []

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await queryFactory(from, to)

    if (error) throw error

    rows.push(...(data || []))

    if (!data || data.length < pageSize) {
      break
    }
  }

  return rows
}

function renderSitemap(absoluteUrls) {
  const urlsXml = absoluteUrls
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
