/*
|--------------------------------------------------------------------------
| CheckedIn — 031_attendance_monitoring_diagnostics_fix.sql
| Fix attendance monitoring data integrity issues
|--------------------------------------------------------------------------
*/

BEGIN;

-- Fix 1: Ensure all attendance_records have valid event_id references
-- This finds orphaned records or NULL event_ids that would be filtered out
ALTER TABLE public.attendance_records
    ADD CONSTRAINT attendance_records_valid_event
    CHECK (event_id IS NOT NULL);

-- Fix 2: Create an index on event_id for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_event_status 
    ON public.attendance_records (event_id, status);

-- Fix 3: Ensure status column values are correct (status is already an enum, so no UPDATE needed)
-- The actual enum values are: 'checked_in', 'rejected_location', 'rejected_duplicate', 'rejected_invalid_qr'
-- No check constraint needed as the enum type already enforces valid values

-- Fix 4: Create index for admin queries (monitoring attendees by event and status)
CREATE INDEX IF NOT EXISTS idx_attendance_admin_monitor
    ON public.attendance_records (event_id, status, checked_in_at DESC);

-- Fix 5: Improve the attendance_records RLS policy to explicitly allow student self-read
DROP POLICY IF EXISTS attendance_student_read ON public.attendance_records;

CREATE POLICY attendance_student_read ON public.attendance_records
    FOR SELECT USING (
        public.current_user_role() = 'student'
        AND student_id = auth.uid()
    );

-- Add missing INSERT policy for check-in service
DROP POLICY IF EXISTS attendance_insert_check_in ON public.attendance_records;

CREATE POLICY attendance_insert_check_in ON public.attendance_records
    FOR INSERT WITH CHECK (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'student'
            AND student_id = auth.uid()
        )
    );

-- Add missing UPDATE policy for manual overrides
DROP POLICY IF EXISTS attendance_update_staff ON public.attendance_records;

CREATE POLICY attendance_update_staff ON public.attendance_records
    FOR UPDATE USING (
        public.current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = attendance_records.event_id
            AND (
                e.created_by = auth.uid()
                OR (
                    public.current_user_role() = 'org_member'
                    AND e.organization_id = public.staff_organization_id()
                )
            )
        )
    )
    WITH CHECK (
        public.current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = attendance_records.event_id
            AND (
                e.created_by = auth.uid()
                OR (
                    public.current_user_role() = 'org_member'
                    AND e.organization_id = public.staff_organization_id()
                )
            )
        )
    );

COMMIT;
