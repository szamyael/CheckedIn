/*
|--------------------------------------------------------------------------
| CheckedIn — 014_achievements.sql
| Badge definitions, student achievements, award function
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TYPE public.badge_type AS ENUM ('event', 'milestone');

CREATE TABLE public.badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    badge_type public.badge_type NOT NULL,
    milestone_threshold INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT milestone_requires_threshold
        CHECK (
            badge_type <> 'milestone'
            OR milestone_threshold IS NOT NULL
        )
);

CREATE TABLE public.student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL
        REFERENCES public.students(id) ON DELETE CASCADE,
    badge_definition_id UUID
        REFERENCES public.badge_definitions(id) ON DELETE SET NULL,
    event_id UUID
        REFERENCES public.events(id) ON DELETE SET NULL,
    badge_name TEXT NOT NULL,
    badge_type public.badge_type NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT student_achievements_event_unique
        UNIQUE (student_id, event_id),
    CONSTRAINT student_achievements_milestone_unique
        UNIQUE (student_id, badge_definition_id)
);

CREATE INDEX idx_achievements_student ON public.student_achievements (student_id);
CREATE INDEX idx_achievements_event ON public.student_achievements (event_id);

INSERT INTO public.badge_definitions (slug, name, description, badge_type, milestone_threshold)
VALUES
    ('milestone-bronze', 'Bronze Participant', 'Attended 5 verified events', 'milestone', 5),
    ('milestone-silver', 'Silver Participant', 'Attended 10 verified events', 'milestone', 10),
    ('milestone-gold', 'Gold Participant', 'Attended 20 verified events', 'milestone', 20);

CREATE OR REPLACE FUNCTION public.award_check_in_achievements(
    p_student_id UUID,
    p_event_id UUID,
    p_event_title TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
    v_badge RECORD;
    v_new_badges JSONB := '[]'::JSONB;
    v_event_badge_name TEXT;
    v_inserted_name TEXT;
BEGIN
    v_event_badge_name := p_event_title || ' Participant';

    INSERT INTO public.student_achievements (
        student_id, event_id, badge_name, badge_type
    ) VALUES (
        p_student_id, p_event_id, v_event_badge_name, 'event'
    )
    ON CONFLICT (student_id, event_id) DO NOTHING
    RETURNING badge_name INTO v_inserted_name;

    IF v_inserted_name IS NOT NULL THEN
        v_new_badges := v_new_badges || jsonb_build_object(
            'name', v_inserted_name,
            'type', 'event'
        );
    END IF;

    SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.attendance_records
    WHERE student_id = p_student_id
      AND status = 'checked_in';

    FOR v_badge IN
        SELECT * FROM public.badge_definitions
        WHERE badge_type = 'milestone'
          AND milestone_threshold <= v_count
        ORDER BY milestone_threshold
    LOOP
        v_inserted_name := NULL;

        INSERT INTO public.student_achievements (
            student_id,
            badge_definition_id,
            badge_name,
            badge_type
        ) VALUES (
            p_student_id,
            v_badge.id,
            v_badge.name,
            'milestone'
        )
        ON CONFLICT (student_id, badge_definition_id) DO NOTHING
        RETURNING badge_name INTO v_inserted_name;

        IF v_inserted_name IS NOT NULL THEN
            v_new_badges := v_new_badges || jsonb_build_object(
                'name', v_inserted_name,
                'type', 'milestone'
            );
        END IF;
    END LOOP;

    RETURN v_new_badges;
END;
$$;

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY badge_defs_read_all ON public.badge_definitions
    FOR SELECT USING (true);

CREATE POLICY achievements_student_read_own ON public.student_achievements
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY achievements_staff_read ON public.student_achievements
    FOR SELECT USING (
        public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

COMMIT;
