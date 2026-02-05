-- ============================================================================
-- EVENT CATEGORIES MIGRATION
-- ============================================================================
-- Purpose: Add comprehensive event category management system
-- Date: 2026-02-02
-- 
-- This migration adds:
-- 1. event_categories table - Hierarchical category structure for events
-- 2. Initial seed data with all event categories
-- 3. Indexes for performance
-- 4. RLS policies for security
-- ============================================================================

-- ============================================================================
-- 1. CREATE EVENT CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Category details
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Hierarchical structure (for grouping)
  parent_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  
  -- Display and organization
  display_order INTEGER DEFAULT 0,
  color_hex TEXT, -- Optional color for UI display (e.g., '#FF6B6B')
  icon TEXT, -- Optional icon name (e.g., 'palette', 'users')
  
  -- Age group metadata (stored as JSONB for flexibility)
  age_range JSONB, -- e.g., {"min": 2, "max": 4} or {"min": 5, "max": null}
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_event_categories_parent ON event_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_event_categories_slug ON event_categories(slug);
CREATE INDEX IF NOT EXISTS idx_event_categories_active ON event_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_event_categories_display_order ON event_categories(display_order);

-- ============================================================================
-- 3. ADD CATEGORY REFERENCE TO OFFERING_EVENTS
-- ============================================================================

-- Add category_id column to offering_events (if not exists)
ALTER TABLE offering_events 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL;

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_offering_events_category ON offering_events(category_id);

-- ============================================================================
-- 4. SEED INITIAL EVENT CATEGORIES
-- ============================================================================

-- Insert main categories (parent categories)
INSERT INTO event_categories (id, name, slug, description, display_order, color_hex, icon, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Open Studio', 'open-studio', 'Drop-in creative sessions for all ages', 1, '#3B82F6', 'palette', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Little Ones', 'little-ones', 'Programs for toddlers and preschoolers', 2, '#F59E0B', 'baby', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Kids Workshops', 'kids-workshops', 'Structured creative programs for children', 3, '#10B981', 'users', TRUE),
  ('44444444-4444-4444-4444-444444444444', 'Adult Workshops', 'adult-workshops', 'Creative sessions for adults', 4, '#8B5CF6', 'paint-brush', TRUE),
  ('55555555-5555-5555-5555-555555555555', 'Holiday Programs', 'holiday-programs', 'Special holiday-themed events', 5, '#EF4444', 'gift', TRUE),
  ('66666666-6666-6666-6666-666666666666', 'Private Events', 'private-events', 'Private parties and bookings', 6, '#EC4899', 'lock', TRUE),
  ('77777777-7777-7777-7777-777777777777', 'Special Programs', 'special-programs', 'Unique ongoing programs and clubs', 7, '#06B6D4', 'star', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert sub-categories for Open Studio
INSERT INTO event_categories (name, slug, description, parent_id, display_order, age_range, is_active) VALUES
  ('Open Studio (all ages)', 'open-studio-all-ages', 'Open studio sessions for all ages', '11111111-1111-1111-1111-111111111111', 1, '{"min": 0, "max": null}', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insert sub-categories for Little Ones
INSERT INTO event_categories (name, slug, description, parent_id, display_order, age_range, is_active) VALUES
  ('Little Ones Fri (ages 2-4)', 'little-ones-fri-2-4', 'Friday sessions for ages 2-4', '22222222-2222-2222-2222-222222222222', 1, '{"min": 2, "max": 4}', TRUE),
  ('Little Ones Tues (ages 2-4)', 'little-ones-tues-2-4', 'Tuesday sessions for ages 2-4', '22222222-2222-2222-2222-222222222222', 2, '{"min": 2, "max": 4}', TRUE),
  ('Little Ones Sat (ages 2-5)', 'little-ones-sat-2-5', 'Saturday sessions for ages 2-5', '22222222-2222-2222-2222-222222222222', 3, '{"min": 2, "max": 5}', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insert sub-categories for Kids Workshops
INSERT INTO event_categories (name, slug, description, parent_id, display_order, age_range, is_active) VALUES
  ('The Story of Art Club (ages 4-8)', 'story-of-art-club-4-8', 'Art history club for ages 4-8', '33333333-3333-3333-3333-333333333333', 1, '{"min": 4, "max": 8}', TRUE),
  ('The Story of Art Club (ages 9-13)', 'story-of-art-club-9-13', 'Art history club for ages 9-13', '33333333-3333-3333-3333-333333333333', 2, '{"min": 9, "max": 13}', TRUE),
  ('Creative Art Club (ages 4+)', 'creative-art-club-4-plus', 'General art club for ages 4 and up', '33333333-3333-3333-3333-333333333333', 3, '{"min": 4, "max": null}', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insert sub-categories for Adult Workshops
INSERT INTO event_categories (name, slug, description, parent_id, display_order, age_range, is_active) VALUES
  ('Creative Saturdays (ages 5+)', 'creative-saturdays-5-plus', 'Saturday creative sessions for ages 5+', '44444444-4444-4444-4444-444444444444', 1, '{"min": 5, "max": null}', TRUE),
  ('Holiday (ages 5+)', 'holiday-5-plus', 'Holiday workshops for ages 5+', '44444444-4444-4444-4444-444444444444', 2, '{"min": 5, "max": null}', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insert sub-categories for Holiday Programs
INSERT INTO event_categories (name, slug, description, parent_id, display_order, age_range, is_active) VALUES
  ('Holiday Little Ones (ages 2-4)', 'holiday-little-ones-2-4', 'Holiday programs for ages 2-4', '55555555-5555-5555-5555-555555555555', 1, '{"min": 2, "max": 4}', TRUE),
  ('Holiday Open Studio (all ages)', 'holiday-open-studio-all-ages', 'Holiday open studio for all ages', '55555555-5555-5555-5555-555555555555', 2, '{"min": 0, "max": null}', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insert sub-categories for Special Programs
INSERT INTO event_categories (name, slug, description, parent_id, display_order, age_range, is_active) VALUES
  ('Storytime', 'storytime', 'Story and art sessions', '77777777-7777-7777-7777-777777777777', 1, '{"min": 2, "max": 6}', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 5. CREATE UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_event_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_event_categories_updated_at
  BEFORE UPDATE ON event_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_event_categories_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for active categories
CREATE POLICY "Public can view active event categories"
  ON event_categories
  FOR SELECT
  USING (is_active = TRUE);

-- Authenticated users can view all categories
CREATE POLICY "Authenticated users can view all event categories"
  ON event_categories
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can insert/update/delete categories
-- Note: You'll need to implement admin role checking
-- For now, we'll allow authenticated users with a specific role
CREATE POLICY "Admins can manage event categories"
  ON event_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- To verify the table was created:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'event_categories';

-- To verify categories were seeded:
-- SELECT id, name, slug, parent_id, display_order FROM event_categories ORDER BY display_order;

-- To verify the column was added to offering_events:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'offering_events' AND column_name = 'category_id';

-- To view category hierarchy:
-- SELECT
--   c.name as category,
--   p.name as parent_category,
--   c.age_range,
--   c.display_order
-- FROM event_categories c
-- LEFT JOIN event_categories p ON c.parent_id = p.id
-- ORDER BY COALESCE(p.display_order, c.display_order), c.display_order;

