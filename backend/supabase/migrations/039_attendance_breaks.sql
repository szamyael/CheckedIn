/*
| CheckedIn — 039_attendance_breaks.sql
| Records a student's temporary exit and return during an event.
*/

BEGIN;

DO $$
BEGIN
    ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'on_break';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.attendance_records
    ADD COLUMN IF NOT EXISTS break_out_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS break_in_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS break_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.attendance_records.break_out_at IS
    'Most recent time the student temporarily left the event.';
COMMENT ON COLUMN public.attendance_records.break_in_at IS
    'Most recent time the student returned from a break.';
COMMENT ON COLUMN public.attendance_records.break_count IS
    'Number of completed or active break periods during this event.';

CREATE INDEX IF NOT EXISTS idx_attendance_event_status_updated
    ON public.attendance_records (event_id, status, checked_in_at DESC);

COMMIT;
