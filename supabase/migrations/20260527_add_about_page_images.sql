-- ============================================================================
-- ABOUT PAGE CMS IMAGES
-- ============================================================================
-- Date: 2026-05-27
-- Purpose:
-- 1. Restore the legacy About page images in the CMS section config
-- 2. Preserve editable rich text content while adding media metadata
-- ============================================================================

UPDATE page_sections s
SET config_json = COALESCE(s.config_json, '{}'::jsonb) || jsonb_build_object(
  'hero_image', jsonb_build_object(
    'src', '/img/images/about_page_01.png',
    'alt', 'Lola founders outside the creative space',
    'position', 'center'
  ),
  'feature_image', jsonb_build_object(
    'src', '/img/images/about_02.png',
    'alt', 'Illustration of the Lola shopfront',
    'position', 'center'
  ),
  'closing_image', jsonb_build_object(
    'src', '/img/images/about_page_02.png',
    'alt', 'Painted paper houses and art materials on a workshop table',
    'position', 'center'
  )
)
FROM site_pages p
WHERE s.page_id = p.id
  AND p.page_key = 'about'
  AND s.section_key = 'about_content';
