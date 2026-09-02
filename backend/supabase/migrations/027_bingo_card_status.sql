/*
|--------------------------------------------------------------------------
| CheckedIn — 027_bingo_card_status.sql
| Multiple bingo cards per org: draft, active, archived lifecycle
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TYPE public.bingo_card_status AS ENUM ('draft', 'active', 'archived');

ALTER TABLE public.bingo_cards
    ADD COLUMN IF NOT EXISTS status public.bingo_card_status NOT NULL DEFAULT 'draft';

UPDATE public.bingo_cards
SET status = CASE
    WHEN is_active THEN 'active'::public.bingo_card_status
    ELSE 'draft'::public.bingo_card_status
END;

DROP INDEX IF EXISTS bingo_cards_one_active_per_org;

CREATE UNIQUE INDEX bingo_cards_one_active_per_org
    ON public.bingo_cards (organization_id)
    WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.sync_bingo_card_is_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.is_active := (NEW.status = 'active');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bingo_cards_sync_is_active ON public.bingo_cards;

CREATE TRIGGER bingo_cards_sync_is_active
    BEFORE INSERT OR UPDATE OF status ON public.bingo_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_bingo_card_is_active();

-- Keep is_active column in sync for existing queries.
UPDATE public.bingo_cards
SET is_active = (status = 'active');

DROP POLICY IF EXISTS bingo_cards_student_read_active ON public.bingo_cards;

CREATE POLICY bingo_cards_student_read_active ON public.bingo_cards
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND status = 'active'
    );

DROP POLICY IF EXISTS bingo_cells_student_read ON public.bingo_cells;

CREATE POLICY bingo_cells_student_read ON public.bingo_cells
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND EXISTS (
            SELECT 1 FROM public.bingo_cards c
            WHERE c.id = bingo_cells.card_id
              AND c.status = 'active'
        )
    );

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
          AND c.status = 'active'
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

COMMENT ON COLUMN public.bingo_cards.status IS
'Bingo card lifecycle: draft (org-only), active (students see & earn), archived (read-only history).';

COMMIT;
