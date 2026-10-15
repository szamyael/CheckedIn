BEGIN;

CREATE OR REPLACE FUNCTION public.record_organization_student_payment(
    p_organization_id UUID,
    p_student_id UUID,
    p_paid BOOLEAN,
    p_updated_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.students s
        JOIN public.organization_programs op
          ON public.program_name_key(s.program) = public.program_name_key(op.program)
        WHERE s.id = p_student_id
          AND op.organization_id = p_organization_id
    ) THEN
        RAISE EXCEPTION 'Student is not mapped to this organization';
    END IF;

    INSERT INTO public.organization_memberships (
        organization_id,
        student_id,
        paid_at,
        updated_by
    )
    VALUES (
        p_organization_id,
        p_student_id,
        CASE WHEN p_paid THEN NOW() ELSE NULL END,
        p_updated_by
    )
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
        WHERE id = p_student_id
          AND role = 'student';

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Student account could not be activated';
        END IF;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_organization_student_payment(UUID, UUID, BOOLEAN, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_organization_student_payment(UUID, UUID, BOOLEAN, UUID) TO service_role;

COMMIT;
