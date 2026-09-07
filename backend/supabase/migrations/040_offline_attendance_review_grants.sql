/*
| CheckedIn — 040_offline_attendance_review_grants.sql
| Lets authenticated users reach the table so its RLS policies can decide
| whether a student or staff member may read each row.
*/

BEGIN;

GRANT SELECT ON public.offline_attendance_submissions TO authenticated;

COMMIT;
