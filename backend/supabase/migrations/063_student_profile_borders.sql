BEGIN;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS equipped_profile_border TEXT NOT NULL DEFAULT 'classic'
        CHECK (equipped_profile_border IN ('classic', 'aurora', 'ember', 'royal', 'celestial'));

CREATE TABLE public.student_profile_borders (
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    border_id TEXT NOT NULL
        CHECK (border_id IN ('aurora', 'ember', 'royal', 'celestial')),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, border_id)
);

ALTER TABLE public.student_profile_borders ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_profile_borders_read_own
    ON public.student_profile_borders
    FOR SELECT USING (student_id = auth.uid());

GRANT SELECT ON public.student_profile_borders TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_student_profile_border(p_border_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cost INTEGER;
    v_balance INTEGER;
BEGIN
    IF auth.uid() IS NULL OR public.current_user_role() IS DISTINCT FROM 'student' THEN
        RAISE EXCEPTION 'Student account required';
    END IF;

    v_cost := CASE p_border_id
        WHEN 'aurora' THEN 100
        WHEN 'ember' THEN 150
        WHEN 'royal' THEN 250
        WHEN 'celestial' THEN 500
        ELSE NULL
    END;
    IF v_cost IS NULL THEN
        RAISE EXCEPTION 'Unknown profile border';
    END IF;

    PERFORM 1 FROM public.students WHERE id = auth.uid() FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student profile not found';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.student_profile_borders
        WHERE student_id = auth.uid() AND border_id = p_border_id
    ) THEN
        RAISE EXCEPTION 'You already own this border';
    END IF;

    UPDATE public.students
    SET reward_points = reward_points - v_cost
    WHERE id = auth.uid() AND reward_points >= v_cost
    RETURNING reward_points INTO v_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Not enough reward points';
    END IF;

    INSERT INTO public.student_profile_borders (student_id, border_id)
    VALUES (auth.uid(), p_border_id);

    RETURN jsonb_build_object(
        'border_id', p_border_id,
        'cost', v_cost,
        'points_remaining', v_balance
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.equip_student_profile_border(p_border_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.current_user_role() IS DISTINCT FROM 'student' THEN
        RAISE EXCEPTION 'Student account required';
    END IF;

    IF p_border_id IS NULL
       OR p_border_id NOT IN ('classic', 'aurora', 'ember', 'royal', 'celestial')
    THEN
        RAISE EXCEPTION 'Unknown profile border';
    END IF;

    IF p_border_id <> 'classic' AND NOT EXISTS (
        SELECT 1 FROM public.student_profile_borders
        WHERE student_id = auth.uid() AND border_id = p_border_id
    ) THEN
        RAISE EXCEPTION 'You do not own this border';
    END IF;

    UPDATE public.students
    SET equipped_profile_border = p_border_id
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student profile not found';
    END IF;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_student_profile_border(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.equip_student_profile_border(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_student_profile_border(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_student_profile_border(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
