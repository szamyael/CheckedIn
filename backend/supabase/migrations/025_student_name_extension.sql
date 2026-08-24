/*
|--------------------------------------------------------------------------
| CheckedIn — 025_student_name_extension.sql
|--------------------------------------------------------------------------
*/

BEGIN;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS name_extension TEXT;

COMMENT ON COLUMN public.students.name_extension IS
'Optional name suffix / extension from student ID (e.g. Jr., Sr., III).';

COMMIT;
