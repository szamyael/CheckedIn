/* Require an auditable staff reason whenever an offline capture is rejected. */

ALTER TABLE public.offline_attendance_submissions
    DROP CONSTRAINT IF EXISTS offline_attendance_rejection_requires_note;

ALTER TABLE public.offline_attendance_submissions
    ADD CONSTRAINT offline_attendance_rejection_requires_note CHECK (
        review_status <> 'rejected' OR NULLIF(BTRIM(review_note), '') IS NOT NULL
    );

NOTIFY pgrst, 'reload schema';
