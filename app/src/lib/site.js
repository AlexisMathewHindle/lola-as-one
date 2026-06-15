const DEFAULT_SITE_URL = 'https://lolacreativespace.com'

function normalizeSiteUrl(value) {
  const candidate = String(value || '').trim().replace(/\/+$/, '')

  if (!candidate) return ''

  try {
    const url = new URL(candidate)
    return `${url.protocol}//${url.host}`
  } catch {
    return ''
  }
}

export const siteUrl = normalizeSiteUrl(import.meta.env.VITE_APP_URL) || DEFAULT_SITE_URL
export const appEnvironment = String(import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development').toLowerCase()
export const isProductionEnvironment = appEnvironment === 'production'

export function canonicalUrlForPath(path = '/') {
  const normalizedPath = String(path || '/')
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
  return `${siteUrl}${cleanPath}`
}

export function shouldNoindexCurrentHost() {
  if (!isProductionEnvironment) return true
  if (typeof window === 'undefined') return false

  return window.location.origin !== siteUrl
}

