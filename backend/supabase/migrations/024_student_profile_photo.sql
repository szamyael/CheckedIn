/*
|--------------------------------------------------------------------------
| CheckedIn — 024_student_profile_photo.sql
|--------------------------------------------------------------------------
| Store cropped ID-card face as the student profile avatar + allow reads.
*/

BEGIN;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

COMMENT ON COLUMN public.students.profile_photo_url IS
'Storage path to cropped face photo from student ID (student-ids/{user}/avatar.jpg).';

DROP POLICY IF EXISTS student_ids_read_own ON storage.objects;
CREATE POLICY student_ids_read_own ON storage.objects
    FOR SELECT USING (
        bucket_id = 'student-ids'
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.current_user_role() IN ('admin', 'faculty', 'org_member')
        )
    );

COMMIT;
