import { supabase } from './supabase'

const PUBLIC_PAGE_FIELDS = 'id, page_key, title, slug, path, page_kind, template_key, route_name, status, show_in_navigation, seo_title, seo_description, published_at'
const ADMIN_PAGE_FIELDS = 'id, page_key, title, slug, path, page_kind, template_key, route_name, status, show_in_navigation, seo_title, seo_description, published_at'
const ADMIN_SECTION_FIELDS = 'id, page_id, section_key, section_type, sort_order, is_enabled, config_json, created_by, updated_by, created_at, updated_at'
const ADMIN_SETTING_FIELDS = 'id, setting_key, setting_group, label, value_json, is_public, sort_order, description, created_by, updated_by, created_at, updated_at'

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]'

const cloneValue = (value) => {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

const mergeByObjectIdOrIndex = (existingItems, nextItems) => {
  const existingById = new Map(
    existingItems
      .filter(item => isPlainObject(item) && item.id)
      .map(item => [item.id, item])
  )

  return nextItems.map((item, index) => {
    if (!isPlainObject(item)) return cloneValue(item)

    const existingItem = item.id
      ? existingById.get(item.id)
      : existingItems[index]

    return mergeJsonPreservingExisting(existingItem, item)
  })
}

const mergeJsonPreservingExisting = (existingValue, nextValue) => {
  if (nextValue === undefined) return cloneValue(existingValue)

  if (Array.isArray(nextValue)) {
    if (!Array.isArray(existingValue)) return cloneValue(nextValue)
    return mergeByObjectIdOrIndex(existingValue, nextValue)
  }

  if (isPlainObject(nextValue)) {
    const merged = isPlainObject(existingValue) ? cloneValue(existingValue) : {}

    Object.entries(nextValue).forEach(([key, value]) => {
      if (value === undefined) return
      merged[key] = mergeJsonPreservingExisting(merged[key], value)
    })

    return merged
  }

  return cloneValue(nextValue)
}

const stripUndefinedFields = (record) =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  )

/**
 * Fetch a published page by its stable page key.
 */
export async function getPageByKey(pageKey) {
  const { data, error } = await supabase
    .from('site_pages')
    .select(PUBLIC_PAGE_FIELDS)
    .eq('page_key', pageKey)
    .eq('status', 'published')
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch a published page by its public path.
 */
export async function getPageByPath(path) {
  const { data, error } = await supabase
    .from('site_pages')
    .select(PUBLIC_PAGE_FIELDS)
    .eq('path', path)
    .eq('status', 'published')
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch enabled sections for a given page.
 */
export async function getPageSections(pageId) {
  const { data, error } = await supabase
    .from('page_sections')
    .select('id, page_id, section_key, section_type, sort_order, config_json')
    .eq('page_id', pageId)
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Convenience helper for the common "lookup page, then its sections" flow.
 */
export async function getPageWithSectionsByKey(pageKey) {
  const page = await getPageByKey(pageKey)
  const sections = await getPageSections(page.id)

  return {
    ...page,
    sections
  }
}

/**
 * Fetch a page and all of its sections for admin management, including disabled sections.
 */
export async function getAdminPageWithSectionsByKey(pageKey) {
  const { data: page, error: pageError } = await supabase
    .from('site_pages')
    .select(ADMIN_PAGE_FIELDS)
    .eq('page_key', pageKey)
    .single()

  if (pageError) throw pageError

  const { data: sections, error: sectionsError } = await supabase
    .from('page_sections')
    .select(ADMIN_SECTION_FIELDS)
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true })

  if (sectionsError) throw sectionsError

  return {
    ...page,
    sections: sections || []
  }
}

/**
 * Create or update page sections using the unique page_id + section_key constraint.
 */
export async function upsertPageSections(sections) {
  if (!sections.length) return []

  const pageIds = [...new Set(sections.map(section => section.page_id).filter(Boolean))]
  const sectionKeys = [...new Set(sections.map(section => section.section_key).filter(Boolean))]
  let existingSectionsByKey = new Map()

  if (pageIds.length > 0 && sectionKeys.length > 0) {
    const { data: existingSections, error: existingError } = await supabase
      .from('page_sections')
      .select(ADMIN_SECTION_FIELDS)
      .in('page_id', pageIds)
      .in('section_key', sectionKeys)

    if (existingError) throw existingError

    existingSectionsByKey = new Map(
      (existingSections || []).map(section => [`${section.page_id}:${section.section_key}`, section])
    )
  }

  const mergedSections = sections.map(section => {
    const existingSection = existingSectionsByKey.get(`${section.page_id}:${section.section_key}`)

    if (!existingSection) {
      return stripUndefinedFields(section)
    }

    return stripUndefinedFields({
      ...section,
      id: existingSection.id,
      config_json: mergeJsonPreservingExisting(existingSection.config_json || {}, section.config_json || {}),
      created_by: existingSection.created_by || section.created_by
    })
  })

  const { data, error } = await supabase
    .from('page_sections')
    .upsert(mergedSections, { onConflict: 'page_id,section_key' })
    .select(ADMIN_SECTION_FIELDS)

  if (error) throw error
  return data || []
}

/**
 * Fetch public site settings.
 */
export async function getPublicSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('setting_key, setting_group, label, value_json, sort_order')
    .eq('is_public', true)
    .order('setting_group', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Convert public site settings into a key/value map for easy consumption.
 */
export async function getPublicSettingsMap() {
  const settings = await getPublicSettings()

  return settings.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.value_json
    return acc
  }, {})
}

/**
 * Fetch all site settings for admin management.
 */
export async function getAllSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select(ADMIN_SETTING_FIELDS)
    .order('setting_group', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Upsert a batch of site settings by setting_key.
 */
export async function upsertSiteSettings(settings) {
  if (!settings.length) return []

  const settingKeys = [...new Set(settings.map(setting => setting.setting_key).filter(Boolean))]
  let existingSettingsByKey = new Map()

  if (settingKeys.length > 0) {
    const { data: existingSettings, error: existingError } = await supabase
      .from('site_settings')
      .select(ADMIN_SETTING_FIELDS)
      .in('setting_key', settingKeys)

    if (existingError) throw existingError

    existingSettingsByKey = new Map(
      (existingSettings || []).map(setting => [setting.setting_key, setting])
    )
  }

  const mergedSettings = settings.map(setting => {
    const existingSetting = existingSettingsByKey.get(setting.setting_key)

    if (!existingSetting) {
      return stripUndefinedFields(setting)
    }

    return stripUndefinedFields({
      ...setting,
      id: existingSetting.id,
      value_json: mergeJsonPreservingExisting(existingSetting.value_json || {}, setting.value_json || {}),
      created_by: existingSetting.created_by || setting.created_by
    })
  })

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(mergedSettings, { onConflict: 'setting_key' })
    .select(ADMIN_SETTING_FIELDS)

  if (error) throw error
  return data || []
}

/**
 * Fetch all site menus for admin management.
 */
export async function getAllSiteMenus() {
  const { data, error } = await supabase
    .from('site_menus')
    .select('id, menu_key, name, description, is_enabled')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch all published pages that can be linked from menu items.
 */
export async function getPublishedSitePages() {
  const { data, error } = await supabase
    .from('site_pages')
    .select('id, page_key, title, path, page_kind, route_name, status, show_in_navigation')
    .eq('status', 'published')
    .order('title', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch a menu with all of its items for admin use.
 */
export async function getAdminMenuByKey(menuKey) {
  const { data: menu, error: menuError } = await supabase
    .from('site_menus')
    .select('id, menu_key, name, description, is_enabled')
    .eq('menu_key', menuKey)
    .single()

  if (menuError) throw menuError

  const { data: items, error: itemsError } = await supabase
    .from('site_menu_items')
    .select('id, menu_id, label, item_type, page_id, url, open_in_new_tab, sort_order, is_enabled, created_at, updated_at')
    .eq('menu_id', menu.id)
    .order('sort_order', { ascending: true })

  if (itemsError) throw itemsError

  const pageIds = [...new Set(
    (items || [])
      .filter(item => item.page_id)
      .map(item => item.page_id)
  )]

  let pagesById = new Map()

  if (pageIds.length > 0) {
    const { data: pages, error: pagesError } = await supabase
      .from('site_pages')
      .select('id, page_key, title, path, page_kind, route_name, status, show_in_navigation')
      .in('id', pageIds)

    if (pagesError) throw pagesError

    pagesById = new Map((pages || []).map(page => [page.id, page]))
  }

  return {
    ...menu,
    items: (items || []).map(item => ({
      ...item,
      page: item.page_id ? pagesById.get(item.page_id) || null : null
    }))
  }
}

/**
 * Create or update a single menu item.
 */
export async function saveMenuItem(item) {
  if (item.id) {
    const { id, ...updates } = stripUndefinedFields(item)

    const { data, error } = await supabase
      .from('site_menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('site_menu_items')
    .insert(stripUndefinedFields(item))
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a menu item by id.
 */
export async function deleteMenuItem(id) {
  const { error } = await supabase
    .from('site_menu_items')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Fetch a public menu and hydrate linked page records in a second pass.
 * This avoids depending on nested relation syntax in the public client.
 */
export async function getMenuByKey(menuKey) {
  const { data: menu, error: menuError } = await supabase
    .from('site_menus')
    .select('id, menu_key, name')
    .eq('menu_key', menuKey)
    .eq('is_enabled', true)
    .single()

  if (menuError) throw menuError

  const { data: menuItems, error: itemsError } = await supabase
    .from('site_menu_items')
    .select('id, label, item_type, page_id, url, open_in_new_tab, sort_order')
    .eq('menu_id', menu.id)
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true })

  if (itemsError) throw itemsError

  const pageIds = [...new Set(
    (menuItems || [])
      .filter(item => item.item_type === 'page' && item.page_id)
      .map(item => item.page_id)
  )]

  let pagesById = new Map()

  if (pageIds.length > 0) {
    const { data: pages, error: pagesError } = await supabase
      .from('site_pages')
      .select('id, page_key, title, path, route_name, page_kind')
      .in('id', pageIds)
      .eq('status', 'published')

    if (pagesError) throw pagesError

    pagesById = new Map((pages || []).map(page => [page.id, page]))
  }

  const items = (menuItems || [])
    .map(item => {
      if (item.item_type === 'external') {
        return {
          id: item.id,
          label: item.label,
          itemType: item.item_type,
          href: item.url,
          openInNewTab: item.open_in_new_tab,
          sortOrder: item.sort_order,
          pageKey: null
        }
      }

      const page = pagesById.get(item.page_id)
      if (!page) return null

      return {
        id: item.id,
        label: item.label,
        itemType: item.item_type,
        href: page.path,
        openInNewTab: false,
        sortOrder: item.sort_order,
        pageKey: page.page_key,
        routeName: page.route_name,
        pageKind: page.page_kind
      }
    })
    .filter(Boolean)

  return {
    ...menu,
    items
  }
}
