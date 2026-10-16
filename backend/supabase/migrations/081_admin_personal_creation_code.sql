BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.admin_personal_codes (
    admin_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    failed_attempts SMALLINT NOT NULL DEFAULT 0 CHECK (failed_attempts BETWEEN 0 AND 5),
    locked_until TIMESTAMPTZ
);

ALTER TABLE public.admin_personal_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_personal_codes FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.has_admin_personal_code()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_personal_codes c
        JOIN public.users u ON u.id = c.admin_id
        WHERE c.admin_id = auth.uid()
          AND u.role = 'admin'
          AND u.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.set_admin_personal_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    IF p_code IS NULL OR p_code !~ '^[0-9]{6}$' THEN
        RAISE EXCEPTION 'Personal code must be exactly six digits.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = v_admin_id
          AND u.role = 'admin'
          AND u.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Only an active admin can set a personal code.';
    END IF;

    INSERT INTO public.admin_personal_codes (admin_id, code_hash)
    VALUES (v_admin_id, extensions.crypt(p_code, extensions.gen_salt('bf')))
    ON CONFLICT (admin_id) DO UPDATE
    SET code_hash = EXCLUDED.code_hash,
        failed_attempts = 0,
        locked_until = NULL;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_personal_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_code_hash TEXT;
    v_failed_attempts SMALLINT;
    v_locked_until TIMESTAMPTZ;
BEGIN
    IF p_code IS NULL OR p_code !~ '^[0-9]{6}$' THEN
        RETURN FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = v_admin_id
          AND u.role = 'admin'
          AND u.status = 'active'
    ) THEN
        RETURN FALSE;
    END IF;

    SELECT code_hash, failed_attempts, locked_until
    INTO v_code_hash, v_failed_attempts, v_locked_until
    FROM public.admin_personal_codes
    WHERE admin_id = v_admin_id
    FOR UPDATE;

    IF NOT FOUND OR v_locked_until > NOW() THEN
        RETURN FALSE;
    END IF;

    IF extensions.crypt(p_code, v_code_hash) = v_code_hash THEN
        UPDATE public.admin_personal_codes
        SET failed_attempts = 0,
            locked_until = NULL
        WHERE admin_id = v_admin_id;
        RETURN TRUE;
    END IF;

    v_failed_attempts := LEAST(v_failed_attempts + 1, 5);
    UPDATE public.admin_personal_codes
    SET failed_attempts = v_failed_attempts,
        locked_until = CASE
            WHEN v_failed_attempts >= 5 THEN NOW() + INTERVAL '15 minutes'
            ELSE NULL
        END
    WHERE admin_id = v_admin_id;

    RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.has_admin_personal_code() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_admin_personal_code(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_admin_personal_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_personal_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_personal_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_personal_code(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
