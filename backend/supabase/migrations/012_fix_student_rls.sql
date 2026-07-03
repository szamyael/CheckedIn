/*
|--------------------------------------------------------------------------
| CheckedIn — 012_fix_student_rls.sql
|--------------------------------------------------------------------------
| Allows mobile student registration and last_login_at updates under RLS.
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE POLICY users_insert_student ON public.users
    FOR INSERT WITH CHECK (
        id = auth.uid()
        AND role = 'student'
    );

CREATE POLICY users_update_own ON public.users
    FOR UPDATE USING (id = auth.uid());

COMMIT;
