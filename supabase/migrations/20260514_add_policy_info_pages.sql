-- ============================================================================
-- CMS POLICY AND INFORMATION PAGES
-- ============================================================================
-- Date: 2026-05-14
-- Purpose:
-- 1. Add launch-critical CMS pages for workshop FAQs, privacy policy, and terms
-- 2. Seed editable rich text content for the public customer journey
-- 3. Add the pages to the secondary footer menu
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
    'workshop-faqs',
    'Workshop FAQs',
    'workshop-faqs',
    '/workshop-faqs',
    'cms_page',
    'info_page',
    NULL,
    'published',
    TRUE,
    'Workshop FAQs | Lola As One',
    'Useful details about attending, changing, and preparing for LoLA art workshops.',
    NOW()
  ),
  (
    'privacy-policy',
    'Privacy Policy',
    'privacy-policy',
    '/privacy-policy',
    'cms_page',
    'info_page',
    NULL,
    'published',
    TRUE,
    'Privacy Policy | Lola As One',
    'How Lola As One collects, uses, stores, and protects customer information.',
    NOW()
  ),
  (
    'terms-and-conditions',
    'Terms and Conditions',
    'terms-and-conditions',
    '/terms-and-conditions',
    'cms_page',
    'info_page',
    NULL,
    'published',
    TRUE,
    'Terms and Conditions | Lola As One',
    'Booking, payment, cancellation, refund, attendance, and website terms for Lola As One customers.',
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
  'workshop_faqs_content',
  'rich_text',
  10,
  TRUE,
  jsonb_build_object(
    'title', 'Workshop FAQs',
    'body_html', $$
      <h2>How long does a workshop last?</h2>
      <p>The LoLA art workshops generally last 1 hour unless specified otherwise. Please arrive before the workshop to allow your child to settle into the space.</p>
      <h2>What to bring?</h2>
      <p>We provide all art materials and lots of creative fun, but do dress for mess. There will be aprons for those who would like them. Please note that you will be taking the artwork home with you after the session.</p>
      <h2>Where can I wait for my child?</h2>
      <p>Parents are kindly requested to leave the workshop area during the class to minimise distraction. Please relax and enjoy a drink and a snack in the LoLA cafe.</p>
      <h2>What if I need to change my booking, cancel, or my child is unwell?</h2>
      <p>Our workshop requires a 48-hour cancellation notice to ensure a full refund or rescheduling. Cancellations made less than 48 hours before the scheduled workshop will not be eligible for a refund. This policy allows us to manage resources effectively and offer spots to other participants. Please note that if your child does not attend due to illness, these rules still apply.</p>
      <p>Changes to bookings can be made by emailing the team at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
      <h2>Photography</h2>
      <p>We like to take photographs of the LoLA studio and all the wonderful artwork the children create, however we will avoid taking photos of faces. These photos can be used on social media or our website. If you would prefer your child not to be photographed at all, please let us know by emailing us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
      <h2>Allergies and medication</h2>
      <p>Because the LoLA space is both a cafe and workshop space, please make us aware of any allergies or ask staff for more details on what we use in our food. Please note that allergies are not catered for.</p>
      <p>If your child takes any medication that we need to be aware of, please immediately alert a member of staff or email us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
      <p>We assume that by booking this session you have parental responsibility for the children booked. Please inform us if another guardian will be attending the session or if guardianship will change before the session starts. Please read our <a href="/privacy-policy">data protection information</a>.</p>
      <h2>Still have a question?</h2>
      <p>Please do not hesitate to email us if you have any questions.</p>
      <p>With kind wishes,<br>The LoLA team</p>
    $$
  )
FROM site_pages p
WHERE p.page_key = 'workshop-faqs'
ON CONFLICT (page_id, section_key) DO UPDATE SET
  section_type = EXCLUDED.section_type,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled,
  config_json = EXCLUDED.config_json;

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
  'privacy_policy_content',
  'rich_text',
  10,
  TRUE,
  jsonb_build_object(
    'title', 'Privacy Policy',
    'body_html', $$
      <h2>Information we collect</h2>
      <p>We collect the information needed to run bookings, orders, enquiries, customer support, newsletters, and account-related services. This can include customer names, attendee details, contact details, order history, booking notes, payment status, and communication preferences.</p>
      <h2>How we use information</h2>
      <p>We use customer information to process bookings and orders, send service emails, manage attendance and capacity, respond to enquiries, improve the website, and meet legal or operational obligations.</p>
      <h2>Payments</h2>
      <p>Payments are processed by Stripe. Lola As One does not store full payment card details.</p>
      <h2>Sharing information</h2>
      <p>We only share information with service providers where needed to operate the platform, complete a customer request, or comply with a legal obligation.</p>
      <h2>Your choices</h2>
      <p>You can contact the studio to ask about personal information held for bookings, orders, enquiries, or marketing preferences.</p>
    $$
  )
FROM site_pages p
WHERE p.page_key = 'privacy-policy'
ON CONFLICT (page_id, section_key) DO UPDATE SET
  section_type = EXCLUDED.section_type,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled,
  config_json = EXCLUDED.config_json;

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
  'terms_content',
  'rich_text',
  10,
  TRUE,
  jsonb_build_object(
    'title', 'Terms and Conditions',
    'body_html', $$
      <h2>Bookings</h2>
      <p>Workshop and event bookings are subject to availability. A place is confirmed when checkout has completed successfully and the booking confirmation has been issued.</p>
      <h2>Payments</h2>
      <p>Online payments are processed securely by Stripe. Prices shown during checkout are the prices payable for the selected booking or order.</p>
      <h2>Cancellations and refunds</h2>
      <p>Cancellation and refund terms may vary by event type. The policy shown in the booking journey applies to the selected event. Please contact the studio promptly if you need to change or cancel a booking.</p>
      <h2>Attendance</h2>
      <p>Customers are responsible for providing accurate attendee details and arriving at the published date, time, and location. The studio may contact customers if attendee information is incomplete.</p>
      <h2>Event changes</h2>
      <p>If an event needs to be changed or cancelled by the studio, customers will be contacted using the details provided at checkout.</p>
      <h2>Website content</h2>
      <p>Website content, prices, dates, and availability can change. Confirm the final details shown during checkout before completing payment.</p>
    $$
  )
FROM site_pages p
WHERE p.page_key = 'terms-and-conditions'
ON CONFLICT (page_id, section_key) DO UPDATE SET
  section_type = EXCLUDED.section_type,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled,
  config_json = EXCLUDED.config_json;

WITH footer_menu AS (
  SELECT id
  FROM site_menus
  WHERE menu_key = 'footer_secondary'
),
workshop_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'workshop-faqs'
),
legacy_faq_pages AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'faqs'
)
UPDATE site_menu_items item
SET
  label = 'Workshop FAQs',
  item_type = 'page',
  page_id = workshop_page.id,
  url = NULL,
  open_in_new_tab = FALSE,
  sort_order = 30,
  is_enabled = TRUE
FROM footer_menu, workshop_page
WHERE item.menu_id = footer_menu.id
  AND (
    item.label IN ('FAQs', 'FAQ', 'Workshop FAQs')
    OR item.page_id = workshop_page.id
    OR item.page_id IN (SELECT id FROM legacy_faq_pages)
  );

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
    ('Workshop FAQs', 'workshop-faqs', 30),
    ('Privacy Policy', 'privacy-policy', 40),
    ('Terms and Conditions', 'terms-and-conditions', 50)
) AS seed(label, page_key, sort_order)
  ON TRUE
JOIN site_pages p
  ON p.page_key = seed.page_key
WHERE m.menu_key = 'footer_secondary'
  AND NOT EXISTS (
    SELECT 1
    FROM site_menu_items existing
    WHERE existing.menu_id = m.id
      AND existing.page_id = p.id
  );

UPDATE site_pages
SET
  status = 'archived',
  show_in_navigation = FALSE
WHERE page_key = 'faqs';
