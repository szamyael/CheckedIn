BEGIN;

ALTER TABLE public.org_badges
    ADD COLUMN IF NOT EXISTS minimum_points INTEGER
    CHECK (minimum_points IS NULL OR minimum_points >= 0);

CREATE OR REPLACE FUNCTION public.award_point_threshold_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_badge public.org_badges%ROWTYPE;
BEGIN
    IF NEW.organization_id IS NULL THEN
        RETURN NEW;
    END IF;

    FOR v_badge IN
        SELECT * FROM public.org_badges
        WHERE organization_id = NEW.organization_id
          AND kind = 'custom'
          AND status = 'active'
          AND minimum_points IS NOT NULL
          AND NEW.reward_points >= minimum_points
    LOOP
        INSERT INTO public.student_org_badges (student_id, org_badge_id, points_awarded)
        VALUES (NEW.id, v_badge.id, v_badge.points)
        ON CONFLICT (student_id, org_badge_id) DO NOTHING;

        IF FOUND AND v_badge.points > 0 THEN
            PERFORM public.increment_student_points(NEW.id, v_badge.points);
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_award_point_threshold_badges ON public.students;
CREATE TRIGGER students_award_point_threshold_badges
    AFTER UPDATE OF reward_points ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.award_point_threshold_badges();

-- Evaluate existing students immediately; conflict protection ensures each
-- qualifying badge is granted no more than once.
UPDATE public.students SET reward_points = reward_points;

COMMIT;
