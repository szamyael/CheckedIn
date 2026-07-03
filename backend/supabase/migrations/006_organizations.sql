-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

CREATE TABLE public.organizations (

    id UUID PRIMARY KEY
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    organization_name VARCHAR(200)
        NOT NULL
        UNIQUE,

    acronym VARCHAR(30),

    adviser_name VARCHAR(200),

    representative_name VARCHAR(200)
        NOT NULL,

    logo_url TEXT,

    description TEXT,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()

);

COMMENT ON TABLE public.organizations IS
'Registered student organizations.';

COMMIT;