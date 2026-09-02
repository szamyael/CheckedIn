/*
|--------------------------------------------------------------------------
| CheckedIn — 033_organization_program_alignment.sql
| Allow admins to map programs/courses to organizations and restrict
| student visibility to mapped organizations.
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TABLE IF NOT EXISTS public.organization_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    program TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, program)
);

CREATE INDEX IF NOT EXISTS idx_org_programs_org
    ON public.organization_programs (organization_id);

CREATE INDEX IF NOT EXISTS idx_org_programs_program
    ON public.organization_programs (program);

CREATE OR REPLACE FUNCTION public.student_program_organization_ids(p_student_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        array_agg(DISTINCT op.organization_id),
        ARRAY[]::UUID[]
    )
    FROM public.organization_programs op
    JOIN public.students s
      ON lower(trim(s.program)) = lower(trim(op.program))
    WHERE s.id = p_student_id;
$$;

ALTER TABLE public.organization_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_programs_admin_all ON public.organization_programs
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY organization_programs_org_read ON public.organization_programs
    FOR SELECT USING (
        public.current_user_role() IN ('org_member', 'faculty')
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY organization_programs_student_read ON public.organization_programs
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND organization_id = ANY (
            public.student_program_organization_ids(auth.uid())
        )
    );

DROP POLICY IF EXISTS events_select_scoped ON public.events;

CREATE POLICY events_select_scoped ON public.events
    FOR SELECT USING (
        public.current_user_role() = 'admin'
        OR public.current_user_role() = 'faculty'
        OR created_by = auth.uid()
        OR (
            public.current_user_role() = 'org_member'
            AND (
                status = 'published'
                OR organization_id = public.staff_organization_id()
            )
        )
        OR (
            public.current_user_role() = 'student'
            AND status = 'published'
            AND (
                organization_id = ANY (public.student_program_organization_ids(auth.uid()))
                OR organization_id IS NULL
            )
        )
    );

DROP POLICY IF EXISTS bingo_cards_student_read_active ON public.bingo_cards;

CREATE POLICY bingo_cards_student_read_active ON public.bingo_cards
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND status = 'active'
        AND (
            organization_id = ANY (public.student_program_organization_ids(auth.uid()))
            OR organization_id IS NULL
        )
    );

DROP POLICY IF EXISTS org_badges_student_read ON public.org_badges;

CREATE POLICY org_badges_student_read ON public.org_badges
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND organization_id = ANY (public.student_program_organization_ids(auth.uid()))
    );

COMMIT;
