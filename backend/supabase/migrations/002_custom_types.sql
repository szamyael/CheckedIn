/*
|--------------------------------------------------------------------------
| CheckedIn
|--------------------------------------------------------------------------
| Migration : 002_custom_types.sql
| Description:
|   Creates all custom PostgreSQL ENUM types used throughout
|   the CheckedIn system.
|--------------------------------------------------------------------------
*/

BEGIN;

-- ============================================================================
-- USER ROLES
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'admin',
    'faculty',
    'organization',
    'student'
);

COMMENT ON TYPE user_role IS
'Application roles.';

-- ============================================================================
-- ACCOUNT STATUS
-- ============================================================================

CREATE TYPE account_status AS ENUM (
    'pending',
    'active',
    'inactive',
    'suspended',
    'archived'
);

COMMENT ON TYPE account_status IS
'Lifecycle state of a user account.';

-- ============================================================================
-- EVENT STATUS
-- ============================================================================

CREATE TYPE event_status AS ENUM (
    'draft',
    'published',
    'attendance_open',
    'attendance_closed',
    'completed',
    'cancelled',
    'archived'
);

COMMENT ON TYPE event_status IS
'Lifecycle state of an event.';

-- ============================================================================
-- ATTENDANCE STATUS
-- ============================================================================

CREATE TYPE attendance_status AS ENUM (
    'pending',
    'present',
    'late',
    'rejected',
    'excused'
);

COMMENT ON TYPE attendance_status IS
'Attendance result after verification.';

-- ============================================================================
-- VERIFICATION STATUS
-- ============================================================================

CREATE TYPE verification_status AS ENUM (
    'pending',
    'verified',
    'failed'
);

COMMENT ON TYPE verification_status IS
'Verification result used for GPS, selfie, OCR and QR validation.';

-- ============================================================================
-- QR STATUS
-- ============================================================================

CREATE TYPE qr_status AS ENUM (
    'generated',
    'active',
    'expired',
    'revoked'
);

COMMENT ON TYPE qr_status IS
'Status of an event QR session.';

-- ============================================================================
-- EVENT CREATOR TYPE
-- ============================================================================

CREATE TYPE organizer_type AS ENUM (
    'faculty',
    'organization'
);

COMMENT ON TYPE organizer_type IS
'Identifies who created the event.';

-- ============================================================================
-- NOTIFICATION TYPE
-- ============================================================================

CREATE TYPE notification_type AS ENUM (
    'announcement',
    'event',
    'attendance',
    'reminder',
    'system'
);

COMMENT ON TYPE notification_type IS
'Notification category.';

-- ============================================================================
-- NOTIFICATION STATUS
-- ============================================================================

CREATE TYPE notification_status AS ENUM (
    'unread',
    'read'
);

COMMENT ON TYPE notification_status IS
'Read status of a notification.';

-- ============================================================================
-- AUDIT ACTION
-- ============================================================================

CREATE TYPE audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'verify',
    'export'
);

COMMENT ON TYPE audit_action IS
'Supported audit trail actions.';

-- ============================================================================
-- FILE TYPE
-- ============================================================================

CREATE TYPE storage_file_type AS ENUM (
    'profile_photo',
    'event_banner',
    'attendance_selfie',
    'organization_logo',
    'faculty_profile',
    'system_asset'
);

COMMENT ON TYPE storage_file_type IS
'Logical file categories stored in Supabase Storage.';

-- ============================================================================
-- DEVICE PLATFORM
-- ============================================================================

CREATE TYPE device_platform AS ENUM (
    'android',
    'ios',
    'web'
);

COMMENT ON TYPE device_platform IS
'Platform used by the authenticated client.';

-- ============================================================================
-- OCR STATUS
-- ============================================================================

CREATE TYPE ocr_status AS ENUM (
    'processing',
    'matched',
    'mismatch',
    'failed'
);

COMMENT ON TYPE ocr_status IS
'Result returned after Veryfi OCR validation.';

-- ============================================================================
-- SELFIE VERIFICATION STATUS
-- ============================================================================

CREATE TYPE selfie_status AS ENUM (
    'pending',
    'matched',
    'not_matched',
    'manual_review'
);

COMMENT ON TYPE selfie_status IS
'Result of selfie verification.';

-- ============================================================================
-- GPS STATUS
-- ============================================================================

CREATE TYPE gps_status AS ENUM (
    'inside_radius',
    'outside_radius',
    'location_disabled',
    'permission_denied'
);

COMMENT ON TYPE gps_status IS
'GPS verification outcome during attendance.';

COMMIT; 