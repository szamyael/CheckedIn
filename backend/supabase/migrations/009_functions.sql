/*
|--------------------------------------------------------------------------
| CheckedIn — 009_functions.sql
|--------------------------------------------------------------------------
*/

BEGIN;

-- Haversine distance in meters between two lat/lng points
CREATE OR REPLACE FUNCTION public.haversine_distance_m(
    lat1 DOUBLE PRECISION,
    lng1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT 6371000 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(lat2 - lat1) / 2), 2)
        + COS(RADIANS(lat1)) * COS(RADIANS(lat2))
        * POWER(SIN(RADIANS(lng2 - lng1) / 2), 2)
    ));
$$;

-- Validate student ID format 0XXX-XXXX
CREATE OR REPLACE FUNCTION public.is_valid_student_id(sid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT sid ~ '^0[0-9]{3}-[0-9]{4}$';
$$;

-- Synthetic auth email for student accounts
CREATE OR REPLACE FUNCTION public.student_auth_email(sid TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT lower(sid) || '@student.checkedin.local';
$$;

COMMIT;
