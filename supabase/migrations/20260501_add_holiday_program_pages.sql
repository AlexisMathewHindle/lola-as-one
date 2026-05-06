-- Register public holiday-program routes in the CMS page registry and header menu.

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
    'half-term',
    'Half Term',
    'half-term',
    '/half-term',
    'app_route',
    NULL,
    'HalfTerm',
    'published',
    TRUE,
    'Half Term Art Classes | Lola As One',
    'Book upcoming half term art classes and creative workshops.',
    NOW()
  ),
  (
    'summer-holiday',
    'Summer Holiday',
    'summer-holiday',
    '/summer-holiday',
    'app_route',
    NULL,
    'SummerHoliday',
    'published',
    TRUE,
    'Summer Holiday Art Workshops | Lola As One',
    'Book summer holiday art workshops and creative sessions.',
    NOW()
  )
ON CONFLICT (page_key) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  path = EXCLUDED.path,
  page_kind = EXCLUDED.page_kind,
  template_key = EXCLUDED.template_key,
  route_name = EXCLUDED.route_name,
  status = EXCLUDED.status,
  show_in_navigation = EXCLUDED.show_in_navigation,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  published_at = COALESCE(site_pages.published_at, EXCLUDED.published_at);

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
    ('header_primary', 'Half Term', 'half-term', 15),
    ('header_primary', 'Summer Holiday', 'summer-holiday', 16)
) AS seed(menu_key, label, page_key, sort_order)
  ON seed.menu_key = m.menu_key
JOIN site_pages p
  ON p.page_key = seed.page_key
WHERE NOT EXISTS (
  SELECT 1
  FROM site_menu_items existing
  WHERE existing.menu_id = m.id
    AND existing.page_id = p.id
);
