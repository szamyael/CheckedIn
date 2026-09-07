/*
|--------------------------------------------------------------------------
| CheckedIn — 038_offline_attendance_review.sql
| Offline QR captures are evidence for staff review, never automatic
| attendance. Location is intentionally absent from this workflow.
|--------------------------------------------------------------------------
*/

BEGIN;

DO $$
BEGIN
    CREATE TYPE public.offline_attendance_action AS ENUM ('check_in', 'check_out');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE public.offline_attendance_review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.offline_attendance_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_submission_id UUID NOT NULL UNIQUE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    action public.offline_attendance_action NOT NULL,
    qr_token TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL,
    selfie_url TEXT NOT NULL,
    otp_verified_at_capture BOOLEAN NOT NULL DEFAULT false,
    capture_integrity JSONB,
    review_status public.offline_attendance_review_status NOT NULL DEFAULT 'pending',
    review_note TEXT,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offline_attendance_event_review
    ON public.offline_attendance_submissions (event_id, review_status, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_offline_attendance_student
    ON public.offline_attendance_submissions (student_id, captured_at DESC);

ALTER TABLE public.offline_attendance_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS offline_attendance_student_read_own ON public.offline_attendance_submissions;
CREATE POLICY offline_attendance_student_read_own
    ON public.offline_attendance_submissions FOR SELECT
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS offline_attendance_staff_read ON public.offline_attendance_submissions;
CREATE POLICY offline_attendance_staff_read
    ON public.offline_attendance_submissions FOR SELECT
    USING (public.current_user_role() IN ('admin', 'faculty', 'org_member'));

ALTER TABLE public.attendance_records
    ALTER COLUMN latitude DROP NOT NULL,
    ALTER COLUMN longitude DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS is_offline BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.review_offline_attendance_submission(
    p_submission_id UUID,
    p_approve BOOLEAN,
    p_note TEXT DEFAULT NULL,
    p_check_in_status public.attendance_status DEFAULT 'checked_in'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role public.user_role;
    v_submission public.offline_attendance_submissions%ROWTYPE;
    v_record_id UUID;
    v_reason TEXT;
BEGIN
    v_role := public.current_user_role();
    IF v_role NOT IN ('admin', 'faculty', 'org_member') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT * INTO v_submission
    FROM public.offline_attendance_submissions
    WHERE id = p_submission_id AND review_status = 'pending'
    FOR UPDATE;

    IF v_submission.id IS NULL THEN
        RAISE EXCEPTION 'Offline submission not found or already reviewed';
    END IF;

    IF NOT p_approve THEN
        UPDATE public.offline_attendance_submissions
        SET review_status = 'rejected', review_note = NULLIF(TRIM(p_note), ''),
            reviewed_by = auth.uid(), reviewed_at = NOW()
        WHERE id = v_submission.id;
        RETURN NULL;
    END IF;

    v_reason := CONCAT('Offline ', REPLACE(v_submission.action::TEXT, '_', ' '),
        ' approved after selfie and timestamp review',
        CASE WHEN NULLIF(TRIM(p_note), '') IS NULL THEN '' ELSE ': ' || TRIM(p_note) END);

    IF v_submission.action = 'check_in' THEN
        IF p_check_in_status NOT IN ('checked_in', 'late') THEN
            RAISE EXCEPTION 'Offline time-in status must be checked_in or late';
        END IF;

        SELECT id INTO v_record_id
        FROM public.attendance_records
        WHERE event_id = v_submission.event_id AND student_id = v_submission.student_id;

        IF v_record_id IS NOT NULL THEN
            RAISE EXCEPTION 'Student already has attendance for this event';
        END IF;

        INSERT INTO public.attendance_records (
            event_id, student_id, checked_in_at, latitude, longitude,
            selfie_url, status, otp_verified, fraud_flag,
            is_manual_override, override_reason, is_offline
        ) VALUES (
            v_submission.event_id, v_submission.student_id, v_submission.captured_at,
            NULL, NULL, v_submission.selfie_url, p_check_in_status,
            v_submission.otp_verified_at_capture, false,
            true, v_reason, true
        ) RETURNING id INTO v_record_id;

        PERFORM public.increment_student_points(
            v_submission.student_id,
            CASE WHEN p_check_in_status = 'late' THEN 5 ELSE 10 END
        );
    ELSE
        SELECT id INTO v_record_id
        FROM public.attendance_records
        WHERE event_id = v_submission.event_id
          AND student_id = v_submission.student_id
          AND status IN ('checked_in', 'late')
        FOR UPDATE;

        IF v_record_id IS NULL THEN
            RAISE EXCEPTION 'Approve the student''s time-in before approving time-out';
        END IF;

        UPDATE public.attendance_records
        SET status = 'checked_out', checked_out_at = v_submission.captured_at,
            is_manual_override = true, is_offline = true, override_reason = v_reason
        WHERE id = v_record_id;
    END IF;

    UPDATE public.offline_attendance_submissions
    SET review_status = 'approved', review_note = NULLIF(TRIM(p_note), ''),
        reviewed_by = auth.uid(), reviewed_at = NOW()
    WHERE id = v_submission.id;

    RETURN v_record_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_offline_attendance_submission TO authenticated;

COMMIT;
