/*
| CheckedIn — 072_program_name_normalization.sql
| Match equivalent program/course spellings without rewriting student data.
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.program_name_key(p_program TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
    normalized TEXT;
BEGIN
    normalized := lower(regexp_replace(trim(p_program), '[^a-zA-Z0-9]+', ' ', 'g'));
    normalized := regexp_replace(normalized, '\s+', ' ', 'g');

    normalized := regexp_replace(normalized, '^bachelor of science in ', 'bs ', 'i');
    normalized := regexp_replace(normalized, '^bachelor science in ', 'bs ', 'i');
    normalized := regexp_replace(normalized, '^bachelor of science ', 'bs ', 'i');
    normalized := regexp_replace(normalized, '^bachelor science ', 'bs ', 'i');
    normalized := regexp_replace(normalized, '^bachelor of arts in ', 'ba ', 'i');
    normalized := regexp_replace(normalized, '^bachelor arts in ', 'ba ', 'i');
    normalized := regexp_replace(normalized, '^bachelor of arts ', 'ba ', 'i');
    normalized := regexp_replace(normalized, '^bachelor arts ', 'ba ', 'i');
    normalized := regexp_replace(normalized, '^b s in ', 'bs ', 'i');
    normalized := regexp_replace(normalized, '^b a in ', 'ba ', 'i');
    normalized := regexp_replace(normalized, '^b s ', 'bs ', 'i');
    normalized := regexp_replace(normalized, '^b a ', 'ba ', 'i');

    RETURN trim(regexp_replace(normalized, '\s+', ' ', 'g'));
END;
$$;

CREATE INDEX IF NOT EXISTS idx_students_program_name_key
    ON public.students (public.program_name_key(program));

CREATE INDEX IF NOT EXISTS idx_org_programs_program_name_key
    ON public.organization_programs (public.program_name_key(program));

CREATE OR REPLACE FUNCTION public.student_program_organization_ids(p_student_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        array_agg(DISTINCT op.organization_id),
        ARRAY[]::UUID[]
    )
    FROM public.organization_programs op
    JOIN public.students s
      ON public.program_name_key(s.program) = public.program_name_key(op.program)
    WHERE s.id = p_student_id;
$$;

COMMIT;
