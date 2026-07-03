/*
|--------------------------------------------------------------------------
| CheckedIn — 019_staff_event_visibility.sql
| Faculty and org members can view all published events (incl. admin-posted)
| and attendance for monitoring / QR display.
|--------------------------------------------------------------------------
*/

BEGIN;

DROP POLICY IF EXISTS events_select_scoped ON public.events;

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

DROP POLICY IF EXISTS attendance_staff_read_scoped ON public.attendance_records;

CREATE POLICY attendance_staff_read_scoped ON public.attendance_records
    FOR SELECT USING (
        public.current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = attendance_records.event_id
            AND (
                e.created_by = auth.uid()
                OR (
                    public.current_user_role() = 'faculty'
                    AND e.status = 'published'
                )
                OR (
                    public.current_user_role() = 'org_member'
                    AND (
                        e.status = 'published'
                        OR e.organization_id = public.staff_organization_id()
                    )
                )
            )
        )
    );

COMMIT;
