-- ============================================================================
-- CMS COOKIE POLICY PAGE
-- ============================================================================
-- Date: 2026-09-26
-- Purpose:
-- 1. Add an editable CMS cookie policy page at /cookie-policy.
-- 2. Seed plain-language starter content listing the cookies the site uses.
-- Modelled on 20260514_add_policy_info_pages.sql.
-- Part of: COOKIE-CONSENT-BANNER-EPIC.md (Ticket 7).
--
-- Note: the footer links to /cookie-policy directly (alongside a "Cookie settings"
-- action), so this page is NOT added to the footer menu and is hidden from
-- navigation to avoid a duplicate link. It stays editable in admin Information Pages.
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
    'cookie-policy',
    'Cookie Policy',
    'cookie-policy',
    '/cookie-policy',
    'cms_page',
    'info_page',
    NULL,
    'published',
    FALSE,
    'Cookie Policy | Lola As One',
    'The cookies Lola As One uses, which need your agreement, and how to change your choice.',
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
  'cookie_policy_content',
  'rich_text',
  10,
  TRUE,
  jsonb_build_object(
    'title', 'Cookie Policy',
    'body_html', $$
      <h2>What cookies are</h2>
      <p>Cookies are small files a website saves on your device. Some keep the site working. Others, only if you agree, help us see how the site is used or measure our advertising.</p>
      <h2>Cookies we always use</h2>
      <p>These keep the site working and cannot be turned off:</p>
      <ul>
        <li><strong>Sign-in and security:</strong> when you log in, we keep you signed in for your visit. Set by our sign-in provider, Supabase.</li>
        <li><strong>Checkout:</strong> when you pay, our payment provider, Stripe, uses cookies to take the payment safely and help prevent fraud.</li>
        <li><strong>Your cookie choice:</strong> we save the choice you make here so we do not ask you every time. This lasts about six months.</li>
      </ul>
      <h2>Cookies we use only if you agree</h2>
      <p><strong>Analytics.</strong> If you turn analytics on, Google Analytics saves cookies named <code>_ga</code> and <code>_ga_</code> followed by more characters. They count visits and show us which pages people use, so we can improve the site. They do not tell us your name.</p>
      <p><strong>Marketing.</strong> If you turn marketing on, the Meta (Facebook) pixel saves a cookie named <code>_fbp</code>. It measures how our Facebook and Instagram adverts perform and can help show you more relevant adverts.</p>
      <p>Both stay off until you agree. If you do not agree, they are never saved.</p>
      <h2>Changing your mind</h2>
      <p>You can change or withdraw your choice at any time. Select <strong>Cookie settings</strong> at the bottom of any page.</p>
      <h2>More about your data</h2>
      <p>For how we handle personal information, see our <a href="/privacy-policy">privacy policy</a>.</p>
    $$
  )
FROM site_pages p
WHERE p.page_key = 'cookie-policy'
ON CONFLICT (page_id, section_key) DO UPDATE SET
  section_type = EXCLUDED.section_type,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled,
  config_json = EXCLUDED.config_json;
