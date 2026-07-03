/*
|--------------------------------------------------------------------------
| CheckedIn — 016_org_scoping.sql
| Scope events and attendance to owning faculty/org; students see all published
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.staff_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM public.staff_profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS events_read_published ON public.events;

CREATE POLICY events_select_scoped ON public.events
    FOR SELECT USING (
        public.current_user_role() = 'admin'
        OR created_by = auth.uid()
        OR (
            public.current_user_role() = 'student'
            AND status = 'published'
        )
        OR (
            public.current_user_role() = 'faculty'
            AND created_by = auth.uid()
        )
        OR (
            public.current_user_role() = 'org_member'
            AND (
                created_by = auth.uid()
                OR organization_id = public.staff_organization_id()
            )
        )
    );

DROP POLICY IF EXISTS attendance_staff_read ON public.attendance_records;

CREATE POLICY attendance_staff_read_scoped ON public.attendance_records
    FOR SELECT USING (
        public.current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = attendance_records.event_id
            AND (
                e.created_by = auth.uid()
                OR (
                    public.current_user_role() = 'org_member'
                    AND e.organization_id = public.staff_organization_id()
                )
            )
        )
    );

DROP POLICY IF EXISTS students_admin_faculty_select ON public.students;

CREATE POLICY students_staff_select ON public.students
    FOR SELECT USING (
        public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

COMMIT;
