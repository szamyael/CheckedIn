BEGIN;

ALTER TABLE public.org_badges
    ADD COLUMN IF NOT EXISTS award_rule TEXT NOT NULL DEFAULT 'manual'
    CHECK (award_rule IN ('manual', 'point_threshold', 'mapped_program', 'new_registration'));

UPDATE public.org_badges
SET award_rule = 'point_threshold'
WHERE minimum_points IS NOT NULL AND award_rule = 'manual';

CREATE OR REPLACE FUNCTION public.grant_org_badge(p_student_id UUID, p_badge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_points INTEGER;
BEGIN
    SELECT points INTO v_points FROM public.org_badges WHERE id = p_badge_id AND status = 'active';
    IF NOT FOUND THEN RETURN FALSE; END IF;

    INSERT INTO public.student_org_badges (student_id, org_badge_id, points_awarded)
    VALUES (p_student_id, p_badge_id, v_points)
    ON CONFLICT (student_id, org_badge_id) DO NOTHING;

    IF NOT FOUND THEN RETURN FALSE; END IF;
    IF v_points > 0 THEN PERFORM public.increment_student_points(p_student_id, v_points); END IF;
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.organization_badge_students(p_organization_id UUID)
RETURNS TABLE (id UUID, student_id TEXT, first_name TEXT, last_name TEXT, program TEXT, reward_points INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT s.id, s.student_id, s.first_name, s.last_name, s.program, s.reward_points
    FROM public.students s
    WHERE public.can_manage_organization_badges(p_organization_id)
      AND (
        s.organization_id = p_organization_id
        OR EXISTS (
            SELECT 1 FROM public.organization_programs op
            WHERE op.organization_id = p_organization_id
              AND lower(trim(op.program)) = lower(trim(s.program))
        )
      )
    ORDER BY s.last_name, s.first_name;
$$;

CREATE OR REPLACE FUNCTION public.reward_org_badge_to_student(p_badge_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org UUID;
BEGIN
    SELECT organization_id INTO v_org FROM public.org_badges WHERE id = p_badge_id;
    IF NOT FOUND OR NOT public.can_manage_organization_badges(v_org) THEN
        RAISE EXCEPTION 'You cannot reward this badge';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.organization_badge_students(v_org) s WHERE s.id = p_student_id) THEN
        RAISE EXCEPTION 'Student is not eligible for this organization';
    END IF;
    RETURN public.grant_org_badge(p_student_id, p_badge_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.organization_badge_students(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reward_org_badge_to_student(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.award_registration_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_badge UUID;
BEGIN
    FOR v_badge IN
        SELECT b.id FROM public.org_badges b
        WHERE b.status = 'active' AND b.kind = 'custom'
          AND (
            (b.award_rule = 'new_registration' AND (
                NEW.organization_id = b.organization_id OR EXISTS (
                    SELECT 1 FROM public.organization_programs op
                    WHERE op.organization_id = b.organization_id
                      AND lower(trim(op.program)) = lower(trim(NEW.program))
                )
            ))
            OR (b.award_rule = 'mapped_program' AND EXISTS (
                SELECT 1 FROM public.organization_programs op
                WHERE op.organization_id = b.organization_id
                  AND lower(trim(op.program)) = lower(trim(NEW.program))
            ))
          )
    LOOP
        PERFORM public.grant_org_badge(NEW.id, v_badge);
    END LOOP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_award_registration_badges ON public.students;
CREATE TRIGGER students_award_registration_badges
    AFTER INSERT ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.award_registration_badges();

-- Existing point-threshold logic now explicitly follows the chosen preset.
CREATE OR REPLACE FUNCTION public.award_point_threshold_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_badge UUID;
BEGIN
    FOR v_badge IN
        SELECT b.id FROM public.org_badges b
        WHERE b.status = 'active' AND b.kind = 'custom'
          AND b.award_rule = 'point_threshold'
          AND b.minimum_points IS NOT NULL
          AND NEW.reward_points >= b.minimum_points
          AND (NEW.organization_id = b.organization_id OR EXISTS (
              SELECT 1 FROM public.organization_programs op
              WHERE op.organization_id = b.organization_id
                AND lower(trim(op.program)) = lower(trim(NEW.program))
          ))
    LOOP
        PERFORM public.grant_org_badge(NEW.id, v_badge);
    END LOOP;
    RETURN NEW;
END;
$$;

COMMIT;
