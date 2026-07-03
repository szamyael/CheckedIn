/*
|--------------------------------------------------------------------------
| CheckedIn — 004_students.sql
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.students (
    id UUID PRIMARY KEY
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    student_id VARCHAR(9) NOT NULL
        CONSTRAINT students_student_id_format
        CHECK (student_id ~ '^0[0-9]{3}-[0-9]{4}$'),

    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    program TEXT NOT NULL,

    id_card_image_url TEXT,
    veryfi_raw JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT students_student_id_unique UNIQUE (student_id)
);

COMMENT ON TABLE public.students IS
'Student profile linked to users. Login uses student_id + password.';

COMMENT ON COLUMN public.students.student_id IS
'Format: 0XXX-XXXX (immutable after registration).';

CREATE INDEX idx_students_student_id ON public.students (student_id);
CREATE INDEX idx_students_program ON public.students (program);

COMMIT;
