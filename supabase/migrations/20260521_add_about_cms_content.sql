-- ============================================================================
-- ABOUT PAGE CMS CONTENT
-- ============================================================================
-- Date: 2026-05-21
-- Purpose:
-- 1. Convert the About page registry record from an app route to a CMS page
-- 2. Seed an editable rich text section for the public About page
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
  'about',
  'About Lola As One',
  'about',
  '/about',
  'cms_page',
  'info_page',
  NULL,
  'published',
  TRUE,
  'About Lola As One | Lola As One',
  'Learn more about Lola As One and the creative community behind it.',
  NOW()
)
ON CONFLICT (page_key) DO UPDATE SET
  slug = EXCLUDED.slug,
  path = EXCLUDED.path,
  page_kind = EXCLUDED.page_kind,
  template_key = EXCLUDED.template_key,
  route_name = EXCLUDED.route_name,
  status = CASE
    WHEN site_pages.status = 'archived' THEN EXCLUDED.status
    ELSE site_pages.status
  END,
  show_in_navigation = TRUE,
  title = EXCLUDED.title,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
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
  'about_content',
  'rich_text',
  10,
  TRUE,
  jsonb_build_object(
    'title', 'About Lola As One',
    'body_html', $$
      <h2>Our Story</h2>
      <p>Lola As One is the coming together of two beloved creative ventures: <strong>Lola Creative Space</strong> and <strong>Lots of Lovely Art</strong>. What started as a passion for bringing creativity to our community has grown into a vibrant hub where people of all ages and skill levels can explore their artistic side.</p>
      <p><strong>Lola Creative Space</strong> began with a simple idea: create a welcoming environment where people could gather, learn, and create together. Our hands-on workshops became a place where friendships formed, skills developed, and creativity flourished.</p>
      <p><strong>Lots of Lovely Art</strong> emerged from the desire to bring that creative experience into people's homes through carefully curated art boxes filled with high-quality supplies and thoughtful projects.</p>
      <p>Today, as <strong>Lola As One</strong>, we're united in our mission to make creativity accessible, enjoyable, and meaningful.</p>
      <h2>Our Mission & Values</h2>
      <p>We believe creativity is for everyone. Our mission is to inspire, support, and celebrate creative expression in all its forms.</p>
      <h3>Inclusivity</h3>
      <p>Everyone is welcome here, regardless of age, skill level, or background. Creativity knows no boundaries.</p>
      <h3>Community</h3>
      <p>We're more than a business - we're a community of makers, learners, and friends who support each other.</p>
      <h3>Inspiration</h3>
      <p>We strive to spark curiosity, encourage experimentation, and celebrate the joy of creating something new.</p>
      <h3>Quality</h3>
      <p>From our workshops to our art boxes, we're committed to providing high-quality experiences and materials.</p>
      <h2>What We Do</h2>
      <h3>Creative Workshops</h3>
      <p>Join us for hands-on creative experiences designed for all ages and skill levels, with expert instruction, quality materials, and a supportive environment.</p>
      <h3>Art Boxes</h3>
      <p>Bring creativity home with curated art boxes, high-quality supplies, and step-by-step projects.</p>
      <h3>Digital Resources</h3>
      <p>Access creative inspiration anytime with printable templates, online tutorials, and resources designed to fuel your creativity.</p>
      <p><a href="/workshops">Explore workshops</a> or <a href="/boxes">shop art boxes</a>.</p>
    $$
  )
FROM site_pages p
WHERE p.page_key = 'about'
ON CONFLICT (page_id, section_key) DO NOTHING;
