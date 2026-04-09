-- ============================================================================
-- LOLA AS ONE CMS FOUNDATION
-- ============================================================================
-- Date: 2026-04-09
-- Purpose:
-- 1. Create the first CMS foundation tables for pages, sections, menus, and settings
-- 2. Seed the current public information architecture into the page registry
-- 3. Seed initial homepage section data so the homepage can move toward managed content
-- 4. Add RLS for public-read/admin-write content management
-- 5. Create a public storage bucket for CMS-managed site images
-- ============================================================================

-- ============================================================================
-- 0. HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_row_updated_at IS 'Sets updated_at to NOW() before row updates';

-- ============================================================================
-- 1. SITE PAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT,
  path TEXT NOT NULL,
  page_kind TEXT NOT NULL CHECK (page_kind IN ('cms_page', 'app_route')),
  template_key TEXT,
  route_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  show_in_navigation BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_pages_path_format_check CHECK (path ~ '^/'),
  CONSTRAINT site_pages_slug_format_check CHECK (
    slug IS NULL OR slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT site_pages_template_requirement_check CHECK (
    page_kind <> 'cms_page' OR template_key IS NOT NULL
  ),
  CONSTRAINT site_pages_route_requirement_check CHECK (
    (page_kind = 'cms_page' AND route_name IS NULL)
    OR (page_kind = 'app_route' AND route_name IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_pages_path_unique
  ON site_pages (LOWER(path));

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_pages_slug_unique
  ON site_pages (LOWER(slug))
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_site_pages_status
  ON site_pages (status);

CREATE INDEX IF NOT EXISTS idx_site_pages_navigation
  ON site_pages (show_in_navigation, status);

COMMENT ON TABLE site_pages IS 'Registry of public-facing pages, including both CMS pages and existing app routes';
COMMENT ON COLUMN site_pages.page_key IS 'Stable internal key, for example home or workshops';
COMMENT ON COLUMN site_pages.path IS 'Canonical public path, for example / or /workshops';
COMMENT ON COLUMN site_pages.page_kind IS 'cms_page is rendered from CMS sections, app_route points at an existing Vue route';
COMMENT ON COLUMN site_pages.show_in_navigation IS 'Page-level gate for whether linked menu items should appear publicly';

DROP TRIGGER IF EXISTS trg_site_pages_set_updated_at ON site_pages;

CREATE TRIGGER trg_site_pages_set_updated_at
  BEFORE UPDATE ON site_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

-- ============================================================================
-- 2. PAGE SECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES site_pages(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  section_type TEXT NOT NULL CHECK (
    section_type IN (
      'hero_banner',
      'rich_text',
      'schedule_grid',
      'featured_offerings',
      'feature_split',
      'testimonial_strip',
      'newsletter_cta',
      'image_gallery'
    )
  ),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT page_sections_unique_key_per_page UNIQUE (page_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_page_sections_page_sort
  ON page_sections (page_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_page_sections_enabled
  ON page_sections (page_id, is_enabled);

COMMENT ON TABLE page_sections IS 'Typed content sections attached to CMS-managed pages';
COMMENT ON COLUMN page_sections.section_key IS 'Stable internal key per page, for example home_hero';
COMMENT ON COLUMN page_sections.config_json IS 'Section configuration payload rendered by the frontend';

DROP TRIGGER IF EXISTS trg_page_sections_set_updated_at ON page_sections;

CREATE TRIGGER trg_page_sections_set_updated_at
  BEFORE UPDATE ON page_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

-- ============================================================================
-- 3. MENUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE site_menus IS 'Named site menus such as header_primary and footer_primary';

DROP TRIGGER IF EXISTS trg_site_menus_set_updated_at ON site_menus;

CREATE TRIGGER trg_site_menus_set_updated_at
  BEFORE UPDATE ON site_menus
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

CREATE TABLE IF NOT EXISTS site_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES site_menus(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('page', 'external')),
  page_id UUID REFERENCES site_pages(id) ON DELETE CASCADE,
  url TEXT,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_menu_items_link_target_check CHECK (
    (item_type = 'page' AND page_id IS NOT NULL AND url IS NULL)
    OR (item_type = 'external' AND page_id IS NULL AND url IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_site_menu_items_menu_sort
  ON site_menu_items (menu_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_site_menu_items_enabled
  ON site_menu_items (menu_id, is_enabled);

COMMENT ON TABLE site_menu_items IS 'Menu entries linked either to a site page or an external URL';

DROP TRIGGER IF EXISTS trg_site_menu_items_set_updated_at ON site_menu_items;

CREATE TRIGGER trg_site_menu_items_set_updated_at
  BEFORE UPDATE ON site_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

-- ============================================================================
-- 4. SITE SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_group TEXT NOT NULL DEFAULT 'general',
  label TEXT NOT NULL,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_group_sort
  ON site_settings (setting_group, sort_order);

COMMENT ON TABLE site_settings IS 'Key/value site settings for branding, footer content, and other global presentation data';
COMMENT ON COLUMN site_settings.value_json IS 'Flexible JSON payload used by the admin app and public site';

DROP TRIGGER IF EXISTS trg_site_settings_set_updated_at ON site_settings;

CREATE TRIGGER trg_site_settings_set_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- site_pages
DROP POLICY IF EXISTS "Public can view published site pages" ON site_pages;
DROP POLICY IF EXISTS "Admins can view all site pages" ON site_pages;
DROP POLICY IF EXISTS "Admins can insert site pages" ON site_pages;
DROP POLICY IF EXISTS "Admins can update site pages" ON site_pages;
DROP POLICY IF EXISTS "Admins can delete site pages" ON site_pages;

CREATE POLICY "Public can view published site pages"
ON site_pages FOR SELECT
TO public
USING (status = 'published');

CREATE POLICY "Admins can view all site pages"
ON site_pages FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert site pages"
ON site_pages FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update site pages"
ON site_pages FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete site pages"
ON site_pages FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- page_sections
DROP POLICY IF EXISTS "Public can view enabled sections for published pages" ON page_sections;
DROP POLICY IF EXISTS "Admins can view all page sections" ON page_sections;
DROP POLICY IF EXISTS "Admins can insert page sections" ON page_sections;
DROP POLICY IF EXISTS "Admins can update page sections" ON page_sections;
DROP POLICY IF EXISTS "Admins can delete page sections" ON page_sections;

CREATE POLICY "Public can view enabled sections for published pages"
ON page_sections FOR SELECT
TO public
USING (
  is_enabled = TRUE
  AND EXISTS (
    SELECT 1
    FROM site_pages
    WHERE site_pages.id = page_sections.page_id
      AND site_pages.status = 'published'
  )
);

CREATE POLICY "Admins can view all page sections"
ON page_sections FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert page sections"
ON page_sections FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update page sections"
ON page_sections FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete page sections"
ON page_sections FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- site_menus
DROP POLICY IF EXISTS "Public can view enabled site menus" ON site_menus;
DROP POLICY IF EXISTS "Admins can view all site menus" ON site_menus;
DROP POLICY IF EXISTS "Admins can insert site menus" ON site_menus;
DROP POLICY IF EXISTS "Admins can update site menus" ON site_menus;
DROP POLICY IF EXISTS "Admins can delete site menus" ON site_menus;

CREATE POLICY "Public can view enabled site menus"
ON site_menus FOR SELECT
TO public
USING (is_enabled = TRUE);

CREATE POLICY "Admins can view all site menus"
ON site_menus FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert site menus"
ON site_menus FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update site menus"
ON site_menus FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete site menus"
ON site_menus FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- site_menu_items
DROP POLICY IF EXISTS "Public can view enabled menu items for visible pages" ON site_menu_items;
DROP POLICY IF EXISTS "Admins can view all site menu items" ON site_menu_items;
DROP POLICY IF EXISTS "Admins can insert site menu items" ON site_menu_items;
DROP POLICY IF EXISTS "Admins can update site menu items" ON site_menu_items;
DROP POLICY IF EXISTS "Admins can delete site menu items" ON site_menu_items;

CREATE POLICY "Public can view enabled menu items for visible pages"
ON site_menu_items FOR SELECT
TO public
USING (
  is_enabled = TRUE
  AND EXISTS (
    SELECT 1
    FROM site_menus
    WHERE site_menus.id = site_menu_items.menu_id
      AND site_menus.is_enabled = TRUE
  )
  AND (
    item_type = 'external'
    OR EXISTS (
      SELECT 1
      FROM site_pages
      WHERE site_pages.id = site_menu_items.page_id
        AND site_pages.status = 'published'
        AND site_pages.show_in_navigation = TRUE
    )
  )
);

CREATE POLICY "Admins can view all site menu items"
ON site_menu_items FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert site menu items"
ON site_menu_items FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update site menu items"
ON site_menu_items FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete site menu items"
ON site_menu_items FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- site_settings
DROP POLICY IF EXISTS "Public can view public site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can view all site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can delete site settings" ON site_settings;

CREATE POLICY "Public can view public site settings"
ON site_settings FOR SELECT
TO public
USING (is_public = TRUE);

CREATE POLICY "Admins can view all site settings"
ON site_settings FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert site settings"
ON site_settings FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update site settings"
ON site_settings FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete site settings"
ON site_settings FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================================
-- 6. STORAGE BUCKET FOR CMS IMAGES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS is already enabled by default on storage.objects in Supabase.
-- Recent platform permission changes no longer allow altering tables in the
-- storage schema from project SQL, so do not run ALTER TABLE here.

DROP POLICY IF EXISTS "Public read access for site images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload site images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete site images" ON storage.objects;

CREATE POLICY "Public read access for site images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-images');

CREATE POLICY "Admins can upload site images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-images'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update site images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-images'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete site images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-images'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- 7. SEED PAGE REGISTRY
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
VALUES
  (
    'home',
    'Home',
    NULL,
    '/',
    'cms_page',
    'home',
    NULL,
    'published',
    FALSE,
    'Lola As One',
    'Where creativity meets community. Discover hands-on workshops, curated art boxes, and creative inspiration.',
    NOW()
  ),
  (
    'workshops',
    'Workshops',
    'workshops',
    '/workshops',
    'app_route',
    NULL,
    'Workshops',
    'published',
    TRUE,
    'Workshops | Lola As One',
    'Discover upcoming creative workshops and classes.',
    NOW()
  ),
  (
    'adult-workshops',
    'Adult Workshops',
    'adult-workshops',
    '/adult-workshops',
    'app_route',
    NULL,
    'AdultWorkshops',
    'published',
    TRUE,
    'Adult Workshops | Lola As One',
    'Explore creative workshops designed for adults.',
    NOW()
  ),
  (
    'boxes',
    'Boxes',
    'boxes',
    '/boxes',
    'app_route',
    NULL,
    'Boxes',
    'published',
    TRUE,
    'Art Boxes | Lola As One',
    'Shop curated art boxes and creative projects.',
    NOW()
  ),
  (
    'blog',
    'Blog',
    'blog',
    '/blog',
    'app_route',
    NULL,
    'Blog',
    'published',
    TRUE,
    'Blog | Lola As One',
    'Creative inspiration, news, and articles from Lola As One.',
    NOW()
  ),
  (
    'about',
    'About',
    'about',
    '/about',
    'app_route',
    NULL,
    'About',
    'published',
    TRUE,
    'About | Lola As One',
    'Learn more about Lola As One and the creative community behind it.',
    NOW()
  ),
  (
    'contact',
    'Contact',
    'contact',
    '/contact',
    'app_route',
    NULL,
    'Contact',
    'published',
    TRUE,
    'Contact | Lola As One',
    'Get in touch with the Lola As One team.',
    NOW()
  )
ON CONFLICT (page_key) DO NOTHING;

-- ============================================================================
-- 8. SEED MENUS
-- ============================================================================

INSERT INTO site_menus (menu_key, name, description, is_enabled)
VALUES
  ('header_primary', 'Header Primary', 'Primary header navigation', TRUE),
  ('footer_primary', 'Footer Primary', 'Primary footer navigation', TRUE),
  ('footer_secondary', 'Footer Secondary', 'Secondary footer navigation', TRUE)
ON CONFLICT (menu_key) DO NOTHING;

INSERT INTO site_menu_items (menu_id, label, item_type, page_id, sort_order, is_enabled)
SELECT
  m.id,
  seed.label,
  'page',
  p.id,
  seed.sort_order,
  TRUE
FROM site_menus m
JOIN (
  VALUES
    ('header_primary', 'Workshops', 'workshops', 10),
    ('header_primary', 'Adult Workshops', 'adult-workshops', 20),
    ('header_primary', 'Boxes', 'boxes', 30),
    ('header_primary', 'Blog', 'blog', 40),
    ('header_primary', 'About', 'about', 50),
    ('header_primary', 'Contact', 'contact', 60),
    ('footer_primary', 'Workshops', 'workshops', 10),
    ('footer_primary', 'Boxes', 'boxes', 20),
    ('footer_primary', 'Blog', 'blog', 30),
    ('footer_secondary', 'About', 'about', 10),
    ('footer_secondary', 'Contact', 'contact', 20)
) AS seed(menu_key, label, page_key, sort_order)
  ON seed.menu_key = m.menu_key
JOIN site_pages p
  ON p.page_key = seed.page_key
WHERE NOT EXISTS (
  SELECT 1
  FROM site_menu_items existing
  WHERE existing.menu_id = m.id
    AND existing.label = seed.label
    AND existing.page_id = p.id
);

-- ============================================================================
-- 9. SEED HOMEPAGE SECTIONS
-- ============================================================================

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
  seed.section_key,
  seed.section_type,
  seed.sort_order,
  TRUE,
  seed.config_json
FROM site_pages p
JOIN (
  VALUES
    (
      'home_hero',
      'hero_banner',
      10,
      jsonb_build_object(
        'headline', 'Welcome to Lola As One',
        'highlight_text', 'Lola As One',
        'subheading', 'Where creativity meets community. Discover hands-on workshops, curated art boxes, and creative inspiration.',
        'primary_cta', jsonb_build_object('label', 'Explore Workshops', 'page_key', 'workshops'),
        'secondary_cta', jsonb_build_object('label', 'Shop Art Boxes', 'page_key', 'boxes')
      )
    ),
    (
      'home_featured_workshops',
      'featured_offerings',
      20,
      jsonb_build_object(
        'title', 'Upcoming Workshops',
        'intro', 'Join us for hands-on creative experiences designed for all ages and skill levels',
        'offering_type', 'event',
        'featured_only', TRUE,
        'limit', 3,
        'cta', jsonb_build_object('label', 'View All Workshops', 'page_key', 'workshops')
      )
    ),
    (
      'home_featured_boxes',
      'featured_offerings',
      30,
      jsonb_build_object(
        'title', 'Our Art Boxes',
        'intro', 'Curated art supplies and creative projects delivered to your door',
        'offering_type', 'product_physical',
        'featured_only', TRUE,
        'limit', 3,
        'cta', jsonb_build_object('label', 'Shop All Boxes', 'page_key', 'boxes')
      )
    ),
    (
      'home_about_intro',
      'rich_text',
      40,
      jsonb_build_object(
        'title', 'About Lola As One',
        'body_html', '<p>We''re a creative community bringing together the best of Lola Creative Space and Lots of Lovely Art.</p><p>Our mission is to inspire creativity, foster community, and make art accessible to everyone through hands-on workshops, curated art boxes, and creative resources.</p>',
        'cta', jsonb_build_object('label', 'Learn More About Us', 'page_key', 'about')
      )
    ),
    (
      'home_testimonials',
      'testimonial_strip',
      50,
      jsonb_build_object(
        'title', 'What Our Community Says',
        'intro', 'Hear from our creative community',
        'items', jsonb_build_array(
          jsonb_build_object(
            'name', 'Sarah Johnson',
            'role', 'Workshop Participant',
            'initials', 'SJ',
            'quote', 'The watercolor workshop was amazing! The instructor was patient and encouraging, and I left with a beautiful painting I''m proud of.'
          ),
          jsonb_build_object(
            'name', 'Michael Chen',
            'role', 'Subscription Box Member',
            'initials', 'MC',
            'quote', 'My kids love the monthly art boxes! Each one is thoughtfully curated with high-quality supplies and fun projects.'
          ),
          jsonb_build_object(
            'name', 'Emma Williams',
            'role', 'Regular Customer',
            'initials', 'EW',
            'quote', 'Lola As One has reignited my passion for creativity. The community here is so welcoming and supportive!'
          )
        )
      )
    ),
    (
      'home_newsletter',
      'newsletter_cta',
      60,
      jsonb_build_object(
        'title', 'Stay Creative',
        'intro', 'Subscribe to our newsletter for creative inspiration, workshop updates, and exclusive offers',
        'button_label', 'Subscribe'
      )
    )
) AS seed(section_key, section_type, sort_order, config_json)
  ON TRUE
WHERE p.page_key = 'home'
  AND NOT EXISTS (
    SELECT 1
    FROM page_sections existing
    WHERE existing.page_id = p.id
      AND existing.section_key = seed.section_key
  );

-- ============================================================================
-- 10. SEED SITE SETTINGS
-- ============================================================================

INSERT INTO site_settings (
  setting_key,
  setting_group,
  label,
  value_json,
  is_public,
  sort_order,
  description
)
VALUES
  (
    'site_name',
    'branding',
    'Site Name',
    jsonb_build_object('value', 'Lola As One'),
    TRUE,
    10,
    'Primary site name used in shared branding contexts'
  ),
  (
    'site_tagline',
    'branding',
    'Site Tagline',
    jsonb_build_object('value', 'Where creativity meets community.'),
    TRUE,
    20,
    'Short brand strapline for marketing and footer contexts'
  ),
  (
    'social_links',
    'footer',
    'Social Links',
    jsonb_build_object(
      'instagram', NULL,
      'facebook', NULL,
      'youtube', NULL
    ),
    TRUE,
    30,
    'Public social media links used in footer and future social blocks'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
