/*
  Organization membership payment records and organization-scoped account control.
  A student can only be activated or disabled by an organization mapped to the
  student's program/course.
*/

BEGIN;

CREATE TABLE IF NOT EXISTS public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_org_paid
    ON public.organization_memberships (organization_id, paid_at);

ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_org_member_student_read
    ON public.users
    FOR SELECT USING (
        public.current_user_role() = 'org_member'
        AND role = 'student'
    );

CREATE POLICY organization_memberships_org_read
    ON public.organization_memberships
    FOR SELECT USING (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'org_member'
            AND organization_id = public.staff_organization_id()
        )
    );

CREATE POLICY organization_memberships_admin_write
    ON public.organization_memberships
    FOR ALL USING (public.current_user_role() = 'admin');

COMMENT ON TABLE public.organization_memberships IS
'Organization membership payment records. paid_at being non-null means the fee was recorded as paid.';

COMMIT;
