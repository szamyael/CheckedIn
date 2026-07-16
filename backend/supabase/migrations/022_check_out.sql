/*
|--------------------------------------------------------------------------
| CheckedIn — 022_check_out.sql
|--------------------------------------------------------------------------
| Allow students to check out of an event by scanning the event QR again.
*/

BEGIN;

DO $$
BEGIN
    ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'checked_out';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.attendance_records
    ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ;

COMMENT ON COLUMN public.attendance_records.checked_out_at IS
'When the student checked out by scanning the event QR again.';

COMMIT;
