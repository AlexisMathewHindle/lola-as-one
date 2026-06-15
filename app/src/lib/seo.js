import { canonicalUrlForPath, shouldNoindexCurrentHost } from './site'

const SITE_NAME = 'Lola Creative Space'
const DEFAULT_TITLE = 'Art Workshops and Creative Events'
const DEFAULT_DESCRIPTION = 'Book art workshops, creative classes, holiday programmes and events at Lola Creative Space.'
const DEFAULT_IMAGE_PATH = '/img/images/about_02.png'

function resolveTitle(title) {
  const cleanTitle = String(title || DEFAULT_TITLE)
    .trim()
    .replace(/Lola As One/gi, SITE_NAME)

  if (!cleanTitle || cleanTitle === SITE_NAME) {
    return SITE_NAME
  }

  if (cleanTitle.includes(SITE_NAME)) {
    return cleanTitle
  }

  return `${cleanTitle} | ${SITE_NAME}`
}

function ensureMeta(attribute, key, content) {
  if (!content) return

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function ensureCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]')

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

function absoluteImageUrl(pathOrUrl, canonicalUrl) {
  const image = String(pathOrUrl || DEFAULT_IMAGE_PATH).trim()

  try {
    return new URL(image, canonicalUrl).toString()
  } catch {
    return new URL(DEFAULT_IMAGE_PATH, canonicalUrl).toString()
  }
}

export function setPageSeo(options = {}) {
  if (typeof document === 'undefined') return

  const canonicalUrl = options.canonicalUrl || canonicalUrlForPath(options.path || window.location.pathname)
  const title = resolveTitle(options.title)
  const description = String(options.description || DEFAULT_DESCRIPTION).trim()
  const robots = options.noindex || shouldNoindexCurrentHost() ? 'noindex, nofollow' : 'index, follow'
  const imageUrl = absoluteImageUrl(options.image, canonicalUrl)
  const type = options.type || 'website'

  document.title = title
  ensureMeta('name', 'description', description)
  ensureMeta('name', 'robots', robots)
  ensureCanonical(canonicalUrl)
  ensureMeta('property', 'og:site_name', SITE_NAME)
  ensureMeta('property', 'og:title', title)
  ensureMeta('property', 'og:description', description)
  ensureMeta('property', 'og:url', canonicalUrl)
  ensureMeta('property', 'og:type', type)
  ensureMeta('property', 'og:image', imageUrl)
  ensureMeta('name', 'twitter:card', 'summary_large_image')
  ensureMeta('name', 'twitter:title', title)
  ensureMeta('name', 'twitter:description', description)
  ensureMeta('name', 'twitter:image', imageUrl)
}
