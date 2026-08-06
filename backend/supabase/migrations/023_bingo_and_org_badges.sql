/*
|--------------------------------------------------------------------------
| CheckedIn — 023_bingo_and_org_badges.sql
| Org-managed bingo cards, badges, progress; faculty can no longer create events
|--------------------------------------------------------------------------
*/

BEGIN;

-- Only admin + org_member may create events (faculty reports-focused).
DROP POLICY IF EXISTS events_insert_staff ON public.events;

CREATE POLICY events_insert_org_or_admin ON public.events
    FOR INSERT WITH CHECK (
        public.current_user_role() IN ('admin', 'org_member')
        AND created_by = auth.uid()
    );

CREATE TYPE public.org_badge_kind AS ENUM (
    'bingo_line',
    'streak',
    'custom'
);

CREATE TABLE public.org_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    kind public.org_badge_kind NOT NULL DEFAULT 'custom',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT org_badges_slug_unique UNIQUE (organization_id, slug)
);

CREATE TABLE public.bingo_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    season_label TEXT NOT NULL DEFAULT '2026',
    streak_threshold INTEGER NOT NULL DEFAULT 3 CHECK (streak_threshold >= 2),
    line_badge_id UUID REFERENCES public.org_badges(id) ON DELETE SET NULL,
    streak_badge_id UUID REFERENCES public.org_badges(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- At most one active card per organization.
CREATE UNIQUE INDEX bingo_cards_one_active_per_org
    ON public.bingo_cards (organization_id)
    WHERE is_active = true;

CREATE TABLE public.bingo_cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL
        REFERENCES public.bingo_cards(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL CHECK (position >= 0 AND position <= 8),
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bingo_cells_position_unique UNIQUE (card_id, position)
);

CREATE TABLE public.student_bingo_cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL
        REFERENCES public.students(id) ON DELETE CASCADE,
    cell_id UUID NOT NULL
        REFERENCES public.bingo_cells(id) ON DELETE CASCADE,
    attendance_record_id UUID
        REFERENCES public.attendance_records(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT student_bingo_cells_unique UNIQUE (student_id, cell_id)
);

CREATE TABLE public.student_org_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL
        REFERENCES public.students(id) ON DELETE CASCADE,
    org_badge_id UUID NOT NULL
        REFERENCES public.org_badges(id) ON DELETE CASCADE,
    bingo_card_id UUID REFERENCES public.bingo_cards(id) ON DELETE SET NULL,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT student_org_badges_unique UNIQUE (student_id, org_badge_id)
);

CREATE INDEX idx_org_badges_org ON public.org_badges (organization_id);
CREATE INDEX idx_bingo_cards_org ON public.bingo_cards (organization_id);
CREATE INDEX idx_bingo_cells_card ON public.bingo_cells (card_id);
CREATE INDEX idx_bingo_cells_event ON public.bingo_cells (event_id);
CREATE INDEX idx_student_bingo_cells_student ON public.student_bingo_cells (student_id);
CREATE INDEX idx_student_org_badges_student ON public.student_org_badges (student_id);

ALTER TABLE public.org_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bingo_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bingo_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_bingo_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_org_badges ENABLE ROW LEVEL SECURITY;

-- org_badges
CREATE POLICY org_badges_admin_all ON public.org_badges
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY org_badges_org_manage ON public.org_badges
    FOR ALL USING (
        public.current_user_role() = 'org_member'
        AND organization_id = public.staff_organization_id()
    )
    WITH CHECK (
        public.current_user_role() = 'org_member'
        AND organization_id = public.staff_organization_id()
    );

CREATE POLICY org_badges_student_read ON public.org_badges
    FOR SELECT USING (public.current_user_role() = 'student');

CREATE POLICY org_badges_faculty_read ON public.org_badges
    FOR SELECT USING (public.current_user_role() = 'faculty');

-- bingo_cards
CREATE POLICY bingo_cards_admin_all ON public.bingo_cards
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY bingo_cards_org_manage ON public.bingo_cards
    FOR ALL USING (
        public.current_user_role() = 'org_member'
        AND organization_id = public.staff_organization_id()
    )
    WITH CHECK (
        public.current_user_role() = 'org_member'
        AND organization_id = public.staff_organization_id()
    );

CREATE POLICY bingo_cards_student_read_active ON public.bingo_cards
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND is_active = true
    );

CREATE POLICY bingo_cards_faculty_read ON public.bingo_cards
    FOR SELECT USING (public.current_user_role() = 'faculty');

-- bingo_cells
CREATE POLICY bingo_cells_admin_all ON public.bingo_cells
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY bingo_cells_org_manage ON public.bingo_cells
    FOR ALL USING (
        public.current_user_role() = 'org_member'
        AND EXISTS (
            SELECT 1 FROM public.bingo_cards c
            WHERE c.id = bingo_cells.card_id
              AND c.organization_id = public.staff_organization_id()
        )
    )
    WITH CHECK (
        public.current_user_role() = 'org_member'
        AND EXISTS (
            SELECT 1 FROM public.bingo_cards c
            WHERE c.id = bingo_cells.card_id
              AND c.organization_id = public.staff_organization_id()
        )
    );

CREATE POLICY bingo_cells_student_read ON public.bingo_cells
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND EXISTS (
            SELECT 1 FROM public.bingo_cards c
            WHERE c.id = bingo_cells.card_id
              AND c.is_active = true
        )
    );

CREATE POLICY bingo_cells_faculty_read ON public.bingo_cells
    FOR SELECT USING (public.current_user_role() = 'faculty');

-- student_bingo_cells
CREATE POLICY student_bingo_cells_own ON public.student_bingo_cells
    FOR SELECT USING (
        student_id = auth.uid()
        OR public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

CREATE POLICY student_bingo_cells_service_insert ON public.student_bingo_cells
    FOR INSERT WITH CHECK (
        student_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

-- student_org_badges
CREATE POLICY student_org_badges_read ON public.student_org_badges
    FOR SELECT USING (
        student_id = auth.uid()
        OR public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

CREATE POLICY student_org_badges_admin_insert ON public.student_org_badges
    FOR INSERT WITH CHECK (public.current_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_badges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bingo_cards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bingo_cells TO authenticated;
GRANT SELECT, INSERT ON public.student_bingo_cells TO authenticated;
GRANT SELECT, INSERT ON public.student_org_badges TO authenticated;

-- Winning lines on a 3x3 board (positions 0..8).
CREATE OR REPLACE FUNCTION public.bingo_winning_lines()
RETURNS INTEGER[][]
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT ARRAY[
        ARRAY[0,1,2],
        ARRAY[3,4,5],
        ARRAY[6,7,8],
        ARRAY[0,3,6],
        ARRAY[1,4,7],
        ARRAY[2,5,8],
        ARRAY[0,4,8],
        ARRAY[2,4,6]
    ];
$$;

CREATE OR REPLACE FUNCTION public.apply_bingo_after_check_in(
    p_student_id UUID,
    p_event_id UUID,
    p_attendance_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cell RECORD;
    v_card RECORD;
    v_completed INT[];
    v_has_line BOOLEAN := false;
    v_streak INT := 0;
    v_awarded JSONB := '[]'::JSONB;
    v_badge RECORD;
    v_inserted UUID;
BEGIN
    FOR v_cell IN
        SELECT bc.id AS cell_id, bc.card_id, bc.position
        FROM public.bingo_cells bc
        JOIN public.bingo_cards c ON c.id = bc.card_id
        WHERE bc.event_id = p_event_id
          AND c.is_active = true
    LOOP
        INSERT INTO public.student_bingo_cells (student_id, cell_id, attendance_record_id)
        VALUES (p_student_id, v_cell.cell_id, p_attendance_id)
        ON CONFLICT (student_id, cell_id) DO NOTHING;

        SELECT * INTO v_card FROM public.bingo_cards WHERE id = v_cell.card_id;

        SELECT COALESCE(array_agg(bc.position), ARRAY[]::INT[])
        INTO v_completed
        FROM public.student_bingo_cells sbc
        JOIN public.bingo_cells bc ON bc.id = sbc.cell_id
        WHERE sbc.student_id = p_student_id
          AND bc.card_id = v_cell.card_id;

        v_has_line :=
            (ARRAY[0,1,2]::INT[] <@ v_completed) OR
            (ARRAY[3,4,5]::INT[] <@ v_completed) OR
            (ARRAY[6,7,8]::INT[] <@ v_completed) OR
            (ARRAY[0,3,6]::INT[] <@ v_completed) OR
            (ARRAY[1,4,7]::INT[] <@ v_completed) OR
            (ARRAY[2,5,8]::INT[] <@ v_completed) OR
            (ARRAY[0,4,8]::INT[] <@ v_completed) OR
            (ARRAY[2,4,6]::INT[] <@ v_completed);

        IF v_has_line AND v_card.line_badge_id IS NOT NULL THEN
            SELECT * INTO v_badge FROM public.org_badges WHERE id = v_card.line_badge_id;
            IF FOUND THEN
                INSERT INTO public.student_org_badges (
                    student_id, org_badge_id, bingo_card_id, points_awarded
                )
                VALUES (p_student_id, v_badge.id, v_card.id, v_badge.points)
                ON CONFLICT (student_id, org_badge_id) DO NOTHING
                RETURNING id INTO v_inserted;

                IF v_inserted IS NOT NULL THEN
                    PERFORM public.increment_student_points(p_student_id, v_badge.points);
                    v_awarded := v_awarded || jsonb_build_object(
                        'type', 'bingo_line',
                        'badge_id', v_badge.id,
                        'name', v_badge.name,
                        'points', v_badge.points
                    );
                END IF;
            END IF;
        END IF;

        -- Longest consecutive completed-event run ordered by event start time.
        WITH ordered AS (
            SELECT
                EXISTS (
                    SELECT 1 FROM public.student_bingo_cells s
                    WHERE s.cell_id = bc.id AND s.student_id = p_student_id
                ) AS done,
                row_number() OVER (ORDER BY e.starts_at NULLS LAST, bc.position) AS rn
            FROM public.bingo_cells bc
            JOIN public.events e ON e.id = bc.event_id
            WHERE bc.card_id = v_cell.card_id
        ),
        marked AS (
            SELECT
                done,
                rn,
                rn - ROW_NUMBER() OVER (PARTITION BY done ORDER BY rn) AS grp
            FROM ordered
            WHERE done
        )
        SELECT COALESCE(MAX(cnt), 0) INTO v_streak
        FROM (
            SELECT COUNT(*) AS cnt FROM marked GROUP BY grp
        ) x;

        IF v_streak >= v_card.streak_threshold AND v_card.streak_badge_id IS NOT NULL THEN
            SELECT * INTO v_badge FROM public.org_badges WHERE id = v_card.streak_badge_id;
            IF FOUND THEN
                INSERT INTO public.student_org_badges (
                    student_id, org_badge_id, bingo_card_id, points_awarded
                )
                VALUES (p_student_id, v_badge.id, v_card.id, v_badge.points)
                ON CONFLICT (student_id, org_badge_id) DO NOTHING
                RETURNING id INTO v_inserted;

                IF v_inserted IS NOT NULL THEN
                    PERFORM public.increment_student_points(p_student_id, v_badge.points);
                    v_awarded := v_awarded || jsonb_build_object(
                        'type', 'streak',
                        'badge_id', v_badge.id,
                        'name', v_badge.name,
                        'points', v_badge.points,
                        'streak', v_streak
                    );
                END IF;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'awarded', v_awarded,
        'streak', v_streak,
        'has_line', v_has_line
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_bingo_after_check_in TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_student_points TO authenticated;

COMMIT;
