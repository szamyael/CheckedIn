BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'offline_attendance_submissions'
    ) THEN
        ALTER PUBLICATION supabase_realtime
            ADD TABLE public.offline_attendance_submissions;
    END IF;
END;
$$;

COMMIT;
