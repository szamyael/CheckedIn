BEGIN;

CREATE OR REPLACE FUNCTION public.staff_scan_student_campus_pass(
    p_event_id UUID,
    p_student_pass_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role public.user_role;
    v_staff_status public.account_status;
    v_event RECORD;
    v_student RECORD;
    v_attendance_id UUID;
    v_action public.attendance_status;
BEGIN
    SELECT role, status
    INTO v_role, v_staff_status
    FROM public.users
    WHERE id = auth.uid();

    IF v_role IS DISTINCT FROM 'admin' AND v_role IS DISTINCT FROM 'faculty' THEN
        RAISE EXCEPTION 'Only faculty and admins can scan student campus passes';
    END IF;
    IF v_staff_status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION 'An active staff account is required';
    END IF;

    SELECT id, title, latitude, longitude, attendance_starts_at,
           attendance_ends_at, allowed_year_levels
    INTO v_event
    FROM public.events
    WHERE id = p_event_id AND status = 'published'
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found or not published';
    END IF;
    IF v_event.attendance_starts_at > NOW()
       OR v_event.attendance_ends_at <= NOW() THEN
        RAISE EXCEPTION 'The event attendance window is closed';
    END IF;

    SELECT s.id, s.student_id, s.first_name, s.middle_name, s.last_name, s.program,
           s.year_level, s.section, u.status
    INTO v_student
    FROM public.student_campus_passes AS pass
    JOIN public.students AS s ON s.id = pass.student_id
    JOIN public.users AS u ON u.id = s.id
    WHERE pass.campus_pass_token = p_student_pass_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid student campus pass';
    END IF;
    IF v_student.status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION 'Student account is not active';
    END IF;
    IF COALESCE(array_length(v_event.allowed_year_levels, 1), 0) > 0
       AND NOT COALESCE(v_student.year_level = ANY(v_event.allowed_year_levels), false) THEN
        RAISE EXCEPTION 'Student year level is not eligible for this event';
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
        v_student.id,
        v_event.latitude,
        v_event.longitude,
        'staff/campus-pass-qr',
        'checked_in',
        true,
        'Faculty scanned student campus pass QR',
        false
    )
    ON CONFLICT (event_id, student_id) DO UPDATE SET
        status = CASE
            WHEN attendance_records.status IN ('checked_in', 'late') THEN 'checked_out'
            ELSE 'checked_in'
        END,
        checked_in_at = CASE
            WHEN attendance_records.status IN ('checked_in', 'late') THEN attendance_records.checked_in_at
            ELSE NOW()
        END,
        checked_out_at = CASE
            WHEN attendance_records.status IN ('checked_in', 'late') THEN NOW()
            ELSE NULL
        END,
        is_manual_override = true,
        override_reason = 'Faculty scanned student campus pass QR'
    RETURNING id, status INTO v_attendance_id, v_action;

    PERFORM public.log_audit(
        CASE WHEN v_action = 'checked_out'
            THEN 'campus_pass_qr_check_out'
            ELSE 'campus_pass_qr_check_in'
        END,
        'attendance_records',
        v_attendance_id,
        jsonb_build_object(
            'event_id', p_event_id,
            'student_id', v_student.id,
            'staff_id', auth.uid(),
            'action', v_action
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'action', v_action,
        'student', jsonb_build_object(
            'name', concat_ws(' ', v_student.first_name, v_student.middle_name, v_student.last_name),
            'student_id', v_student.student_id,
            'program', v_student.program,
            'year_level', v_student.year_level,
            'section', v_student.section
        )
    );
END;
$$;

COMMIT;
