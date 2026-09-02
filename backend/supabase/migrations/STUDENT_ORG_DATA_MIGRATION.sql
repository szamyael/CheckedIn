/*
|--------------------------------------------------------------------------
| CheckedIn — STUDENT ORGANIZATION LINKING DATA MIGRATION
| Populate organization_id for existing students (Run after migration 029)
|--------------------------------------------------------------------------
|
| INSTRUCTIONS:
| 1. Choose ONE of the strategies below
| 2. Replace [ORG_UUID] with an actual organization UUID
| 3. Run the migration: supabase db query --file this-migration.sql --linked
| 4. Verify: SELECT COUNT(*) FROM students WHERE organization_id IS NOT NULL;
|
| ========================================================================
*/

BEGIN;

-- ========================================================================
-- STRATEGY 1: LINK ALL STUDENTS TO SINGLE ORGANIZATION (Default)
-- ========================================================================
-- Use this if you have one main organization
-- Replace '[ORG_UUID]' with your organization's UUID

-- First, find your organization:
-- SELECT id, name FROM organizations LIMIT 5;

/*
UPDATE public.students
SET organization_id = '[ORG_UUID]'
WHERE organization_id IS NULL;
*/

-- ========================================================================
-- STRATEGY 2: LINK STUDENTS BY PROGRAM (Multi-Organization)
-- ========================================================================
-- Map different programs to different organizations
-- Modify the mappings below to match your org structure

/*
-- Example: Map engineering students to one org, business to another
-- First, get your org IDs:
-- SELECT id, name FROM organizations;

UPDATE public.students
SET organization_id = (
    SELECT id FROM public.organizations 
    WHERE name ILIKE '%Engineering%'
    LIMIT 1
)
WHERE program = 'Engineering' AND organization_id IS NULL;

UPDATE public.students
SET organization_id = (
    SELECT id FROM public.organizations 
    WHERE name ILIKE '%Business%'
    LIMIT 1
)
WHERE program = 'Business' AND organization_id IS NULL;
*/

-- ========================================================================
-- STRATEGY 3: LINK TO ORGANIZATION CREATED BY SAME ADMIN (Recommended)
-- ========================================================================
-- This approach links students to the org their admin/faculty member manages
-- Useful if each faculty/staff person manages their own organization

/*
UPDATE public.students s
SET organization_id = o.id
FROM public.organizations o
WHERE s.organization_id IS NULL
  AND o.created_by IN (
    SELECT id FROM public.staff_profiles 
    WHERE role = 'admin' OR role = 'org_member'
  )
LIMIT 1;
*/

-- ========================================================================
-- STRATEGY 4: INTERACTIVE - CREATE AND ASSIGN
-- ========================================================================
-- If no organizations exist, create one and link students

/*
WITH new_org AS (
    INSERT INTO public.organizations (name, description, created_by)
    SELECT 
        'Default Student Organization',
        'Automatically created for student bingo cards',
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    WHERE NOT EXISTS (SELECT 1 FROM public.organizations)
    RETURNING id
)
UPDATE public.students
SET organization_id = (SELECT id FROM new_org)
WHERE organization_id IS NULL;
*/

-- ========================================================================
-- VERIFICATION QUERIES (Run these to verify the migration worked)
-- ========================================================================

-- Check how many students now have organizations:
SELECT 
    COUNT(*) as total_students,
    COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as linked_students,
    COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as unlinked_students
FROM public.students;

-- See the distribution by organization:
SELECT 
    o.name,
    COUNT(s.id) as student_count
FROM public.students s
LEFT JOIN public.organizations o ON o.id = s.organization_id
GROUP BY o.name
ORDER BY student_count DESC;

-- Check if any students can now see bingo cards:
-- This should return active bingo cards for the student's organization
-- SELECT * FROM bingo_cards WHERE status = 'active';

-- ========================================================================
-- TROUBLESHOOTING
-- ========================================================================

-- If students still have NULL organization_id:
-- SELECT COUNT(*) FROM students WHERE organization_id IS NULL;

-- If organizations don't exist yet:
-- SELECT id, name FROM organizations;

-- If you need to reassign students to a different org:
-- UPDATE students SET organization_id = '[NEW_ORG_UUID]' WHERE organization_id = '[OLD_ORG_UUID]';

COMMIT;
