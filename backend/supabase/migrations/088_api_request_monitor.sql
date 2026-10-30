BEGIN;

CREATE TABLE public.api_request_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    method text NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    path text NOT NULL,
    status_code integer NOT NULL CHECK (status_code BETWEEN 100 AND 599),
    duration_ms integer NOT NULL CHECK (duration_ms >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX api_request_logs_created_at_idx
    ON public.api_request_logs (created_at DESC);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.api_request_logs FROM anon, authenticated;
GRANT SELECT ON public.api_request_logs TO authenticated;
GRANT ALL ON public.api_request_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.api_request_logs_id_seq TO service_role;

CREATE POLICY api_request_logs_admin_read
    ON public.api_request_logs
    FOR SELECT
    TO authenticated
    USING (public.current_user_role() = 'admin');

SELECT cron.schedule(
    'cleanup-api-request-logs-1hr',
    '0 * * * *',
    $$
    DELETE FROM public.api_request_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
    $$
);

COMMIT;
