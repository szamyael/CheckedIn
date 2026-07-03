-- ============================================================================
-- ADMINISTRATORS
-- ============================================================================

CREATE TABLE public.administrators (

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

    position VARCHAR(100),

    contact_number VARCHAR(20),

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()

);

COMMENT ON TABLE public.administrators IS
'Administrator profile information.';

COMMIT;