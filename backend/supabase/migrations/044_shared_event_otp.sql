/*
|--------------------------------------------------------------------------
| CheckedIn — 044_shared_event_otp.sql
| One active OTP per event, shared by every staff console.
|--------------------------------------------------------------------------
*/

BEGIN;

-- Serializing by event prevents two staff browsers (or two views in one
-- browser) from issuing different valid OTPs at the same time.
CREATE OR REPLACE FUNCTION public.get_or_create_event_otp(
    p_event_id UUID,
    p_created_by UUID
)
RETURNS TABLE (
    code TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    generated BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expiry_seconds INTEGER;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id::TEXT, 0));

    RETURN QUERY
    SELECT eoc.code, eoc.expires_at, eoc.created_at, false
    FROM public.event_otp_codes eoc
    WHERE eoc.event_id = p_event_id
      AND eoc.expires_at > NOW()
    ORDER BY eoc.created_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN;
    END IF;

    SELECT COALESCE(ss.otp_expiry_seconds, 60)
    INTO v_expiry_seconds
    FROM public.system_settings ss
    WHERE ss.id = 1;

    v_expiry_seconds := COALESCE(v_expiry_seconds, 60);

    RETURN QUERY
    INSERT INTO public.event_otp_codes (event_id, code, expires_at, created_by)
    VALUES (
        p_event_id,
        lpad(floor(random() * 1000000)::INTEGER::TEXT, 6, '0'),
        NOW() + make_interval(secs => v_expiry_seconds),
        p_created_by
    )
    RETURNING event_otp_codes.code, event_otp_codes.expires_at,
        event_otp_codes.created_at, true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_event_otp(UUID, UUID) TO service_role;

-- The web console listens to this table so a code produced by one staff
-- member appears immediately in every other authorized staff view.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'event_otp_codes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.event_otp_codes;
    END IF;
END $$;

COMMIT;
