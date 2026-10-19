BEGIN;

ALTER TABLE public.events
  ADD COLUMN requires_location BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.events
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL,
  ADD CONSTRAINT events_location_required
    CHECK (NOT requires_location OR (latitude IS NOT NULL AND longitude IS NOT NULL));

ALTER TABLE public.attendance_records
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

COMMENT ON COLUMN public.events.requires_location IS
  'Whether student check-in requires GPS geofence verification.';

COMMIT;
