BEGIN;

ALTER TABLE public.offline_attendance_submissions
    ADD COLUMN IF NOT EXISTS device_utc_offset_minutes SMALLINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'offline_attendance_device_offset_range'
          AND conrelid = 'public.offline_attendance_submissions'::regclass
    ) THEN
        ALTER TABLE public.offline_attendance_submissions
            ADD CONSTRAINT offline_attendance_device_offset_range
            CHECK (device_utc_offset_minutes BETWEEN -840 AND 840);
    END IF;
END $$;

DO $$
DECLARE
    v_job_id BIGINT;
BEGIN
    FOR v_job_id IN
        SELECT jobid
        FROM cron.job
        WHERE jobname = 'cleanup-expired-otp-codes-1hr'
    LOOP
        PERFORM cron.unschedule(v_job_id);
    END LOOP;

    PERFORM cron.schedule(
        'cleanup-expired-otp-codes-1hr',
        '0 * * * *',
        $cleanup$
            DELETE FROM public.event_otp_codes
            WHERE expires_at < NOW() - INTERVAL '7 days';
        $cleanup$
    );
END $$;

COMMIT;
