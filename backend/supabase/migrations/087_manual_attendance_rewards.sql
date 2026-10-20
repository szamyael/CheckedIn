BEGIN;

CREATE OR REPLACE FUNCTION public.award_check_in_achievements(
    p_student_id UUID,
    p_event_id UUID,
    p_event_title TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
    v_badge RECORD;
    v_new_badges JSONB := '[]'::JSONB;
    v_event_badge_name TEXT;
    v_inserted_name TEXT;
BEGIN
    v_event_badge_name := p_event_title || ' Participant';

    INSERT INTO public.student_achievements (
        student_id, event_id, badge_name, badge_type
    ) VALUES (
        p_student_id, p_event_id, v_event_badge_name, 'event'
    )
    ON CONFLICT (student_id, event_id) DO NOTHING
    RETURNING badge_name INTO v_inserted_name;

    IF v_inserted_name IS NOT NULL THEN
        v_new_badges := v_new_badges || jsonb_build_object(
            'name', v_inserted_name,
            'type', 'event'
        );
    END IF;

    SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.attendance_records
    WHERE student_id = p_student_id
      AND status IN ('checked_in', 'late', 'on_break', 'checked_out');

    FOR v_badge IN
        SELECT * FROM public.badge_definitions
        WHERE badge_type = 'milestone'
          AND milestone_threshold <= v_count
        ORDER BY milestone_threshold
    LOOP
        v_inserted_name := NULL;

        INSERT INTO public.student_achievements (
            student_id,
            badge_definition_id,
            badge_name,
            badge_type
        ) VALUES (
            p_student_id,
            v_badge.id,
            v_badge.name,
            'milestone'
        )
        ON CONFLICT (student_id, badge_definition_id) DO NOTHING
        RETURNING badge_name INTO v_inserted_name;

        IF v_inserted_name IS NOT NULL THEN
            v_new_badges := v_new_badges || jsonb_build_object(
                'name', v_inserted_name,
                'type', 'milestone'
            );
        END IF;
    END LOOP;

    RETURN v_new_badges;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_manual_attendance_recognition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_title TEXT;
BEGIN
    IF NEW.is_manual_override IS DISTINCT FROM true
       OR NEW.status NOT IN ('checked_in', 'late') THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_manual_override IS TRUE
           AND OLD.status IN ('checked_in', 'late') THEN
            RETURN NEW;
        END IF;
    END IF;

    SELECT title INTO v_event_title
    FROM public.events
    WHERE id = NEW.event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attendance event not found';
    END IF;

    PERFORM public.award_check_in_achievements(
        NEW.student_id,
        NEW.event_id,
        v_event_title
    );
    PERFORM public.apply_bingo_after_check_in(
        NEW.student_id,
        NEW.event_id,
        NEW.id
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS attendance_manual_recognition ON public.attendance_records;
CREATE TRIGGER attendance_manual_recognition
    AFTER INSERT OR UPDATE OF status, is_manual_override
    ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.award_manual_attendance_recognition();

DO $$
DECLARE
    v_attendance RECORD;
BEGIN
    FOR v_attendance IN
        SELECT ar.id, ar.student_id, ar.event_id, e.title
        FROM public.attendance_records ar
        JOIN public.events e ON e.id = ar.event_id
        WHERE ar.is_manual_override IS TRUE
          AND ar.status IN ('checked_in', 'late', 'on_break', 'checked_out')
    LOOP
        PERFORM public.award_check_in_achievements(
            v_attendance.student_id,
            v_attendance.event_id,
            v_attendance.title
        );
        PERFORM public.apply_bingo_after_check_in(
            v_attendance.student_id,
            v_attendance.event_id,
            v_attendance.id
        );
    END LOOP;
END;
$$;

COMMIT;
