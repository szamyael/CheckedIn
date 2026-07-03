/*
|--------------------------------------------------------------------------
| CheckedIn — 002_enums.sql
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'faculty',
    'org_member',
    'student'
);

CREATE TYPE public.account_status AS ENUM (
    'pending',
    'active',
    'disabled'
);

CREATE TYPE public.event_status AS ENUM (
    'draft',
    'published',
    'cancelled',
    'completed'
);

CREATE TYPE public.attendance_status AS ENUM (
    'checked_in',
    'rejected_location',
    'rejected_duplicate',
    'rejected_invalid_qr'
);

COMMIT;
