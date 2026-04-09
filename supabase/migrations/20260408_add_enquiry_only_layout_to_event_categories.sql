-- Allow enquiry-only categories that route customers to email rather than checkout.

ALTER TABLE event_categories
DROP CONSTRAINT IF EXISTS event_categories_layout_key_check;

ALTER TABLE event_categories
ADD CONSTRAINT event_categories_layout_key_check
CHECK (layout_key IN ('standard', 'adult_workshop', 'enquiry_only'));

COMMENT ON COLUMN event_categories.layout_key IS
'Controls which frontend workshop template is used for events in this category, including enquiry-only events that use email instead of checkout';
