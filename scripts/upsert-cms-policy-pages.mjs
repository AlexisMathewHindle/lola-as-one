#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const dryRun = process.env.APPLY_CMS_POLICY_PAGES !== 'true'

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
  throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const normalizedUrl = supabaseUrl.replace(/\/$/, '')

async function request(path, options = {}) {
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: 'application/json',
    ...options.headers
  }

  const response = await fetch(`${normalizedUrl}${path}`, {
    ...options,
    headers
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

const pages = [
  {
    page_key: 'workshop-faqs',
    title: 'Workshop FAQs',
    slug: 'workshop-faqs',
    path: '/workshop-faqs',
    page_kind: 'cms_page',
    template_key: 'info_page',
    route_name: null,
    status: 'published',
    show_in_navigation: true,
    seo_title: 'Workshop FAQs | Lola As One',
    seo_description: 'Useful details about attending, changing, and preparing for LoLA art workshops.',
    published_at: new Date().toISOString()
  },
  {
    page_key: 'privacy-policy',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    path: '/privacy-policy',
    page_kind: 'cms_page',
    template_key: 'info_page',
    route_name: null,
    status: 'published',
    show_in_navigation: true,
    seo_title: 'Privacy Policy | Lola As One',
    seo_description: 'How Lola As One collects, uses, stores, and protects customer information.',
    published_at: new Date().toISOString()
  },
  {
    page_key: 'terms-and-conditions',
    title: 'Terms and Conditions',
    slug: 'terms-and-conditions',
    path: '/terms-and-conditions',
    page_kind: 'cms_page',
    template_key: 'info_page',
    route_name: null,
    status: 'published',
    show_in_navigation: true,
    seo_title: 'Terms and Conditions | Lola As One',
    seo_description: 'Booking, payment, cancellation, refund, attendance, and website terms for Lola As One customers.',
    published_at: new Date().toISOString()
  }
]

const sectionByPageKey = {
  'workshop-faqs': {
    section_key: 'workshop_faqs_content',
    section_type: 'rich_text',
    sort_order: 10,
    is_enabled: true,
    config_json: {
      title: 'Workshop FAQs',
      body_html: `
        <h2>How long does a workshop last?</h2>
        <p>The LoLA art workshops generally last 1 hour unless specified otherwise. Please arrive before the workshop to allow your child to settle into the space.</p>
        <h2>What to bring?</h2>
        <p>We provide all art materials and lots of creative fun, but do dress for mess. There will be aprons for those who would like them. Please note that you will be taking the artwork home with you after the session.</p>
        <h2>Where can I wait for my child?</h2>
        <p>Parents are kindly requested to leave the workshop area during the class to minimise distraction. Please relax and enjoy a drink and a snack in the LoLA cafe.</p>
        <h2>What if I need to change my booking, cancel, or my child is unwell?</h2>
        <p>Our workshop requires a 48-hour cancellation notice to ensure a full refund or rescheduling. Cancellations made less than 48 hours before the scheduled workshop will not be eligible for a refund. This policy allows us to manage resources effectively and offer spots to other participants. Please note that if your child does not attend due to illness, these rules still apply.</p>
        <p>Changes to bookings can be made by emailing the team at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
        <h2>Photography</h2>
        <p>We like to take photographs of the LoLA studio and all the wonderful artwork the children create, however we will avoid taking photos of faces. These photos can be used on social media or our website. If you would prefer your child not to be photographed at all, please let us know by emailing us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
        <h2>Allergies and medication</h2>
        <p>Because the LoLA space is both a cafe and workshop space, please make us aware of any allergies or ask staff for more details on what we use in our food. Please note that allergies are not catered for.</p>
        <p>If your child takes any medication that we need to be aware of, please immediately alert a member of staff or email us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
        <p>We assume that by booking this session you have parental responsibility for the children booked. Please inform us if another guardian will be attending the session or if guardianship will change before the session starts. Please read our <a href="/privacy-policy">data protection information</a>.</p>
        <h2>Still have a question?</h2>
        <p>Please do not hesitate to email us if you have any questions.</p>
        <p>With kind wishes,<br>The LoLA team</p>
      `.trim()
    }
  },
  'privacy-policy': {
    section_key: 'privacy_policy_content',
    section_type: 'rich_text',
    sort_order: 10,
    is_enabled: true,
    config_json: {
      title: 'Privacy Policy',
      body_html: `
        <h2>Information we collect</h2>
        <p>We collect the information needed to run bookings, orders, enquiries, customer support, newsletters, and account-related services. This can include customer names, attendee details, contact details, order history, booking notes, payment status, and communication preferences.</p>
        <h2>How we use information</h2>
        <p>We use customer information to process bookings and orders, send service emails, manage attendance and capacity, respond to enquiries, improve the website, and meet legal or operational obligations.</p>
        <h2>Payments</h2>
        <p>Payments are processed by Stripe. Lola As One does not store full payment card details.</p>
        <h2>Sharing information</h2>
        <p>We only share information with service providers where needed to operate the platform, complete a customer request, or comply with a legal obligation.</p>
        <h2>Your choices</h2>
        <p>You can contact the studio to ask about personal information held for bookings, orders, enquiries, or marketing preferences.</p>
      `.trim()
    }
  },
  'terms-and-conditions': {
    section_key: 'terms_content',
    section_type: 'rich_text',
    sort_order: 10,
    is_enabled: true,
    config_json: {
      title: 'Terms and Conditions',
      body_html: `
        <h2>Bookings</h2>
        <p>Workshop and event bookings are subject to availability. A place is confirmed when checkout has completed successfully and the booking confirmation has been issued.</p>
        <h2>Payments</h2>
        <p>Online payments are processed securely by Stripe. Prices shown during checkout are the prices payable for the selected booking or order.</p>
        <h2>Cancellations and refunds</h2>
        <p>Cancellation and refund terms may vary by event type. The policy shown in the booking journey applies to the selected event. Please contact the studio promptly if you need to change or cancel a booking.</p>
        <h2>Attendance</h2>
        <p>Customers are responsible for providing accurate attendee details and arriving at the published date, time, and location. The studio may contact customers if attendee information is incomplete.</p>
        <h2>Event changes</h2>
        <p>If an event needs to be changed or cancelled by the studio, customers will be contacted using the details provided at checkout.</p>
        <h2>Website content</h2>
        <p>Website content, prices, dates, and availability can change. Confirm the final details shown during checkout before completing payment.</p>
      `.trim()
    }
  }
}

const footerItems = [
  {
    label: 'Workshop FAQs',
    page_key: 'workshop-faqs',
    sort_order: 30,
    matchLabels: ['FAQs', 'FAQ', 'Workshop FAQs'],
    matchPageKeys: ['faqs', 'workshop-faqs']
  },
  { label: 'Privacy Policy', page_key: 'privacy-policy', sort_order: 40 },
  { label: 'Terms and Conditions', page_key: 'terms-and-conditions', sort_order: 50 }
]

const managedPageKeys = ['workshop-faqs', 'faqs', 'privacy-policy', 'terms-and-conditions']

if (dryRun) {
  console.log(JSON.stringify({
    mode: 'dry-run',
    message: 'Set APPLY_CMS_POLICY_PAGES=true to write these records.',
    pages: pages.map((page) => ({ page_key: page.page_key, path: page.path, status: page.status })),
    sections: Object.entries(sectionByPageKey).map(([page_key, section]) => ({
      page_key,
      section_key: section.section_key
    })),
    footerItems
  }, null, 2))
} else {
  const upsertedPages = await request('/rest/v1/site_pages?on_conflict=page_key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(pages)
  })

  const pageRows = await request(`/rest/v1/site_pages?page_key=in.(${managedPageKeys.join(',')})&select=id,page_key,path,status,title`)
  const pageByKey = new Map(pageRows.map((page) => [page.page_key, page]))

  const sections = pages.map((page) => ({
    page_id: pageByKey.get(page.page_key).id,
    ...sectionByPageKey[page.page_key]
  }))

  const upsertedSections = await request('/rest/v1/page_sections?on_conflict=page_id,section_key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(sections)
  })

  const [footerMenu] = await request('/rest/v1/site_menus?menu_key=eq.footer_secondary&select=id,menu_key')
  if (!footerMenu) {
    throw new Error('Could not find footer_secondary menu')
  }

  const existingMenuItems = await request(`/rest/v1/site_menu_items?menu_id=eq.${footerMenu.id}&select=id,label,page_id,sort_order,is_enabled`)
  const writtenFooterItems = []

  for (const item of footerItems) {
    const page = pageByKey.get(item.page_key)
    const matchLabels = item.matchLabels || [item.label]
    const matchPageIds = (item.matchPageKeys || [item.page_key])
      .map((pageKey) => pageByKey.get(pageKey)?.id)
      .filter(Boolean)

    const existing = existingMenuItems.find((row) =>
      matchPageIds.includes(row.page_id) || matchLabels.includes(row.label)
    )
    const payload = {
      menu_id: footerMenu.id,
      label: item.label,
      item_type: 'page',
      page_id: page.id,
      url: null,
      open_in_new_tab: false,
      sort_order: item.sort_order,
      is_enabled: true
    }

    if (existing) {
      const [updated] = await request(`/rest/v1/site_menu_items?id=eq.${existing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(payload)
      })
      writtenFooterItems.push(updated)
    } else {
      const [inserted] = await request('/rest/v1/site_menu_items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(payload)
      })
      writtenFooterItems.push(inserted)
    }
  }

  const legacyFaqPage = pageByKey.get('faqs')
  if (legacyFaqPage) {
    await request('/rest/v1/site_pages?page_key=eq.faqs', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        status: 'archived',
        show_in_navigation: false
      })
    })
  }

  console.log(JSON.stringify({
    mode: 'applied',
    project: normalizedUrl,
    pages: upsertedPages.map((page) => ({
      page_key: page.page_key,
      path: page.path,
      status: page.status
    })),
    sections: upsertedSections.map((section) => ({
      page_id: section.page_id,
      section_key: section.section_key,
      is_enabled: section.is_enabled
    })),
    footerItems: writtenFooterItems.map((item) => ({
      label: item.label,
      sort_order: item.sort_order,
      is_enabled: item.is_enabled
    }))
  }, null, 2))
}
