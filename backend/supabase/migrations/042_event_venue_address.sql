/* Store the human-readable address resolved from event location searches. */

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue_address TEXT;

COMMENT ON COLUMN public.events.venue_address IS
  'Human-readable address resolved from the selected event coordinates.';
