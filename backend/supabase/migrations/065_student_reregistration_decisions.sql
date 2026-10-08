BEGIN;

ALTER TYPE public.account_status
    ADD VALUE IF NOT EXISTS 'needs_reregistration';

CREATE OR REPLACE FUNCTION public.notify_student_account_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role = 'student'
       AND NEW.status::text = 'needs_reregistration'
       AND OLD.status::text IS DISTINCT FROM NEW.status::text THEN
        INSERT INTO public.notifications (
            user_id, title, body, notification_type, metadata
        ) VALUES (
            NEW.id,
            'Please register again',
            'An administrator needs you to submit your student registration again. Reason: '
                || COALESCE(NEW.account_status_reason, 'Please contact the administration.')
                || ' Sign in on the student portal website and follow the re-registration steps.',
            'general',
            jsonb_build_object('action', 'reregister')
        );
    ELSIF NEW.role = 'student'
       AND NEW.status::text = 'suspended'
       AND OLD.status::text IS DISTINCT FROM NEW.status::text THEN
        INSERT INTO public.notifications (
            user_id, title, body, notification_type, metadata
        ) VALUES (
            NEW.id,
            'Student account banned',
            'Your student account has been banned. Reason: '
                || COALESCE(NEW.account_status_reason, 'Please contact the administration.'),
            'general',
            jsonb_build_object('action', 'banned')
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_student_account_decision ON public.users;
CREATE TRIGGER trg_notify_student_account_decision
    AFTER UPDATE OF status ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_student_account_decision();

COMMIT;
