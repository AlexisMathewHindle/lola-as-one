-- ============================================================================
-- ADD FOOTER AND CONTACT SITE SETTINGS
-- ============================================================================
-- Date: 2026-04-10
-- Purpose:
-- 1. Seed dedicated footer and contact settings for the CMS-backed footer
-- 2. Backfill real default social links without overwriting existing values
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
    'footer_intro',
    'footer',
    'Footer Intro',
    jsonb_build_object(
      'value',
      'Creative classes, workshops, art boxes and warm community moments from the Lola creative space in Newbury.'
    ),
    TRUE,
    10,
    'Introductory footer copy shown in the brand column'
  ),
  (
    'contact_venue',
    'footer',
    'Contact Venue',
    jsonb_build_object('value', 'LoLA Lots of Lovely Art Creative Space'),
    TRUE,
    20,
    'Venue or studio name shown in the footer contact block'
  ),
  (
    'contact_address_lines',
    'footer',
    'Contact Address Lines',
    jsonb_build_object(
      'value',
      jsonb_build_array(
        '50B Northbrook Street',
        'Newbury RG14 1DT'
      )
    ),
    TRUE,
    30,
    'Address lines rendered in the footer contact block'
  ),
  (
    'contact_email',
    'footer',
    'Contact Email',
    jsonb_build_object('value', 'hello@lotsoflovelyart.com'),
    TRUE,
    40,
    'Public contact email shown in the footer'
  ),
  (
    'copyright_text',
    'footer',
    'Copyright Text',
    jsonb_build_object('value', 'Copyright 2026 All rights reserved'),
    TRUE,
    50,
    'Copyright line shown in the footer'
  )
ON CONFLICT (setting_key) DO NOTHING;

UPDATE site_settings
SET value_json = jsonb_build_object(
  'instagram', 'https://www.instagram.com/lotsoflovelyart/',
  'facebook', 'https://www.facebook.com/lotsoflovelyart',
  'youtube', NULL
) || COALESCE(value_json, '{}'::jsonb)
WHERE setting_key = 'social_links';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
