BEGIN;

ALTER TABLE public.org_badges
    ADD COLUMN IF NOT EXISTS earning_criteria TEXT;

-- Some legacy staff sessions resolve their organization correctly but do not
-- satisfy the older role helper. Keep the scope to the staff member's own org.
DROP POLICY IF EXISTS org_badges_assigned_staff_insert ON public.org_badges;
CREATE POLICY org_badges_assigned_staff_insert ON public.org_badges
    FOR INSERT WITH CHECK (
        public.current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.staff_profiles sp
            WHERE sp.id = auth.uid()
              AND sp.organization_id = org_badges.organization_id
        )
    );

COMMIT;
