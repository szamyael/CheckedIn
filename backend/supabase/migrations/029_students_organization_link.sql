/*
|--------------------------------------------------------------------------
| CheckedIn — 029_students_organization_link.sql
| Link students to their organization for proper bingo card visibility
|--------------------------------------------------------------------------
*/

BEGIN;

-- Add organization_id to students table
ALTER TABLE public.students
    ADD COLUMN organization_id UUID
        REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX idx_students_organization ON public.students (organization_id);

-- Update RLS policy for bingo_cards to filter by student's organization
DROP POLICY IF EXISTS bingo_cards_student_read_active ON public.bingo_cards;

CREATE POLICY bingo_cards_student_read_active ON public.bingo_cards
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND status = 'active'
        AND organization_id = (
            SELECT organization_id FROM public.students
            WHERE id = auth.uid()
        )
    );

-- Update RLS policy for bingo_cells to filter by student's organization
DROP POLICY IF EXISTS bingo_cells_student_read ON public.bingo_cells;

CREATE POLICY bingo_cells_student_read ON public.bingo_cells
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND EXISTS (
            SELECT 1 FROM public.bingo_cards c
            JOIN public.students s ON s.organization_id = c.organization_id
            WHERE c.id = bingo_cells.card_id
              AND c.status = 'active'
              AND s.id = auth.uid()
        )
    );

-- Update RLS policy for student_bingo_cells to ensure same organization
DROP POLICY IF EXISTS student_bingo_cells_student_crud ON public.student_bingo_cells;

CREATE POLICY student_bingo_cells_student_insert ON public.student_bingo_cells
    FOR INSERT WITH CHECK (
        public.current_user_role() = 'student'
        AND student_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.bingo_cells bc
            JOIN public.bingo_cards bcard ON bcard.id = bc.card_id
            JOIN public.students s ON s.organization_id = bcard.organization_id
            WHERE bc.id = cell_id AND s.id = auth.uid()
        )
    );

CREATE POLICY student_bingo_cells_student_read ON public.student_bingo_cells
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND student_id = auth.uid()
    );

-- Update RLS policy for org_badges to filter by student's organization
DROP POLICY IF EXISTS org_badges_student_read ON public.org_badges;

CREATE POLICY org_badges_student_read ON public.org_badges
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND organization_id = (
            SELECT organization_id FROM public.students
            WHERE id = auth.uid()
        )
    );

-- Update RLS policy for student_org_badges to ensure same organization
DROP POLICY IF EXISTS student_org_badges_student_read ON public.student_org_badges;

CREATE POLICY student_org_badges_student_read ON public.student_org_badges
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND student_id = auth.uid()
    );

COMMIT;
