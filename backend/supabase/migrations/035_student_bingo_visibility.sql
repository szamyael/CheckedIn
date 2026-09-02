/*
|--------------------------------------------------------------------------
| CheckedIn — 035_student_bingo_visibility.sql
| Admin-created active bingo cards are global; organization cards require
| a mapped student program.
|--------------------------------------------------------------------------
*/

BEGIN;

DROP POLICY IF EXISTS bingo_cards_student_read_active ON public.bingo_cards;

CREATE POLICY bingo_cards_student_read_active ON public.bingo_cards
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND is_active = true
        AND (
            public.is_admin_user(created_by)
            OR organization_id = ANY (
                public.student_program_organization_ids(auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS bingo_cells_student_read ON public.bingo_cells;

CREATE POLICY bingo_cells_student_read ON public.bingo_cells
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND EXISTS (
            SELECT 1
            FROM public.bingo_cards c
            WHERE c.id = bingo_cells.card_id
              AND c.is_active = true
              AND (
                  public.is_admin_user(c.created_by)
                  OR c.organization_id = ANY (
                      public.student_program_organization_ids(auth.uid())
                  )
              )
        )
    );

COMMIT;