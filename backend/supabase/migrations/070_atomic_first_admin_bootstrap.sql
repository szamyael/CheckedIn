BEGIN;

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(
    p_user_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM pg_catalog.pg_advisory_xact_lock(81233745124901001);

    IF EXISTS (
        SELECT 1 FROM public.users WHERE role = 'admin'::public.user_role
    ) THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.users (id, role, status, email)
    VALUES (
        p_user_id,
        'admin'::public.user_role,
        'active'::public.account_status,
        p_email
    );

    INSERT INTO public.staff_profiles (id, first_name, last_name)
    VALUES (p_user_id, p_first_name, p_last_name);

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_admin(UUID, TEXT, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(UUID, TEXT, TEXT, TEXT)
    TO service_role;

COMMIT;
