/*
|--------------------------------------------------------------------------
| CheckedIn — 007_attendance.sql
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_id UUID NOT NULL
        REFERENCES public.events(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,

    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,

    selfie_url TEXT NOT NULL,

    status public.attendance_status NOT NULL DEFAULT 'checked_in',

    distance_from_venue_m DOUBLE PRECISION,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT attendance_one_per_event
        UNIQUE (event_id, student_id)
);

COMMENT ON TABLE public.attendance_records IS
'Student check-in records with geolocation, selfie, and server timestamp.';

CREATE INDEX idx_attendance_event ON public.attendance_records (event_id);
CREATE INDEX idx_attendance_student ON public.attendance_records (student_id);
CREATE INDEX idx_attendance_checked_in_at ON public.attendance_records (checked_in_at);

COMMIT;
