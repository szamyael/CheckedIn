/*
|--------------------------------------------------------------------------
| CheckedIn — 015_realtime.sql
| Enable live attendance monitoring via Supabase Realtime
|--------------------------------------------------------------------------
*/

BEGIN;

ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;

COMMIT;
