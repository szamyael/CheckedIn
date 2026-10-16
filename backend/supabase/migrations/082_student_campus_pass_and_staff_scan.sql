BEGIN;

CREATE TABLE public.student_campus_passes (
    student_id UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
    campus_pass_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_campus_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_campus_passes_select_own
    ON public.student_campus_passes
    FOR SELECT TO authenticated
    USING (student_id = auth.uid());

REVOKE ALL ON TABLE public.student_campus_passes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.student_campus_passes TO authenticated;

INSERT INTO public.student_campus_passes (student_id)
SELECT id FROM public.students
ON CONFLICT (student_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_student_campus_pass()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.student_campus_passes (student_id)
    VALUES (NEW.id)
    ON CONFLICT (student_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER students_create_campus_pass
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.create_student_campus_pass();

CREATE OR REPLACE FUNCTION public.get_my_campus_pass_token()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role public.user_role;
    v_status public.account_status;
    v_token UUID;
BEGIN
    SELECT role, status
    INTO v_role, v_status
    FROM public.users
    WHERE id = auth.uid();

    IF v_role IS DISTINCT FROM 'student' OR v_status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION 'An active student account is required';
    END IF;

    SELECT campus_pass_token
    INTO v_token
    FROM public.student_campus_passes
    WHERE student_id = auth.uid();

    IF v_token IS NULL THEN
        RAISE EXCEPTION 'Campus pass is unavailable';
    END IF;

    RETURN v_token;
END;
$$;

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
    ON CONFLICT (event_id, student_id) DO NOTHING
    RETURNING id INTO v_attendance_id;

    IF v_attendance_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Student is already checked in for this event'
        );
    END IF;

    PERFORM public.log_audit(
        'campus_pass_qr_check_in',
        'attendance_records',
        v_attendance_id,
        jsonb_build_object(
            'event_id', p_event_id,
            'student_id', v_student.id,
            'staff_id', auth.uid()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
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

REVOKE ALL ON FUNCTION public.create_student_campus_pass() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_campus_pass_token() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_scan_student_campus_pass(UUID, UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_my_campus_pass_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_scan_student_campus_pass(UUID, UUID) TO authenticated;

COMMIT;
