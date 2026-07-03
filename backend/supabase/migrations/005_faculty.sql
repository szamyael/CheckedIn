-- ============================================================================
-- FACULTY
-- ============================================================================

CREATE TABLE public.faculty (

    id UUID PRIMARY KEY
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    employee_number VARCHAR(30)
        NOT NULL
        UNIQUE,

    first_name VARCHAR(100)
        NOT NULL,

    middle_name VARCHAR(100),

    last_name VARCHAR(100)
        NOT NULL,

    department VARCHAR(150)
        NOT NULL,

    position VARCHAR(100),

    contact_number VARCHAR(20),

    profile_photo_url TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()

);

COMMENT ON TABLE public.faculty IS
'Faculty member profile information.';

COMMENT ON COLUMN public.faculty.employee_number IS
'Institution-issued faculty employee number.';

COMMIT;