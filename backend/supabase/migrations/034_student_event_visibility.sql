/*
|--------------------------------------------------------------------------
| CheckedIn — 034_student_event_visibility.sql
| Admin-created events are global; organization events require a mapped
| student program.
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = p_user_id
          AND role = 'admin'
    );
$$;

DROP POLICY IF EXISTS events_select_scoped ON public.events;

CREATE POLICY events_select_scoped ON public.events
    FOR SELECT USING (
        public.current_user_role() = 'admin'
        OR created_by = auth.uid()
        OR (
            public.current_user_role() = 'student'
            AND status = 'published'
            AND (
                organization_id IS NULL
                                OR public.is_admin_user(events.created_by)
                OR organization_id = ANY (
                    public.student_program_organization_ids(auth.uid())
                )
            )
        )
        OR (
            public.current_user_role() = 'faculty'
            AND status = 'published'
        )
        OR (
            public.current_user_role() = 'org_member'
            AND (
                status = 'published'
                OR organization_id = public.staff_organization_id()
            )
        )
    );

COMMIT;