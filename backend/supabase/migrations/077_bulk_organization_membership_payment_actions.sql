BEGIN;

CREATE OR REPLACE FUNCTION public.record_organization_students_payment(
    p_organization_id UUID,
    p_student_ids UUID[],
    p_paid BOOLEAN,
    p_updated_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    mapped_student_ids UUID[];
    requested_count INTEGER;
    updated_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT requested.student_id)
      INTO requested_count
      FROM unnest(p_student_ids) AS requested(student_id);

    IF requested_count = 0 THEN
        RAISE EXCEPTION 'Select at least one student';
    END IF;

    SELECT array_agg(DISTINCT s.id)
      INTO mapped_student_ids
      FROM public.students s
      JOIN public.organization_programs op
        ON public.program_name_key(s.program) = public.program_name_key(op.program)
     WHERE s.id = ANY(p_student_ids)
       AND op.organization_id = p_organization_id;

    IF COALESCE(cardinality(mapped_student_ids), 0) <> requested_count THEN
        RAISE EXCEPTION 'One or more students are not mapped to this organization';
    END IF;

    INSERT INTO public.organization_memberships (
        organization_id,
        student_id,
        paid_at,
        updated_by
    )
    SELECT
        p_organization_id,
        student_id,
        CASE WHEN p_paid THEN NOW() ELSE NULL END,
        p_updated_by
      FROM unnest(mapped_student_ids) AS requested(student_id)
    ON CONFLICT (organization_id, student_id)
    DO UPDATE SET
        paid_at = EXCLUDED.paid_at,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW();

    IF p_paid THEN
        UPDATE public.users
           SET status = 'active',
               disabled_at = NULL,
               account_status_reason = NULL
         WHERE id = ANY(mapped_student_ids)
           AND role = 'student';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        IF updated_count <> requested_count THEN
            RAISE EXCEPTION 'One or more student accounts could not be activated';
        END IF;
    END IF;

    RETURN requested_count;
END;
$$;

REVOKE ALL ON FUNCTION public.record_organization_students_payment(UUID, UUID[], BOOLEAN, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_organization_students_payment(UUID, UUID[], BOOLEAN, UUID) TO service_role;

COMMIT;
