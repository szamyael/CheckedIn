BEGIN;

ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active'
        CHECK (moderation_status IN ('active', 'suspended')),
    ADD COLUMN IF NOT EXISTS moderation_note TEXT,
    ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_moderation_status
    ON public.organizations (moderation_status);

-- Suspension takes effect immediately for badge management while preserving
-- administrator access for remediation and review.
CREATE OR REPLACE FUNCTION public.can_manage_organization_badges(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'admin'
    ) OR EXISTS (
        SELECT 1
        FROM public.staff_profiles sp
        JOIN public.users u ON u.id = sp.id
        JOIN public.organizations o ON o.id = sp.organization_id
        WHERE sp.id = auth.uid()
          AND u.role = 'org_member'
          AND sp.organization_id = p_organization_id
          AND o.moderation_status = 'active'
    );
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
