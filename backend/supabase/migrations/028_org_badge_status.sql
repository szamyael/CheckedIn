/*
|--------------------------------------------------------------------------
| CheckedIn — 028_org_badge_status.sql
| Org badge lifecycle: active and archived
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TYPE public.org_badge_status AS ENUM ('active', 'archived');

ALTER TABLE public.org_badges
    ADD COLUMN IF NOT EXISTS status public.org_badge_status NOT NULL DEFAULT 'active';

COMMENT ON COLUMN public.org_badges.status IS
'Active badges can be assigned to new bingo cards; archived badges are hidden from new use.';

DROP POLICY IF EXISTS org_badges_student_read ON public.org_badges;

CREATE POLICY org_badges_student_read ON public.org_badges
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND status = 'active'
    );

COMMIT;
