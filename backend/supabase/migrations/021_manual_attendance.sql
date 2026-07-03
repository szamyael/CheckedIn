/*
|--------------------------------------------------------------------------
| CheckedIn — 021_manual_attendance.sql
| Staff manual attendance + correction review RPCs
|--------------------------------------------------------------------------
*/

BEGIN;

ALTER TABLE public.attendance_records
    ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS override_reason TEXT;

CREATE POLICY system_settings_read_student ON public.system_settings
    FOR SELECT USING (public.current_user_role() = 'student');

CREATE OR REPLACE FUNCTION public.staff_manual_mark_attendance(
    p_event_id UUID,
    p_student_id UUID,
    p_status public.attendance_status DEFAULT 'checked_in',
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role public.user_role;
    v_event RECORD;
    v_record_id UUID;
BEGIN
    v_role := public.current_user_role();
    IF v_role NOT IN ('admin', 'faculty', 'org_member') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT id, latitude, longitude, title INTO v_event
    FROM public.events
    WHERE id = p_event_id AND status = 'published';

    IF v_event.id IS NULL THEN
        RAISE EXCEPTION 'Event not found or not published';
    END IF;

    INSERT INTO public.attendance_records (
        event_id,
        student_id,
        latitude,
        longitude,
        selfie_url,
        status,
        is_manual_override,
        override_reason,
        otp_verified
    )
    VALUES (
        p_event_id,
        p_student_id,
        v_event.latitude,
        v_event.longitude,
        'manual/staff-override',
        p_status,
        true,
        NULLIF(TRIM(p_reason), ''),
        false
    )
    ON CONFLICT (event_id, student_id) DO UPDATE SET
        status = EXCLUDED.status,
        is_manual_override = true,
        override_reason = EXCLUDED.override_reason,
        checked_in_at = NOW()
    RETURNING id INTO v_record_id;

    PERFORM public.log_audit(
        'manual_attendance_mark',
        'attendance_records',
        v_record_id,
        jsonb_build_object(
            'event_id', p_event_id,
            'student_id', p_student_id,
            'status', p_status,
            'reason', p_reason
        )
    );

    RETURN v_record_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_attendance_correction(
    p_request_id UUID,
    p_approve BOOLEAN,
    p_new_status public.attendance_status DEFAULT 'excused'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_req public.attendance_correction_requests%ROWTYPE;
    v_record_id UUID;
BEGIN
    IF public.current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;

    SELECT * INTO v_req
    FROM public.attendance_correction_requests
    WHERE id = p_request_id AND status = 'pending';

    IF v_req.id IS NULL THEN
        RAISE EXCEPTION 'Request not found or already reviewed';
    END IF;

    IF p_approve THEN
        IF v_req.attendance_record_id IS NOT NULL THEN
            UPDATE public.attendance_records
            SET status = p_new_status,
                is_manual_override = true,
                override_reason = v_req.reason
            WHERE id = v_req.attendance_record_id;
            v_record_id := v_req.attendance_record_id;
        ELSE
            v_record_id := public.staff_manual_mark_attendance(
                v_req.event_id,
                v_req.student_id,
                p_new_status,
                v_req.reason
            );
        END IF;
    END IF;

    UPDATE public.attendance_correction_requests
    SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        reviewed_by = auth.uid(),
        reviewed_at = NOW()
    WHERE id = p_request_id;

    PERFORM public.log_audit(
        CASE WHEN p_approve THEN 'correction_approved' ELSE 'correction_rejected' END,
        'attendance_correction_requests',
        p_request_id,
        jsonb_build_object('record_id', v_record_id, 'new_status', p_new_status)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_manual_mark_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_attendance_correction TO authenticated;

COMMIT;
