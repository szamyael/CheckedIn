BEGIN;

ALTER TABLE public.org_badges ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('badge-images', 'badge-images', true, 2097152, ARRAY['image/png'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY badge_images_staff_upload ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'badge-images' AND (
    public.current_user_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.id = auth.uid() AND sp.organization_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY student_ids_update_own ON storage.objects
FOR UPDATE USING (bucket_id = 'student-ids' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'student-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMIT;
