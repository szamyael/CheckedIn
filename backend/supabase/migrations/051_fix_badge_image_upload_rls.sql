BEGIN;

-- Storage upsert checks visibility of a matching object before it updates it.
-- The INSERT/UPDATE policies from migration 050 were sufficient for a plain
-- insert but not for every storage-api upsert path.
DROP POLICY IF EXISTS badge_images_authorized_select ON storage.objects;
CREATE POLICY badge_images_authorized_select ON storage.objects
    FOR SELECT USING (
        bucket_id = 'badge-images'
        AND public.can_manage_organization_badges(
            ((storage.foldername(name))[1])::UUID
        )
    );

COMMIT;
