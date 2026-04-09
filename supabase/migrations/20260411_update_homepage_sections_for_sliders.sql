-- ============================================================================
-- UPDATE HOMEPAGE SECTIONS FOR CMS-DRIVEN SLIDERS AND LIVE WORKSHOPS CALENDAR
-- ============================================================================
-- Date: 2026-04-11
-- Purpose:
-- 1. Convert the hero banner into a slideshow-capable CMS section
-- 2. Seed a homepage section that wraps the live workshops calendar
-- 3. Seed a second carousel/gallery section beneath the schedule
-- ============================================================================

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
UPDATE page_sections
SET
  sort_order = 10,
  config_json = jsonb_build_object(
    'autoplay_ms', 5000,
    'slides', jsonb_build_array(
      jsonb_build_object(
        'eyebrow', 'Lola As One',
        'headline', 'Creative classes for children, adults and families',
        'subheading', 'A warm, colourful creative space in Newbury for making, learning and relaxing together.',
        'primary_cta', jsonb_build_object('label', 'Browse workshops', 'page_key', 'workshops'),
        'secondary_cta', jsonb_build_object('label', 'Schedule', 'href', '#home_schedule'),
        'background', 'linear-gradient(135deg, rgba(123, 58, 33, 0.98), rgba(223, 147, 77, 0.82))',
        'preview_background', 'linear-gradient(135deg, rgba(224, 129, 70, 1), rgba(249, 214, 155, 0.92))'
      ),
      jsonb_build_object(
        'eyebrow', 'Studio Life',
        'headline', 'Make, play, paint and pause in the Lola creative space',
        'subheading', 'Weekly classes, open studio moments, cafe catch-ups and joyful making under one roof.',
        'primary_cta', jsonb_build_object('label', 'View Weekly Schedule', 'href', '#home_schedule'),
        'secondary_cta', jsonb_build_object('label', 'About Lola As One', 'page_key', 'about'),
        'background', 'linear-gradient(135deg, rgba(85, 108, 86, 0.98), rgba(208, 171, 99, 0.8))',
        'preview_background', 'linear-gradient(135deg, rgba(162, 194, 155, 1), rgba(239, 219, 170, 0.92))'
      ),
      jsonb_build_object(
        'eyebrow', 'Creative Community',
        'headline', 'Discover classes, cafe moments and curated creative experiences',
        'subheading', 'From art clubs and open studio sessions to thoughtful gifts and boxes, the homepage can now be curated section by section.',
        'primary_cta', jsonb_build_object('label', 'Read the Blog', 'page_key', 'blog'),
        'secondary_cta', jsonb_build_object('label', 'Get in Touch', 'page_key', 'contact'),
        'background', 'linear-gradient(135deg, rgba(70, 54, 97, 0.98), rgba(241, 149, 118, 0.82))',
        'preview_background', 'linear-gradient(135deg, rgba(150, 124, 187, 1), rgba(247, 205, 175, 0.95))'
      )
    )
  ),
  updated_at = NOW()
WHERE section_key = 'home_hero'
  AND page_id = (SELECT id FROM home_page);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
UPDATE page_sections
SET
  sort_order = 20,
  config_json = jsonb_build_object(
    'eyebrow', 'What''s On',
    'title', 'Lola Art Classes',
    'intro', 'The homepage now reuses the live workshops calendar instead of a separately managed schedule block.',
    'show_view_toggle', false,
    'primary_cta', jsonb_build_object('label', 'View all workshops', 'page_key', 'workshops')
  ),
  updated_at = NOW()
WHERE section_key = 'home_schedule'
  AND page_id = (SELECT id FROM home_page);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
UPDATE page_sections
SET
  sort_order = 35,
  config_json = jsonb_build_object(
    'layout_style', 'columns',
    'items', jsonb_build_array(
      jsonb_build_object(
        'icon', 'mug-hot',
        'title', 'Redemption Roasters coffee',
        'body', 'We proudly serve coffee from Redemption Roasters — rich speciality coffee that has social impact.'
      ),
      jsonb_build_object(
        'icon', 'cake-candles',
        'title', 'Pastries & cakes',
        'body', 'Freshly baked treats to enjoy while your child creates. From buttery croissants to homemade cakes.'
      ),
      jsonb_build_object(
        'icon', 'book-open',
        'title', 'The book corner',
        'body', 'Browse our curated collection of children''s art books — from Little People, Big Dreams to Phaidon''s My Art Book series.'
      )
    )
  ),
  updated_at = NOW()
WHERE section_key = 'home_feature_columns'
  AND page_id = (SELECT id FROM home_page);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
INSERT INTO page_sections (
  page_id,
  section_key,
  section_type,
  sort_order,
  is_enabled,
  config_json
)
SELECT
  home_page.id,
  'home_feature_columns',
  'feature_split',
  35,
  TRUE,
  jsonb_build_object(
    'layout_style', 'columns',
    'items', jsonb_build_array(
      jsonb_build_object(
        'icon', 'mug-hot',
        'title', 'Redemption Roasters coffee',
        'body', 'We proudly serve coffee from Redemption Roasters — rich speciality coffee that has social impact.'
      ),
      jsonb_build_object(
        'icon', 'cake-candles',
        'title', 'Pastries & cakes',
        'body', 'Freshly baked treats to enjoy while your child creates. From buttery croissants to homemade cakes.'
      ),
      jsonb_build_object(
        'icon', 'book-open',
        'title', 'The book corner',
        'body', 'Browse our curated collection of children''s art books — from Little People, Big Dreams to Phaidon''s My Art Book series.'
      )
    )
  )
FROM home_page
WHERE NOT EXISTS (
  SELECT 1
  FROM page_sections
  WHERE page_id = home_page.id
    AND section_key = 'home_feature_columns'
);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
UPDATE page_sections
SET
  sort_order = 45,
  config_json = jsonb_build_object(
    'layout_style', 'banners',
    'items', jsonb_build_array(
      jsonb_build_object(
        'image_side', 'left',
        'eyebrow', 'Ages 4+',
        'title', 'After School Art Clubs',
        'body', jsonb_build_array(
          'A joyful creative moment in your child''s week — learning about artists and art styles, exploring new materials, and having fun in a beautiful space.',
          'Wednesday classes explore changing themes through the year, with term-time registration by age band.'
        ),
        'ctas', jsonb_build_array(
          jsonb_build_object('label', 'Register — Wednesday (4+)', 'href', '/workshops'),
          jsonb_build_object('label', 'Register — Thursday (4-8)', 'href', '/workshops'),
          jsonb_build_object('label', 'Register — Thursday (9-13)', 'href', '/workshops')
        ),
        'icons', jsonb_build_array(
          jsonb_build_object('name', 'heart', 'color', '#8ca0a0'),
          jsonb_build_object('name', 'gift', 'color', '#d7b15d'),
          jsonb_build_object('name', 'mug-hot', 'color', '#dd9965'),
          jsonb_build_object('name', 'paint-brush', 'color', '#8aa7a6'),
          jsonb_build_object('name', 'palette', 'color', '#b6a36f'),
          jsonb_build_object('name', 'star', 'color', '#c48c79')
        )
      ),
      jsonb_build_object(
        'image_side', 'right',
        'eyebrow', 'Ages 2-4',
        'title', 'Little Ones',
        'body', jsonb_build_array(
          'All about the process, not the result. LoLA for Little Ones helps young children explore creativity through texture, colour and new materials in a relaxed, playful environment.',
          'We ask that you stay and co-create alongside your child. Sessions are first come, first served — book online to secure your place.'
        ),
        'ctas', jsonb_build_array(
          jsonb_build_object('label', 'Register — Tuesday', 'href', '/workshops'),
          jsonb_build_object('label', 'Register — Friday', 'href', '/workshops'),
          jsonb_build_object('label', 'Register — Saturday', 'href', '/workshops')
        ),
        'icons', jsonb_build_array(
          jsonb_build_object('name', 'baby', 'color', '#d6b4a3'),
          jsonb_build_object('name', 'gift', 'color', '#e3a36c'),
          jsonb_build_object('name', 'paint-brush', 'color', '#c9b06d'),
          jsonb_build_object('name', 'palette', 'color', '#c58674'),
          jsonb_build_object('name', 'cake-candles', 'color', '#d0b16f'),
          jsonb_build_object('name', 'heart', 'color', '#8aa7a6')
        )
      ),
      jsonb_build_object(
        'image_side', 'left',
        'eyebrow', 'All ages',
        'title', 'Open Studio',
        'body', jsonb_build_array(
          'Drop in, grab a coffee, and let your child get freely creative. Open Studio sessions offer open-ended projects at the art table — no instruction, just inspiration.',
          'A member of the LoLA team will be present, but this is not a taught session. We kindly ask that parents stay within the café and help supervise each child. Each ticket is for one hour.'
        ),
        'ctas', jsonb_build_array(
          jsonb_build_object('label', 'Book Open Studio', 'href', '/workshops')
        ),
        'icons', jsonb_build_array(
          jsonb_build_object('name', 'palette', 'color', '#8ca0a0'),
          jsonb_build_object('name', 'paint-brush', 'color', '#d7b15d'),
          jsonb_build_object('name', 'heart', 'color', '#dd9965'),
          jsonb_build_object('name', 'gift', 'color', '#8aa7a6'),
          jsonb_build_object('name', 'star', 'color', '#b6a36f')
        )
      )
    )
  ),
  updated_at = NOW()
WHERE section_key = 'home_banners'
  AND page_id = (SELECT id FROM home_page);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
INSERT INTO page_sections (
  page_id,
  section_key,
  section_type,
  sort_order,
  is_enabled,
  config_json
)
SELECT
  home_page.id,
  'home_banners',
  'feature_split',
  45,
  TRUE,
  jsonb_build_object(
    'layout_style', 'banners',
    'items', jsonb_build_array(
      jsonb_build_object(
        'image_side', 'left',
        'eyebrow', 'Ages 4+',
        'title', 'After School Art Clubs',
        'body', jsonb_build_array(
          'A joyful creative moment in your child''s week — learning about artists and art styles, exploring new materials, and having fun in a beautiful space.',
          'Wednesday classes explore changing themes through the year, with term-time registration by age band.'
        ),
        'ctas', jsonb_build_array(
          jsonb_build_object('label', 'Register — Wednesday (4+)', 'href', '/workshops'),
          jsonb_build_object('label', 'Register — Thursday (4-8)', 'href', '/workshops'),
          jsonb_build_object('label', 'Register — Thursday (9-13)', 'href', '/workshops')
        ),
        'icons', jsonb_build_array(
          jsonb_build_object('name', 'heart', 'color', '#8ca0a0'),
          jsonb_build_object('name', 'gift', 'color', '#d7b15d'),
          jsonb_build_object('name', 'mug-hot', 'color', '#dd9965'),
          jsonb_build_object('name', 'paint-brush', 'color', '#8aa7a6'),
          jsonb_build_object('name', 'palette', 'color', '#b6a36f'),
          jsonb_build_object('name', 'star', 'color', '#c48c79')
        )
      ),
      jsonb_build_object(
        'image_side', 'right',
        'eyebrow', 'Ages 2-4',
        'title', 'Little Ones',
        'body', jsonb_build_array(
          'All about the process, not the result. LoLA for Little Ones helps young children explore creativity through texture, colour and new materials in a relaxed, playful environment.',
          'We ask that you stay and co-create alongside your child. Sessions are first come, first served — book online to secure your place.'
        ),
        'ctas', jsonb_build_array(
          jsonb_build_object('label', 'Register — Tuesday', 'href', '/workshops'),
          jsonb_build_object('label', 'Register — Friday', 'href', '/workshops'),
          jsonb_build_object('label', 'Register — Saturday', 'href', '/workshops')
        ),
        'icons', jsonb_build_array(
          jsonb_build_object('name', 'baby', 'color', '#d6b4a3'),
          jsonb_build_object('name', 'gift', 'color', '#e3a36c'),
          jsonb_build_object('name', 'paint-brush', 'color', '#c9b06d'),
          jsonb_build_object('name', 'palette', 'color', '#c58674'),
          jsonb_build_object('name', 'cake-candles', 'color', '#d0b16f'),
          jsonb_build_object('name', 'heart', 'color', '#8aa7a6')
        )
      ),
      jsonb_build_object(
        'image_side', 'left',
        'eyebrow', 'All ages',
        'title', 'Open Studio',
        'body', jsonb_build_array(
          'Drop in, grab a coffee, and let your child get freely creative. Open Studio sessions offer open-ended projects at the art table — no instruction, just inspiration.',
          'A member of the LoLA team will be present, but this is not a taught session. We kindly ask that parents stay within the café and help supervise each child. Each ticket is for one hour.'
        ),
        'ctas', jsonb_build_array(
          jsonb_build_object('label', 'Book Open Studio', 'href', '/workshops')
        ),
        'icons', jsonb_build_array(
          jsonb_build_object('name', 'palette', 'color', '#8ca0a0'),
          jsonb_build_object('name', 'paint-brush', 'color', '#d7b15d'),
          jsonb_build_object('name', 'heart', 'color', '#dd9965'),
          jsonb_build_object('name', 'gift', 'color', '#8aa7a6'),
          jsonb_build_object('name', 'star', 'color', '#b6a36f')
        )
      )
    )
  )
FROM home_page
WHERE NOT EXISTS (
  SELECT 1
  FROM page_sections
  WHERE page_id = home_page.id
    AND section_key = 'home_banners'
);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
INSERT INTO page_sections (
  page_id,
  section_key,
  section_type,
  sort_order,
  is_enabled,
  config_json
)
SELECT
  home_page.id,
  'home_schedule',
  'schedule_grid',
  20,
  TRUE,
  jsonb_build_object(
    'eyebrow', 'What''s On',
    'title', 'Lola Art Classes',
    'intro', 'The homepage now reuses the live workshops calendar instead of a separately managed schedule block.',
    'show_view_toggle', false,
    'primary_cta', jsonb_build_object('label', 'View all workshops', 'page_key', 'workshops')
  )
FROM home_page
WHERE NOT EXISTS (
  SELECT 1
  FROM page_sections
  WHERE page_id = home_page.id
    AND section_key = 'home_schedule'
);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
INSERT INTO page_sections (
  page_id,
  section_key,
  section_type,
  sort_order,
  is_enabled,
  config_json
)
SELECT
  home_page.id,
  'home_creative_slider',
  'image_gallery',
  30,
  TRUE,
  jsonb_build_object(
    'eyebrow', 'Studio Highlights',
    'title', 'Art Classes & LoLA Cafe',
    'intro', 'A second content-managed slider that can be curated independently from the hero banner.',
    'items', jsonb_build_array(
      jsonb_build_object(
        'title', 'Creative Cafe Moments',
        'description', 'Cake, coffee, sketchbooks and friendly studio energy between sessions.',
        'background', 'linear-gradient(135deg, #e8b56f, #cc764f)'
      ),
      jsonb_build_object(
        'title', 'Open Studio Tables',
        'description', 'Drop in to make, experiment and play with new materials.',
        'background', 'linear-gradient(135deg, #d26b58, #7f3f32)'
      ),
      jsonb_build_object(
        'title', 'Family Workshops',
        'description', 'Shared making time designed for children, adults and curious beginners.',
        'background', 'linear-gradient(135deg, #8eb5a4, #42645b)'
      ),
      jsonb_build_object(
        'title', 'Curated Art Boxes',
        'description', 'Thoughtful creative projects and materials to take home.',
        'background', 'linear-gradient(135deg, #c99fb5, #79516e)'
      )
    )
  )
FROM home_page
WHERE NOT EXISTS (
  SELECT 1
  FROM page_sections
  WHERE page_id = home_page.id
    AND section_key = 'home_creative_slider'
);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
UPDATE page_sections
SET is_enabled = FALSE
WHERE section_key = 'home_featured_workshops'
  AND page_id = (SELECT id FROM home_page);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
UPDATE page_sections
SET is_enabled = FALSE
WHERE section_key = 'home_featured_boxes'
  AND page_id = (SELECT id FROM home_page);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
UPDATE page_sections
SET is_enabled = FALSE
WHERE section_key = 'home_about_intro'
  AND page_id = (SELECT id FROM home_page);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
UPDATE page_sections
SET
  sort_order = 55,
  config_json = jsonb_build_object(
    'eyebrow', 'What People Say',
    'title', 'Loved by families & educators',
    'intro', '',
    'autoplay_ms', 6000,
    'items', jsonb_build_array(
      jsonb_build_object(
        'quote', 'LoLA has been the highlight of my daughter''s week. She comes home buzzing with excitement and covered in paint — exactly what childhood should look like.',
        'name', 'Sarah M.',
        'role', 'Parent',
        'stars', 5
      ),
      jsonb_build_object(
        'quote', 'The studio feels thoughtful, calm and genuinely creative. Every session introduces artists and materials in a way children can really connect with.',
        'name', 'Emma R.',
        'role', 'Teacher',
        'stars', 5
      ),
      jsonb_build_object(
        'quote', 'Open Studio is our favourite weekend ritual. Coffee for us, paint for them, and everyone leaves happier than they arrived.',
        'name', 'James T.',
        'role', 'Parent',
        'stars', 5
      )
    )
  ),
  updated_at = NOW()
WHERE section_key = 'home_testimonials'
  AND page_id = (SELECT id FROM home_page);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
INSERT INTO page_sections (
  page_id,
  section_key,
  section_type,
  sort_order,
  is_enabled,
  config_json
)
SELECT
  home_page.id,
  'home_testimonials',
  'testimonial_strip',
  55,
  TRUE,
  jsonb_build_object(
    'eyebrow', 'What People Say',
    'title', 'Loved by families & educators',
    'intro', '',
    'autoplay_ms', 6000,
    'items', jsonb_build_array(
      jsonb_build_object(
        'quote', 'LoLA has been the highlight of my daughter''s week. She comes home buzzing with excitement and covered in paint — exactly what childhood should look like.',
        'name', 'Sarah M.',
        'role', 'Parent',
        'stars', 5
      ),
      jsonb_build_object(
        'quote', 'The studio feels thoughtful, calm and genuinely creative. Every session introduces artists and materials in a way children can really connect with.',
        'name', 'Emma R.',
        'role', 'Teacher',
        'stars', 5
      ),
      jsonb_build_object(
        'quote', 'Open Studio is our favourite weekend ritual. Coffee for us, paint for them, and everyone leaves happier than they arrived.',
        'name', 'James T.',
        'role', 'Parent',
        'stars', 5
      )
    )
  )
FROM home_page
WHERE NOT EXISTS (
  SELECT 1
  FROM page_sections
  WHERE page_id = home_page.id
    AND section_key = 'home_testimonials'
);

WITH home_page AS (
  SELECT id
  FROM site_pages
  WHERE page_key = 'home'
)
UPDATE page_sections
SET is_enabled = FALSE
WHERE section_key = 'home_newsletter'
  AND page_id = (SELECT id FROM home_page);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
