/*
|--------------------------------------------------------------------------
| CheckedIn — 020_fr_completion.sql
| FR completion: event approval, OTP, audit, feedback, settings, section
|--------------------------------------------------------------------------
*/

BEGIN;

DO $$ BEGIN
    ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'pending_approval';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'late';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'excused';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS section TEXT,
    ADD COLUMN IF NOT EXISTS reward_points INTEGER NOT NULL DEFAULT 0
        CHECK (reward_points >= 0);

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS requires_otp BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS qr_rotated_at TIMESTAMPTZ;

ALTER TABLE public.attendance_records
    ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS fraud_flag BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    otp_expiry_seconds INTEGER NOT NULL DEFAULT 60
        CHECK (otp_expiry_seconds BETWEEN 30 AND 600),
    qr_rotation_minutes INTEGER NOT NULL DEFAULT 0
        CHECK (qr_rotation_minutes BETWEEN 0 AND 1440),
    session_timeout_minutes INTEGER NOT NULL DEFAULT 480
        CHECK (session_timeout_minutes BETWEEN 15 AND 1440),
    late_grace_minutes INTEGER NOT NULL DEFAULT 15
        CHECK (late_grace_minutes BETWEEN 0 AND 120),
    default_requires_otp BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

INSERT INTO public.system_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.event_otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_otp_event_expires
    ON public.event_otp_codes (event_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON public.audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS public.event_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT event_feedback_unique UNIQUE (event_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.attendance_correction_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_record_id UUID REFERENCES public.attendance_records(id) ON DELETE SET NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.log_audit(
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.increment_student_points(
    p_student_id UUID,
    p_points INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.students
    SET reward_points = reward_points + GREATEST(p_points, 0)
    WHERE id = p_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_student_points TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_correction_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_admin ON public.system_settings
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY system_settings_read_staff ON public.system_settings
    FOR SELECT USING (
        public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

CREATE POLICY event_otp_staff_read ON public.event_otp_codes
    FOR SELECT USING (
        public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

CREATE POLICY audit_logs_admin ON public.audit_logs
    FOR SELECT USING (public.current_user_role() = 'admin');

CREATE POLICY event_feedback_student_insert ON public.event_feedback
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY event_feedback_student_read ON public.event_feedback
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY event_feedback_staff_read ON public.event_feedback
    FOR SELECT USING (
        public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

CREATE POLICY correction_staff_insert ON public.attendance_correction_requests
    FOR INSERT WITH CHECK (
        requested_by = auth.uid()
        AND public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

CREATE POLICY correction_staff_read ON public.attendance_correction_requests
    FOR SELECT USING (
        public.current_user_role() = 'admin'
        OR requested_by = auth.uid()
    );

CREATE POLICY correction_admin_update ON public.attendance_correction_requests
    FOR UPDATE USING (public.current_user_role() = 'admin');

CREATE POLICY notifications_admin_insert ON public.notifications
    FOR INSERT WITH CHECK (public.current_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE ON public.system_settings TO authenticated;
GRANT SELECT ON public.event_otp_codes TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT ON public.event_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.attendance_correction_requests TO authenticated;

CREATE POLICY students_update_own ON public.students
    FOR UPDATE USING (id = auth.uid());

COMMIT;
