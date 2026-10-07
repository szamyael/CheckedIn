BEGIN;

CREATE OR REPLACE FUNCTION public.award_point_threshold_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_badge UUID;
BEGIN
    IF NEW.reward_points <= OLD.reward_points OR NEW.organization_id IS NULL THEN
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

COMMIT;
