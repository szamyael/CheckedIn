/*
|--------------------------------------------------------------------------
| CheckedIn — 030_strengthen_org_member_security.sql
| Strengthen event creation RLS; prevent cross-org manipulation
|--------------------------------------------------------------------------
*/

BEGIN;

-- Strengthen event creation RLS to ensure org_members only create events for their org
DROP POLICY IF EXISTS events_insert_org_or_admin ON public.events;

CREATE POLICY events_insert_org_or_admin ON public.events
    FOR INSERT WITH CHECK (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'org_member'
            AND created_by = auth.uid()
            AND organization_id = public.staff_organization_id()
        )
    );

-- Strengthen event update RLS to ensure org_members can only modify their org's events
DROP POLICY IF EXISTS events_update_owner ON public.events;

CREATE POLICY events_update_owner ON public.events
    FOR UPDATE USING (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'org_member'
            AND created_by = auth.uid()
            AND organization_id = public.staff_organization_id()
        )
    )
    WITH CHECK (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'org_member'
            AND created_by = auth.uid()
            AND organization_id = public.staff_organization_id()
        )
    );

-- Strengthen event deletion RLS
DROP POLICY IF EXISTS events_delete_owner ON public.events;

CREATE POLICY events_delete_owner ON public.events
    FOR DELETE USING (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'org_member'
            AND created_by = auth.uid()
            AND organization_id = public.staff_organization_id()
        )
    );

COMMIT;
