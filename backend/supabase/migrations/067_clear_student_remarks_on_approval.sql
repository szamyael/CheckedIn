BEGIN;

CREATE OR REPLACE FUNCTION public.clear_student_decision_reason_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.role = 'student'
       AND NEW.status = 'active'
       AND OLD.status IS DISTINCT FROM NEW.status THEN
        NEW.account_status_reason := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_student_decision_reason_on_approval
    ON public.users;
CREATE TRIGGER trg_clear_student_decision_reason_on_approval
    BEFORE UPDATE OF status ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.clear_student_decision_reason_on_approval();

UPDATE public.users
SET account_status_reason = NULL
WHERE role = 'student'
  AND status = 'active'
  AND account_status_reason IS NOT NULL;

COMMENT ON COLUMN public.users.account_status_reason IS
    'Administrator reason for the current student re-registration request or ban; cleared when the student account is approved.';

COMMIT;
