BEGIN;

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
        SELECT 1 FROM public.staff_profiles sp
        JOIN public.users u ON u.id = sp.id
        WHERE sp.id = auth.uid()
          AND u.role = 'org_member'
          AND sp.organization_id = p_organization_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_organization_badges(UUID) TO authenticated;

DROP POLICY IF EXISTS org_badges_authorized_manage ON public.org_badges;
CREATE POLICY org_badges_authorized_manage ON public.org_badges
    FOR ALL
    USING (public.can_manage_organization_badges(organization_id))
    WITH CHECK (public.can_manage_organization_badges(organization_id));

DROP POLICY IF EXISTS badge_images_authorized_upload ON storage.objects;
CREATE POLICY badge_images_authorized_upload ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'badge-images'
        AND public.can_manage_organization_badges(((storage.foldername(name))[1])::UUID)
    );

DROP POLICY IF EXISTS badge_images_authorized_update ON storage.objects;
CREATE POLICY badge_images_authorized_update ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'badge-images'
        AND public.can_manage_organization_badges(((storage.foldername(name))[1])::UUID)
    ) WITH CHECK (
        bucket_id = 'badge-images'
        AND public.can_manage_organization_badges(((storage.foldername(name))[1])::UUID)
    );

COMMIT;
