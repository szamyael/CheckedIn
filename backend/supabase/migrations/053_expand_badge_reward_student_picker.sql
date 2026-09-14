BEGIN;

CREATE OR REPLACE FUNCTION public.organization_badge_student_cards(p_organization_id UUID)
RETURNS TABLE (
    id UUID,
    student_id TEXT,
    first_name TEXT,
    last_name TEXT,
    program TEXT,
    year_level INTEGER,
    section TEXT,
    profile_photo_url TEXT,
    reward_points INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT s.id, s.student_id::TEXT, s.first_name, s.last_name, s.program,
           s.year_level, s.section, s.profile_photo_url, s.reward_points
    FROM public.students s
    -- The picker intentionally uses program/course mappings as its scope.
    -- A student assigned to an organization but outside a mapped program is
    -- not returned here.
    WHERE public.can_manage_organization_badges(p_organization_id)
      AND EXISTS (
          SELECT 1
          FROM public.organization_programs op
          WHERE op.organization_id = p_organization_id
            AND lower(trim(op.program)) = lower(trim(s.program))
    )
    ORDER BY s.last_name, s.first_name;
$$;

GRANT EXECUTE ON FUNCTION public.organization_badge_student_cards(UUID) TO authenticated;

COMMIT;
