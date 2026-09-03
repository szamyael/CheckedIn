/*
|--------------------------------------------------------------------------
| CheckedIn — 037_dashboard_realtime.sql
| Enable Realtime for dashboard data sources.
|--------------------------------------------------------------------------
*/

BEGIN;

DO $$
DECLARE
    v_table_name TEXT;
BEGIN
    FOREACH v_table_name IN ARRAY ARRAY[
        'users',
        'students',
        'staff_profiles',
        'organizations',
        'organization_programs',
        'events',
        'attendance_records',
        'bingo_cards',
        'bingo_cells',
        'org_badges',
        'student_bingo_cells',
        'student_org_badges',
        'student_achievements',
        'notifications',
        'system_settings'
    ]
    LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND information_schema.tables.table_name = v_table_name
        ) AND NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND pg_publication_tables.tablename = v_table_name
        ) THEN
            EXECUTE format(
                'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
                v_table_name
            );
        END IF;
    END LOOP;
END $$;

COMMIT;