-- ============================================================================
-- CONTACT PAGE CMS CONTENT
-- ============================================================================
-- Date: 2026-05-26
-- Purpose:
-- 1. Make the Contact page editable through the existing information pages CMS
-- 2. Seed fallback editable copy only when the page has no uploaded sections
-- 3. Preserve any content that has already been uploaded
-- ============================================================================

INSERT INTO site_pages (
  page_key,
  title,
  slug,
  path,
  page_kind,
  template_key,
  route_name,
  status,
  show_in_navigation,
  seo_title,
  seo_description,
  published_at
)
VALUES (
  'contact',
  'Contact Lola As One',
  'contact',
  '/contact',
  'cms_page',
  'contact_page',
  NULL,
  'published',
  TRUE,
  'Contact Lola As One | Lola As One',
  'Have questions about workshops, art boxes, bookings, or creative projects? We would love to hear from you.',
  NOW()
)
ON CONFLICT (page_key) DO UPDATE SET
  slug = COALESCE(NULLIF(site_pages.slug, ''), EXCLUDED.slug),
  path = COALESCE(NULLIF(site_pages.path, ''), EXCLUDED.path),
  page_kind = CASE
    WHEN site_pages.page_kind IS NULL OR site_pages.page_kind = 'app_route' THEN EXCLUDED.page_kind
    ELSE site_pages.page_kind
  END,
  template_key = COALESCE(site_pages.template_key, EXCLUDED.template_key),
  route_name = NULL,
  status = CASE
    WHEN site_pages.status = 'archived' THEN EXCLUDED.status
    ELSE site_pages.status
  END,
  show_in_navigation = COALESCE(site_pages.show_in_navigation, EXCLUDED.show_in_navigation),
  title = COALESCE(NULLIF(site_pages.title, ''), EXCLUDED.title),
  seo_title = COALESCE(NULLIF(site_pages.seo_title, ''), EXCLUDED.seo_title),
  seo_description = COALESCE(NULLIF(site_pages.seo_description, ''), EXCLUDED.seo_description),
  published_at = COALESCE(site_pages.published_at, EXCLUDED.published_at);

INSERT INTO page_sections (
  page_id,
  section_key,
  section_type,
  sort_order,
  is_enabled,
  config_json
)
SELECT
  p.id,
  'contact_content',
  'rich_text',
  10,
  TRUE,
  jsonb_build_object(
    'title', 'Contact Information',
    'body_html', $$
      <p>We're here to help. Send us a message using the form, email the studio directly, or use the details below to find us.</p>
      <p>For booking changes, please include the workshop name, date, and the booking email address so the team can help quickly.</p>
    $$
  )
FROM site_pages p
WHERE p.page_key = 'contact'
  AND NOT EXISTS (
    SELECT 1
    FROM page_sections existing
    WHERE existing.page_id = p.id
  )
ON CONFLICT (page_id, section_key) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
