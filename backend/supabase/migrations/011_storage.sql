/*
|--------------------------------------------------------------------------
| CheckedIn — 011_storage.sql
|--------------------------------------------------------------------------
*/

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('student-ids', 'student-ids', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('selfies', 'selfies', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY student_ids_upload ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'student-ids'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY selfies_upload ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'selfies'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY selfies_read_staff ON storage.objects
    FOR SELECT USING (
        bucket_id = 'selfies'
        AND public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

COMMIT;
