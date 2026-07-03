/*
|--------------------------------------------------------------------------
| CheckedIn
|--------------------------------------------------------------------------
| Migration : 005_event_tables.sql
| Description:
|   Creates event management tables.
|--------------------------------------------------------------------------
*/

BEGIN;

-- ============================================================================
-- EVENTS
-- ============================================================================

CREATE TABLE public.events (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    title VARCHAR(200)
        NOT NULL,

    description TEXT,

    organizer_id UUID
        NOT NULL
        REFERENCES public.users(id)
        ON DELETE RESTRICT,

    organizer_type organizer_type
        NOT NULL,

    banner_url TEXT,

    start_datetime TIMESTAMPTZ
        NOT NULL,

    end_datetime TIMESTAMPTZ
        NOT NULL,

    status event_status
        NOT NULL
        DEFAULT 'draft',

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT chk_event_schedule
        CHECK (end_datetime > start_datetime)

);

COMMENT ON TABLE public.events IS
'Master event information.';

-- ============================================================================
-- EVENT LOCATIONS
-- ============================================================================

CREATE TABLE public.event_locations (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    event_id UUID
        NOT NULL
        REFERENCES public.events(id)
        ON DELETE CASCADE,

    venue_name VARCHAR(200)
        NOT NULL,

    address TEXT,

    latitude DOUBLE PRECISION
        NOT NULL,

    longitude DOUBLE PRECISION
        NOT NULL,

    attendance_radius INTEGER
        NOT NULL
        DEFAULT 100,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT chk_radius
        CHECK (attendance_radius > 0)

);

COMMENT ON TABLE public.event_locations IS
'GPS location used for attendance verification.';

-- ============================================================================
-- EVENT SESSIONS
-- ============================================================================

CREATE TABLE public.event_sessions (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    event_id UUID
        NOT NULL
        REFERENCES public.events(id)
        ON DELETE CASCADE,

    session_name VARCHAR(100)
        NOT NULL,

    attendance_start TIMESTAMPTZ
        NOT NULL,

    attendance_end TIMESTAMPTZ
        NOT NULL,

    is_active BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT chk_attendance_window
        CHECK (attendance_end > attendance_start)

);

COMMENT ON TABLE public.event_sessions IS
'Attendance windows for an event.';

-- ============================================================================
-- EVENT QR CODES
-- ============================================================================

CREATE TABLE public.event_qr_codes (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    session_id UUID
        NOT NULL
        REFERENCES public.event_sessions(id)
        ON DELETE CASCADE,

    qr_token TEXT
        NOT NULL
        UNIQUE,

    expires_at TIMESTAMPTZ
        NOT NULL,

    status qr_status
        NOT NULL
        DEFAULT 'generated',

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()

);

COMMENT ON TABLE public.event_qr_codes IS
'Secure QR tokens for attendance sessions.';

COMMIT;