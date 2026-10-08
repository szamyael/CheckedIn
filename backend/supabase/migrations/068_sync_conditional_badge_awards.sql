BEGIN;

CREATE OR REPLACE FUNCTION public.award_eligible_org_badge_students()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID;
BEGIN
    IF NEW.kind <> 'custom' OR NEW.status <> 'active' OR NEW.award_rule = 'manual' THEN
        RETURN NEW;
    END IF;

    FOR v_student_id IN
        SELECT s.id
        FROM public.students s
        WHERE (
            (
                NEW.award_rule = 'point_threshold'
                AND NEW.minimum_points IS NOT NULL
                AND s.reward_points >= NEW.minimum_points
                AND (
                    s.organization_id = NEW.organization_id
                    OR EXISTS (
                        SELECT 1
                        FROM public.organization_programs op
                        WHERE op.organization_id = NEW.organization_id
                          AND lower(trim(op.program)) = lower(trim(s.program))
                    )
                )
            )
            OR (
                NEW.award_rule = 'mapped_program'
                AND EXISTS (
                    SELECT 1
                    FROM public.organization_programs op
                    WHERE op.organization_id = NEW.organization_id
                      AND lower(trim(op.program)) = lower(trim(s.program))
                )
            )
            OR (
                NEW.award_rule = 'new_registration'
                AND (
                    s.organization_id = NEW.organization_id
                    OR EXISTS (
                        SELECT 1
                        FROM public.organization_programs op
                        WHERE op.organization_id = NEW.organization_id
                          AND lower(trim(op.program)) = lower(trim(s.program))
                    )
                )
            )
        )
    LOOP
        PERFORM public.grant_org_badge(v_student_id, NEW.id);
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS org_badges_award_eligible_students ON public.org_badges;
DROP TRIGGER IF EXISTS org_badges_sync_eligible_students ON public.org_badges;
CREATE TRIGGER org_badges_award_eligible_students
    AFTER INSERT ON public.org_badges
    FOR EACH ROW
    EXECUTE FUNCTION public.award_eligible_org_badge_students();
CREATE TRIGGER org_badges_sync_eligible_students
    AFTER UPDATE OF award_rule, minimum_points, status ON public.org_badges
    FOR EACH ROW
    EXECUTE FUNCTION public.award_eligible_org_badge_students();

CREATE OR REPLACE FUNCTION public.award_point_threshold_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_badge UUID;
BEGIN
    IF NEW.reward_points <= OLD.reward_points THEN
        RETURN NEW;
    END IF;

    FOR v_badge IN
        SELECT b.id
        FROM public.org_badges b
        WHERE b.status = 'active'
          AND b.kind = 'custom'
          AND b.award_rule = 'point_threshold'
          AND b.minimum_points IS NOT NULL
          AND NEW.reward_points >= b.minimum_points
          AND (
              NEW.organization_id = b.organization_id
              OR EXISTS (
                  SELECT 1
                  FROM public.organization_programs op
                  WHERE op.organization_id = b.organization_id
                    AND lower(trim(op.program)) = lower(trim(NEW.program))
              )
          )
    LOOP
        PERFORM public.grant_org_badge(NEW.id, v_badge);
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_award_point_threshold_badges ON public.students;
CREATE TRIGGER students_award_point_threshold_badges
    AFTER UPDATE OF reward_points ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.award_point_threshold_badges();

DROP POLICY IF EXISTS org_badges_student_read ON public.org_badges;
CREATE POLICY org_badges_student_read ON public.org_badges
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND (
            (
                status = 'active'
                AND (
                    public.is_admin_user(created_by)
                    OR organization_id = ANY (
                        public.student_program_organization_ids(auth.uid())
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM public.students s
                        WHERE s.id = auth.uid()
                          AND s.organization_id = org_badges.organization_id
                    )
                )
            )
            OR EXISTS (
                SELECT 1
                FROM public.student_org_badges award
                WHERE award.org_badge_id = org_badges.id
                  AND award.student_id = auth.uid()
            )
        )
    );

-- Re-evaluate active conditional badges for students who already qualify.
UPDATE public.org_badges
SET status = status
WHERE status = 'active'
  AND kind = 'custom'
  AND award_rule <> 'manual';

NOTIFY pgrst, 'reload schema';

COMMIT;
