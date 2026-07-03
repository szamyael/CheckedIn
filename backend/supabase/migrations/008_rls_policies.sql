/*
|--------------------------------------------------------------------------
| CheckedIn — 008_rls_policies.sql
|--------------------------------------------------------------------------
*/

BEGIN;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Helper: current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- USERS
CREATE POLICY users_select_own ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY users_admin_all ON public.users
    FOR ALL USING (public.current_user_role() = 'admin');

-- STUDENTS
CREATE POLICY students_select_own ON public.students
    FOR SELECT USING (id = auth.uid());

CREATE POLICY students_insert_own ON public.students
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY students_admin_faculty_select ON public.students
    FOR SELECT USING (
        public.current_user_role() IN ('admin', 'faculty')
    );

-- STAFF PROFILES
CREATE POLICY staff_select_own ON public.staff_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY staff_admin_manage ON public.staff_profiles
    FOR ALL USING (public.current_user_role() = 'admin');

-- ORGANIZATIONS
CREATE POLICY orgs_read_all_staff ON public.organizations
    FOR SELECT USING (
        public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

CREATE POLICY orgs_admin_manage ON public.organizations
    FOR ALL USING (public.current_user_role() = 'admin');

-- EVENTS
CREATE POLICY events_read_published ON public.events
    FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.current_user_role() IN ('admin', 'faculty')
    );

CREATE POLICY events_insert_staff ON public.events
    FOR INSERT WITH CHECK (
        public.current_user_role() IN ('admin', 'faculty', 'org_member')
        AND created_by = auth.uid()
    );

CREATE POLICY events_update_own ON public.events
    FOR UPDATE USING (
        created_by = auth.uid()
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY events_delete_own ON public.events
    FOR DELETE USING (
        created_by = auth.uid()
        OR public.current_user_role() = 'admin'
    );

-- ATTENDANCE
CREATE POLICY attendance_student_insert ON public.attendance_records
    FOR INSERT WITH CHECK (
        student_id = auth.uid()
        AND public.current_user_role() = 'student'
    );

CREATE POLICY attendance_student_read_own ON public.attendance_records
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY attendance_staff_read ON public.attendance_records
    FOR SELECT USING (
        public.current_user_role() IN ('admin', 'faculty', 'org_member')
    );

COMMIT;
