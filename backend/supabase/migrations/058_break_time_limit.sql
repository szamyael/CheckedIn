/*
| CheckedIn — 058_break_time_limit.sql
| Optional max duration a student may remain on break for an event.
*/

BEGIN;

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS break_time_limit_minutes INTEGER
        CHECK (
            break_time_limit_minutes IS NULL
            OR (break_time_limit_minutes >= 1 AND break_time_limit_minutes <= 1440)
        );

COMMENT ON COLUMN public.events.break_time_limit_minutes IS
    'Maximum minutes a student may stay on break after break-out. Null means no limit. After this window they cannot break in or check out.';

COMMIT;
