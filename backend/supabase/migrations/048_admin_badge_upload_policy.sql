BEGIN;

DROP POLICY IF EXISTS org_badges_admin_insert_direct ON public.org_badges;
CREATE POLICY org_badges_admin_insert_direct ON public.org_badges
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

DROP POLICY IF EXISTS badge_images_admin_upload_direct ON storage.objects;
CREATE POLICY badge_images_admin_upload_direct ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'badge-images'
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

COMMIT;
