BEGIN;

CREATE OR REPLACE FUNCTION public.admin_flush_data(
    p_categories TEXT[],
    p_confirmation TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_counts JSONB;
    v_events BIGINT;
    v_posted_events BIGINT;
    v_organizations BIGINT;
    v_students BIGINT;
    v_notifications BIGINT;
BEGIN
    IF auth.uid() IS NULL
       OR public.current_user_role() IS DISTINCT FROM 'admin'
    THEN
        RAISE EXCEPTION 'Administrator access required';
    END IF;

    IF p_categories IS NULL OR cardinality(p_categories) = 0
       OR EXISTS (
           SELECT 1
           FROM unnest(p_categories) AS category
           WHERE category IS NULL OR category NOT IN (
               'events', 'posted_events', 'organizations',
               'student_accounts', 'notifications'
           )
       )
    THEN
        RAISE EXCEPTION 'Select at least one valid data category';
    END IF;

    SELECT COUNT(*) INTO v_events
    FROM public.events
    WHERE status <> 'published';

    SELECT COUNT(*) INTO v_posted_events
    FROM public.events
    WHERE status = 'published';

    SELECT COUNT(*) INTO v_organizations
    FROM public.organizations;

    SELECT COUNT(*) INTO v_students
    FROM public.users
    WHERE role = 'student';

    SELECT COUNT(*) INTO v_notifications
    FROM public.notifications;

    v_counts := jsonb_build_object(
        'events', CASE WHEN 'events' = ANY(p_categories) THEN v_events ELSE 0 END,
        'posted_events', CASE WHEN 'posted_events' = ANY(p_categories) THEN v_posted_events ELSE 0 END,
        'organizations', CASE WHEN 'organizations' = ANY(p_categories) THEN v_organizations ELSE 0 END,
        'student_accounts', CASE WHEN 'student_accounts' = ANY(p_categories) THEN v_students ELSE 0 END,
        'notifications', CASE WHEN 'notifications' = ANY(p_categories) THEN v_notifications ELSE 0 END
    );

    IF p_confirmation IS NULL THEN
        RETURN jsonb_build_object('preview', true, 'counts', v_counts);
    END IF;

    IF p_confirmation <> 'FLUSH' THEN
        RAISE EXCEPTION 'Type FLUSH to confirm permanent deletion';
    END IF;

    IF 'notifications' = ANY(p_categories) THEN
        DELETE FROM public.notifications WHERE TRUE;
    END IF;

    IF 'events' = ANY(p_categories) OR 'posted_events' = ANY(p_categories) THEN
        DELETE FROM public.events
        WHERE ('events' = ANY(p_categories) AND status <> 'published')
           OR ('posted_events' = ANY(p_categories) AND status = 'published');
    END IF;

    IF 'organizations' = ANY(p_categories) THEN
        DELETE FROM public.organizations;
    END IF;

    IF 'student_accounts' = ANY(p_categories) THEN
        DELETE FROM auth.users
        WHERE id IN (
            SELECT id FROM public.users WHERE role = 'student'
        );
    END IF;

    INSERT INTO public.audit_logs (user_id, action, entity_type, details)
    VALUES (
        auth.uid(),
        'flush_selected_data',
        'system',
        jsonb_build_object('deleted_counts', v_counts)
    );

    RETURN jsonb_build_object('preview', false, 'counts', v_counts);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_flush_data(TEXT[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_flush_data(TEXT[], TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
