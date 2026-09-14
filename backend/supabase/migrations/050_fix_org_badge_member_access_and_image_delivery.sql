BEGIN;

-- Badge artwork is rendered with getPublicUrl() by both the organization
-- console and student-facing surfaces.  Older environments may already have
-- this bucket from before it was made public, so ON CONFLICT in migration 045
-- did not update the bucket setting.
UPDATE storage.buckets
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png']::text[]
WHERE id = 'badge-images';

-- Keep this migration independently deployable: some environments received
-- the badge table and bucket changes without migration 049.
CREATE OR REPLACE FUNCTION public.can_manage_organization_badges(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
    )
    OR EXISTS (
        SELECT 1
        FROM public.staff_profiles sp
        JOIN public.users u ON u.id = sp.id
        WHERE sp.id = auth.uid()
          AND u.role = 'org_member'
          AND sp.organization_id = p_organization_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_organization_badges(UUID) TO authenticated;

-- Replace the accumulated legacy policies with one organization-scoped rule.
-- An org member must have both the org_member role and a staff profile linked
-- to the target organization.  The SECURITY DEFINER helper from migration 049
-- reads these records without being affected by staff-profile RLS.
DROP POLICY IF EXISTS org_badges_admin_all ON public.org_badges;
DROP POLICY IF EXISTS org_badges_org_manage ON public.org_badges;
DROP POLICY IF EXISTS org_badges_assigned_staff_insert ON public.org_badges;
DROP POLICY IF EXISTS org_badges_admin_insert_direct ON public.org_badges;
DROP POLICY IF EXISTS org_badges_authorized_manage ON public.org_badges;

CREATE POLICY org_badges_authorized_manage ON public.org_badges
    FOR ALL
    USING (public.can_manage_organization_badges(organization_id))
    WITH CHECK (public.can_manage_organization_badges(organization_id));

DROP POLICY IF EXISTS badge_images_staff_upload ON storage.objects;
DROP POLICY IF EXISTS badge_images_admin_upload_direct ON storage.objects;
DROP POLICY IF EXISTS badge_images_authorized_upload ON storage.objects;
DROP POLICY IF EXISTS badge_images_authorized_update ON storage.objects;
DROP POLICY IF EXISTS badge_images_authorized_delete ON storage.objects;

CREATE POLICY badge_images_authorized_insert ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'badge-images'
        AND public.can_manage_organization_badges(
            ((storage.foldername(name))[1])::UUID
        )
    );

CREATE POLICY badge_images_authorized_update ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'badge-images'
        AND public.can_manage_organization_badges(
            ((storage.foldername(name))[1])::UUID
        )
    )
    WITH CHECK (
        bucket_id = 'badge-images'
        AND public.can_manage_organization_badges(
            ((storage.foldername(name))[1])::UUID
        )
    );

CREATE POLICY badge_images_authorized_delete ON storage.objects
    FOR DELETE USING (
        bucket_id = 'badge-images'
        AND public.can_manage_organization_badges(
            ((storage.foldername(name))[1])::UUID
        )
    );

COMMIT;
