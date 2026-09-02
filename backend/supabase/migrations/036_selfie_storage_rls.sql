/*
|--------------------------------------------------------------------------
| CheckedIn — 036_selfie_storage_rls.sql
| Allow students to upload attendance selfies to their own folder.
|--------------------------------------------------------------------------
*/

BEGIN;

DROP POLICY IF EXISTS selfies_upload ON storage.objects;

CREATE POLICY selfies_upload ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'selfies'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS selfies_read_staff ON storage.objects;

CREATE POLICY selfies_read_staff ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'selfies'
        AND public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

COMMIT;