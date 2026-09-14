BEGIN;

-- Keep badge visibility consistent with events (034) and bingo cards (035):
-- administrator-authored content is institution-wide, while content authored
-- by organization members is limited to the organization's mapped programs.
DROP POLICY IF EXISTS org_badges_student_read ON public.org_badges;
CREATE POLICY org_badges_student_read ON public.org_badges
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND status = 'active'
        AND (
            public.is_admin_user(created_by)
            OR organization_id = ANY (
                public.student_program_organization_ids(auth.uid())
            )
        )
    );

COMMIT;
