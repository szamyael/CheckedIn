/*
|--------------------------------------------------------------------------
| CheckedIn — 005_staff.sql
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.staff_profiles (
    id UUID PRIMARY KEY
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    department TEXT,

    organization_id UUID
        REFERENCES public.organizations(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT staff_org_member_requires_org
        CHECK (
            organization_id IS NOT NULL
            OR TRUE
        )
);

COMMENT ON TABLE public.staff_profiles IS
'Faculty and organization member profiles. Admins create these accounts.';

CREATE INDEX idx_staff_organization ON public.staff_profiles (organization_id);

COMMIT;
