/*
| CheckedIn — 060_event_year_level_restrictions.sql
| Empty array means every student may check in.
*/

BEGIN;

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS allowed_year_levels SMALLINT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.events
    DROP CONSTRAINT IF EXISTS events_allowed_year_levels_valid,
    ADD CONSTRAINT events_allowed_year_levels_valid
        CHECK (allowed_year_levels <@ ARRAY[1, 2, 3, 4, 5]::SMALLINT[]);

COMMENT ON COLUMN public.events.allowed_year_levels IS
'Year levels allowed to check in. Empty means unrestricted.';

CREATE OR REPLACE FUNCTION public.set_event_allowed_year_levels(
    p_event_id UUID,
    p_allowed_year_levels SMALLINT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF public.current_user_role() NOT IN ('admin', 'faculty', 'org_member') THEN
        RAISE EXCEPTION 'Only staff can set event eligibility';
    END IF;

    UPDATE public.events
    SET allowed_year_levels = COALESCE(p_allowed_year_levels, '{}')
    WHERE id = p_event_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_event_allowed_year_levels(UUID, SMALLINT[]) TO authenticated;

COMMIT;
