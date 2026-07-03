/*
|--------------------------------------------------------------------------
| CheckedIn — 001_extensions.sql
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "citext";

COMMIT;
