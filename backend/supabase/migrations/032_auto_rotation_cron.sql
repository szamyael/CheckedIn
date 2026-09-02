/*
|--------------------------------------------------------------------------
| CheckedIn — 032_auto_rotation_cron.sql
| Automatic QR code and OTP rotation with pg_cron
|--------------------------------------------------------------------------
*/

BEGIN;

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ========================================================================
-- AUTO-ROTATE QR CODES
-- ========================================================================
-- Rotates QR tokens every 5 minutes for active events
-- Only affects events that:
--  - Are currently running (now between attendance_starts_at and attendance_ends_at)
--  - Are published status
--  - Have a configured rotation interval

SELECT cron.schedule(
    'rotate-qr-codes-5min',
    '*/5 * * * *',
    $$
    UPDATE public.events
    SET qr_token = gen_random_uuid(),
        qr_rotated_at = NOW(),
        updated_at = NOW()
    WHERE status = 'published'
      AND attendance_starts_at <= NOW()
      AND attendance_ends_at > NOW()
      AND qr_rotation_minutes > 0
      AND (qr_rotated_at IS NULL OR qr_rotated_at + (qr_rotation_minutes || ' minutes')::INTERVAL <= NOW());
    $$
);

-- ========================================================================
-- AUTO-GENERATE OTP CODES
-- ========================================================================
-- Generates fresh OTP codes every minute for active events
-- Ensures there's always a valid OTP code available before the current one expires

SELECT cron.schedule(
    'auto-generate-otp-codes-1min',
    '* * * * *',
    $$
    INSERT INTO public.event_otp_codes (event_id, code, expires_at, created_by)
    SELECT 
        e.id as event_id,
        LPAD(CAST(FLOOR(RANDOM() * 1000000)::INT as text), 6, '0') as code,
        NOW() + (ss.otp_expiry_seconds || ' seconds')::INTERVAL as expires_at,
        COALESCE(
            (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
            e.created_by
        ) as created_by
    FROM public.events e
    JOIN public.system_settings ss ON ss.id = 1
    WHERE e.status = 'published'
      AND e.requires_otp = true
      AND e.attendance_starts_at <= NOW()
      AND e.attendance_ends_at > NOW()
      AND NOT EXISTS (
          SELECT 1 FROM public.event_otp_codes eoc
          WHERE eoc.event_id = e.id
            AND eoc.expires_at > NOW() + INTERVAL '30 seconds'
      );
    $$
);

-- ========================================================================
-- CLEAN UP EXPIRED OTP CODES
-- ========================================================================
-- Deletes expired OTP codes every hour to prevent table bloat

SELECT cron.schedule(
    'cleanup-expired-otp-codes-1hr',
    '0 * * * *',
    $$
    DELETE FROM public.event_otp_codes
    WHERE expires_at < NOW() - INTERVAL '1 minute';
    $$
);

-- ========================================================================
-- LOG QR CODE ROTATIONS (AUDIT TRAIL)
-- ========================================================================
-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS public.qr_rotation_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    old_token UUID,
    new_token UUID NOT NULL,
    rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotation_reason TEXT DEFAULT 'automatic_interval'
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_qr_rotation_audit_event 
    ON public.qr_rotation_audit (event_id, rotated_at DESC);

-- ========================================================================
-- MONITOR CRON JOB STATUS
-- ========================================================================
-- View to check job execution status
CREATE OR REPLACE VIEW public.cron_job_status AS
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
FROM cron.job
WHERE username = 'postgres'
  AND (command LIKE '%qr%' OR command LIKE '%otp%');

COMMIT;
