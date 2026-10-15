BEGIN;

ALTER TABLE public.staff_profiles
    ADD COLUMN IF NOT EXISTS middle_name TEXT,
    ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

CREATE POLICY staff_profiles_update_own ON public.staff_profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

REVOKE UPDATE ON public.staff_profiles FROM authenticated;
GRANT UPDATE (first_name, middle_name, last_name, profile_photo_url)
    ON public.staff_profiles TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-avatars',
    'profile-avatars',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY staff_profile_avatars_own_access ON storage.objects
    FOR ALL USING (
        bucket_id = 'profile-avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND public.current_user_role() IN ('admin', 'faculty', 'org_member')
    )
    WITH CHECK (
        bucket_id = 'profile-avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

CREATE OR REPLACE FUNCTION public.sync_user_email_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.sync_user_email_from_auth();

COMMIT;
