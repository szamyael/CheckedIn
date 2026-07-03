/*
|--------------------------------------------------------------------------
| CheckedIn
|--------------------------------------------------------------------------
| Migration : 003_auth_tables.sql
| Description:
|   Creates the core application users table linked to Supabase Auth.
|--------------------------------------------------------------------------
*/

BEGIN;

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE public.users (

    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    role user_role NOT NULL,

    status account_status
        NOT NULL
        DEFAULT 'pending',

    email CITEXT UNIQUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    last_login_at TIMESTAMPTZ,

    disabled_at TIMESTAMPTZ

);

COMMENT ON TABLE public.users IS
'Application user records linked to auth.users.';

COMMENT ON COLUMN public.users.id IS
'Primary key mapped to auth.users.id.';

COMMENT ON COLUMN public.users.role IS
'System role assigned to the authenticated user.';

COMMENT ON COLUMN public.users.status IS
'Lifecycle state of the user account.';

COMMENT ON COLUMN public.users.email IS
'Email address used by faculty, organizations and administrators. Students authenticate using Student ID but still require an auth.users account.';

COMMENT ON COLUMN public.users.last_login_at IS
'Timestamp of the most recent successful login.';

COMMENT ON COLUMN public.users.disabled_at IS
'Timestamp indicating when an account was disabled.';

-- ============================================================================
-- UPDATED AT TRIGGER PLACEHOLDER
-- ============================================================================

/*
The trigger function that automatically updates updated_at
will be created in:

010_triggers.sql

Example:

BEFORE UPDATE
SET updated_at = NOW();
*/

COMMIT;