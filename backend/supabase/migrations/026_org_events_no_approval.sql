/*
|--------------------------------------------------------------------------
| CheckedIn — 026_org_events_no_approval.sql
| Org events publish directly; staff can read all events (bingo grid, etc.)
|--------------------------------------------------------------------------
*/

BEGIN;

DROP POLICY IF EXISTS events_select_scoped ON public.events;

CREATE POLICY events_select_scoped ON public.events
    FOR SELECT USING (
        public.current_user_role() IN ('admin', 'faculty', 'org_member')
        OR created_by = auth.uid()
        OR (
            public.current_user_role() = 'student'
            AND status = 'published'
        )
    );

COMMIT;
