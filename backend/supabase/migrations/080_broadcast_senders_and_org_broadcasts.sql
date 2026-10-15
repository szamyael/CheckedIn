BEGIN;

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_role TEXT,
    ADD COLUMN IF NOT EXISTS sender_organization_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_avatar_path TEXT;

DROP POLICY IF EXISTS staff_profile_avatars_authenticated_read ON storage.objects;
CREATE POLICY staff_profile_avatars_authenticated_read ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'profile-avatars');

CREATE OR REPLACE FUNCTION public.send_organization_broadcast(
    p_title TEXT,
    p_body TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_id UUID := auth.uid();
    v_role public.user_role;
    v_organization_id UUID;
    v_organization_name TEXT;
    v_sender_name TEXT;
    v_avatar_path TEXT;
    v_count INTEGER;
BEGIN
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'Sign in to send an organization broadcast.';
    END IF;

    SELECT u.role
    INTO v_role
    FROM public.users u
    WHERE u.id = v_sender_id
      AND u.status = 'active';

    IF v_role IS DISTINCT FROM 'org_member'::public.user_role THEN
        RAISE EXCEPTION 'Only active organization members can send organization broadcasts.';
    END IF;

    IF p_title IS NULL OR char_length(btrim(p_title)) = 0 OR char_length(btrim(p_title)) > 120 THEN
        RAISE EXCEPTION 'Title must contain between 1 and 120 characters.';
    END IF;

    IF p_body IS NULL OR char_length(btrim(p_body)) = 0 OR char_length(btrim(p_body)) > 2000 THEN
        RAISE EXCEPTION 'Message must contain between 1 and 2000 characters.';
    END IF;

    SELECT
        sp.organization_id,
        o.name,
        concat_ws(' ', nullif(btrim(sp.first_name), ''), nullif(btrim(sp.middle_name), ''), nullif(btrim(sp.last_name), '')),
        sp.profile_photo_url
    INTO v_organization_id, v_organization_name, v_sender_name, v_avatar_path
    FROM public.staff_profiles sp
    JOIN public.organizations o ON o.id = sp.organization_id
    WHERE sp.id = v_sender_id
      AND o.moderation_status = 'active';

    IF NOT FOUND OR v_organization_id IS NULL THEN
        RAISE EXCEPTION 'Your staff profile must belong to an active organization to send a broadcast.';
    END IF;

    INSERT INTO public.notifications (
        user_id,
        title,
        body,
        notification_type,
        sender_id,
        sender_name,
        sender_role,
        sender_organization_name,
        sender_avatar_path
    )
    SELECT DISTINCT
        u.id,
        btrim(p_title),
        btrim(p_body),
        'general',
        v_sender_id,
        v_sender_name,
        'org_member',
        v_organization_name,
        v_avatar_path
    FROM public.users u
    JOIN public.students s ON s.id = u.id
    JOIN public.organization_programs op
      ON op.organization_id = v_organization_id
     AND public.program_name_key(s.program) = public.program_name_key(op.program)
    WHERE u.role = 'student'
      AND u.status = 'active'
      AND public.program_name_key(s.program) <> '';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    IF v_count > 0 THEN
        PERFORM public.log_audit(
            'organization_broadcast_notification',
            'organization',
            v_organization_id,
            jsonb_build_object('count', v_count, 'title', btrim(p_title))
        );
    END IF;

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.send_organization_broadcast(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_organization_broadcast(TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
