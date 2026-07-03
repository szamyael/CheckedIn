/*
|--------------------------------------------------------------------------
| CheckedIn — 013_phase_a_schema.sql
| Attendance window, QR expiry, student year level
|--------------------------------------------------------------------------
*/

BEGIN;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS year_level INTEGER
        CHECK (year_level >= 1 AND year_level <= 5);

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS attendance_starts_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS attendance_ends_at TIMESTAMPTZ;

UPDATE public.events
SET
    attendance_starts_at = starts_at,
    attendance_ends_at = ends_at,
    qr_expires_at = COALESCE(qr_expires_at, ends_at)
WHERE attendance_starts_at IS NULL;

ALTER TABLE public.events
    ALTER COLUMN attendance_starts_at SET NOT NULL,
    ALTER COLUMN attendance_ends_at SET NOT NULL;

ALTER TABLE public.events
    ADD CONSTRAINT events_attendance_window
        CHECK (attendance_ends_at > attendance_starts_at);

COMMENT ON COLUMN public.events.attendance_starts_at IS
'When students may begin checking in (may differ from event starts_at).';

COMMENT ON COLUMN public.events.attendance_ends_at IS
'When check-in closes; also used as QR token expiry if qr_expires_at is null.';

COMMENT ON COLUMN public.students.year_level IS
'Academic year level (1–5).';

COMMIT;
