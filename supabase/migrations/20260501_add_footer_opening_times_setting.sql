-- ============================================================================
-- ADD FOOTER OPENING TIMES SETTING
-- ============================================================================
-- Date: 2026-05-01
-- Purpose:
-- 1. Seed editable opening times for the CMS-backed footer
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
    'opening_times',
    'footer',
    'Opening Times',
    jsonb_build_object(
      'value',
      jsonb_build_array(
        jsonb_build_object('day', 'Mon', 'hours', 'Closed'),
        jsonb_build_object('day', 'Tues', 'hours', '9am - 5pm'),
        jsonb_build_object('day', 'Wed', 'hours', '9am - 6pm'),
        jsonb_build_object('day', 'Thurs', 'hours', '9am - 6pm'),
        jsonb_build_object('day', 'Fri', 'hours', '9am - 5pm'),
        jsonb_build_object('day', 'Sat', 'hours', '9.30am - 3pm'),
        jsonb_build_object('day', 'Sun', 'hours', '9.30am - 1pm')
      )
    ),
    TRUE,
    60,
    'Opening times shown in the footer'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
