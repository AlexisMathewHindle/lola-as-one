-- Add category layout/template selection for frontend workshop rendering

ALTER TABLE event_categories
ADD COLUMN IF NOT EXISTS layout_key TEXT;

-- Backfill likely adult workshop categories so existing data picks up the new layout.
UPDATE event_categories
SET layout_key = 'adult_workshop'
WHERE layout_key IS NULL
  AND (
    lower(coalesce(name, '')) LIKE '%adult%'
    OR lower(coalesce(slug, '')) LIKE '%adult%'
    OR (
      age_range ? 'min'
      AND (age_range->>'min') ~ '^[0-9]+$'
      AND (age_range->>'min')::INTEGER >= 18
    )
  );

UPDATE event_categories
SET layout_key = 'standard'
WHERE layout_key IS NULL;

ALTER TABLE event_categories
ALTER COLUMN layout_key SET DEFAULT 'standard';

ALTER TABLE event_categories
ALTER COLUMN layout_key SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_categories_layout_key_check'
  ) THEN
    ALTER TABLE event_categories
    ADD CONSTRAINT event_categories_layout_key_check
    CHECK (layout_key IN ('standard', 'adult_workshop'));
  END IF;
END $$;

COMMENT ON COLUMN event_categories.layout_key IS
'Controls which frontend workshop template is used for events in this category';
