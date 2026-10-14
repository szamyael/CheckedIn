BEGIN;

ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS location_accuracy_m DOUBLE PRECISION;

COMMENT ON COLUMN public.attendance_records.location_accuracy_m IS
  'Device-reported horizontal GPS accuracy in meters at check-in time.';

COMMIT;
