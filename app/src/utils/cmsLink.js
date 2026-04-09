const PAGE_KEY_PATHS = {
  home: '/',
  workshops: '/workshops',
  'adult-workshops': '/adult-workshops',
  boxes: '/boxes',
  blog: '/blog',
  about: '/about',
  contact: '/contact',
  shop: '/shop'
}

export function resolveCmsLink(link) {
  if (!link) return '#'

  if (link.href) return link.href
  if (link.url) return link.url
  if (link.path) return link.path
  if (link.page_key && PAGE_KEY_PATHS[link.page_key]) return PAGE_KEY_PATHS[link.page_key]

  return '#'
}

export function isExternalCmsLink(link) {
  const href = resolveCmsLink(link)
  return /^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')
}
