/*
|--------------------------------------------------------------------------
| CheckedIn — 017_notifications.sql
| In-app notifications for students and staff
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TYPE public.notification_type AS ENUM (
    'account_approved',
    'achievement',
    'event_published',
    'general'
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    notification_type public.notification_type NOT NULL DEFAULT 'general',
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_created
    ON public.notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_user_unread
    ON public.notifications (user_id)
    WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update_own ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_account_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.status = 'pending'
       AND NEW.status = 'active'
       AND NEW.role = 'student' THEN
        INSERT INTO public.notifications (
            user_id, title, body, notification_type
        ) VALUES (
            NEW.id,
            'Account approved',
            'Your CheckedIn account has been approved. You can now sign in and check in to events.',
            'account_approved'
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_account_approved
    AFTER UPDATE OF status ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_account_approved();

CREATE OR REPLACE FUNCTION public.notify_achievement_earned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notifications (
        user_id, title, body, notification_type, metadata
    ) VALUES (
        NEW.student_id,
        'Badge earned',
        'You earned: ' || NEW.badge_name,
        'achievement',
        jsonb_build_object(
            'achievement_id', NEW.id,
            'badge_name', NEW.badge_name,
            'badge_type', NEW.badge_type
        )
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_achievement_earned
    AFTER INSERT ON public.student_achievements
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_achievement_earned();

CREATE OR REPLACE FUNCTION public.notify_event_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'published'
       AND (OLD.status IS DISTINCT FROM 'published') THEN
        INSERT INTO public.notifications (
            user_id, title, body, notification_type, metadata
        )
        SELECT
            u.id,
            'New event',
            NEW.title || ' is now open for check-in.',
            'event_published',
            jsonb_build_object('event_id', NEW.id)
        FROM public.users u
        WHERE u.role = 'student'
          AND u.status = 'active';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_event_published
    AFTER UPDATE OF status ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_event_published();

CREATE OR REPLACE FUNCTION public.notify_event_check_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event RECORD;
    v_student RECORD;
BEGIN
    IF NEW.status <> 'checked_in' THEN
        RETURN NEW;
    END IF;

    SELECT title, created_by INTO v_event
    FROM public.events
    WHERE id = NEW.event_id;

    SELECT first_name, last_name, student_id INTO v_student
    FROM public.students
    WHERE id = NEW.student_id;

    IF v_event.created_by IS NOT NULL AND v_student.student_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id, title, body, notification_type, metadata
        ) VALUES (
            v_event.created_by,
            'New check-in',
            v_student.first_name || ' ' || v_student.last_name
                || ' (' || v_student.student_id || ') checked in to '
                || v_event.title || '.',
            'general',
            jsonb_build_object(
                'event_id', NEW.event_id,
                'attendance_id', NEW.id,
                'student_id', NEW.student_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_event_check_in
    AFTER INSERT ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_event_check_in();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

COMMIT;
