/*
|--------------------------------------------------------------------------
| CheckedIn
|--------------------------------------------------------------------------
| Migration : 006_attendance_tables.sql
| Description:
|   Attendance subsystem.
|--------------------------------------------------------------------------
*/

BEGIN;

-- ============================================================================
-- ATTENDANCE
-- ============================================================================

CREATE TABLE public.attendance (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    event_id UUID
        NOT NULL
        REFERENCES public.events(id)
        ON DELETE CASCADE,

    session_id UUID
        NOT NULL
        REFERENCES public.event_sessions(id)
        ON DELETE CASCADE,

    student_id UUID
        NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,

    attendance_status attendance_status
        NOT NULL
        DEFAULT 'pending',

    qr_status verification_status
        NOT NULL
        DEFAULT 'pending',

    gps_status verification_status
        NOT NULL
        DEFAULT 'pending',

    selfie_status verification_status
        NOT NULL
        DEFAULT 'pending',

    attended_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    remarks TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT uq_attendance_per_session
        UNIQUE(session_id, student_id)

);

COMMENT ON TABLE public.attendance IS
'Primary attendance record.';

-- ============================================================================
-- ATTENDANCE LOCATIONS
-- ============================================================================

CREATE TABLE public.attendance_locations (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    attendance_id UUID
        NOT NULL
        REFERENCES public.attendance(id)
        ON DELETE CASCADE,

    latitude DOUBLE PRECISION
        NOT NULL,

    longitude DOUBLE PRECISION
        NOT NULL,

    distance_meters NUMERIC(8,2)
        NOT NULL,

    location_verified BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    captured_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()

);

COMMENT ON TABLE public.attendance_locations IS
'Captured GPS information during attendance.';

-- ============================================================================
-- ATTENDANCE SELFIES
-- ============================================================================

CREATE TABLE public.attendance_selfies (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    attendance_id UUID
        NOT NULL
        UNIQUE
        REFERENCES public.attendance(id)
        ON DELETE CASCADE,

    selfie_url TEXT
        NOT NULL,

    confidence_score NUMERIC(5,2),

    verification_result verification_status
        NOT NULL
        DEFAULT 'pending',

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()

);

COMMENT ON TABLE public.attendance_selfies IS
'Stores live attendance selfie metadata.';

-- ============================================================================
-- ATTENDANCE LOGS
-- ============================================================================

CREATE TABLE public.attendance_logs (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    attendance_id UUID
        NOT NULL
        REFERENCES public.attendance(id)
        ON DELETE CASCADE,

    action VARCHAR(100)
        NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()

);

COMMENT ON TABLE public.attendance_logs IS
'Audit trail for attendance verification events.';

COMMIT;