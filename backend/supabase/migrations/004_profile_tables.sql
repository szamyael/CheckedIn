/*
|--------------------------------------------------------------------------
| CheckedIn
|--------------------------------------------------------------------------
| Migration : 004_profile_tables.sql
| Part       : 1 of 4
| Description:
|   Creates profile tables.
|   This section creates the STUDENTS table.
|--------------------------------------------------------------------------
*/

BEGIN;

-- ============================================================================
-- STUDENTS
-- ============================================================================

CREATE TABLE public.students (

    id UUID PRIMARY KEY
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    student_number VARCHAR(9)
        NOT NULL
        UNIQUE,

    first_name VARCHAR(100)
        NOT NULL,

    middle_name VARCHAR(100),

    last_name VARCHAR(100)
        NOT NULL,

    course_code VARCHAR(30)
        NOT NULL,

    program_name VARCHAR(150)
        NOT NULL,

    profile_photo_url TEXT,

    ocr_status ocr_status
        NOT NULL
        DEFAULT 'processing',

    ocr_verified_at TIMESTAMPTZ,

    registration_completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT chk_student_number
        CHECK (
            student_number ~ '^0[0-9]{3}-[0-9]{4}$'
        )

);

COMMENT ON TABLE public.students IS
'Student profile information.';

COMMENT ON COLUMN public.students.id IS
'References public.users.id';

COMMENT ON COLUMN public.students.student_number IS
'Official institutional student number (Format: 0XXX-XXXX).';

COMMENT ON COLUMN public.students.course_code IS
'Program abbreviation (e.g., BSIT,  BSCS).';

COMMENT ON COLUMN public.students.program_name IS
'Complete academic program name.';

COMMENT ON COLUMN public.students.ocr_status IS
'Result of Veryfi OCR verification during registration.';

COMMENT ON COLUMN public.students.registration_completed_at IS
'Timestamp indicating successful completion of registration.';



COMMIT;