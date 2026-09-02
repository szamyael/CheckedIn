/*
|--------------------------------------------------------------------------
| Bingo Card Student Visibility - Testing & Setup Guide
|--------------------------------------------------------------------------
*/

## Problem Fixed
Published bingo cards now correctly show only to students in their organization.

## Migration Applied
- **File**: backend/supabase/migrations/029_students_organization_link.sql
- **Changes**: 
  - Added `organization_id` FK column to students table
  - Updated RLS policies to filter bingo cards by student's organization

## How to Set Up

### 1. Run the Migration
```bash
cd backend
supabase migration up
```

### 2. Populate Student Organization Data

Students need an organization_id to see bingo cards. Choose one of these approaches:

**Option A: Link Students to Organization via SQL** (for testing/development)
```sql
-- Link all students to a specific organization (replace org_id)
UPDATE public.students
SET organization_id = '[ORG_UUID_HERE]'
WHERE organization_id IS NULL;

-- Or link students by program to different organizations
UPDATE public.students
SET organization_id = '[ORG_UUID_HERE]'
WHERE program = 'Engineering' AND organization_id IS NULL;
```

**Option B: Use Seed Script** (if one exists)
```bash
node backend/scripts/seed-student-organizations.mjs
```

**Option C: Manual Assignment** (via admin panel when available)
- Navigate to organization settings
- Assign students to organization

### 3. Verify the Fix

**Test 1: Check student can see their org's active card**
```bash
# In Supabase dashboard, as a student user:
SELECT * FROM bingo_cards WHERE status = 'active';
-- Should return ONLY the active card from student's organization
```

**Test 2: Verify students can't see other orgs' cards**
```bash
-- Login as different students from different orgs
-- Each should see only their org's active card (or none if no card active)
```

**Test 3: Test via web app**
1. Login as a student
2. Navigate to Bingo tab
3. Should see their organization's active bingo card
4. If no active card, should show empty state

**Test 4: Test via mobile app**
1. Login as a student
2. Navigate to Bingo board
3. Should load their organization's active bingo card

## Database Schema Reference

### Students Table (Updated)
```sql
students (
  id UUID PRIMARY KEY,
  student_id VARCHAR(9) UNIQUE NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  program TEXT,
  organization_id UUID FK,  -- NEW: Links to organizations table
  ...
)
```

### RLS Policy (New for Students)
```sql
-- Bingo cards: Students only see their org's active cards
WHERE current_user_role() = 'student'
  AND status = 'active'
  AND organization_id = (
    SELECT organization_id FROM students WHERE id = auth.uid()
  )
```

## Troubleshooting

### Students see no bingo card
- [ ] Check student has `organization_id` set: 
  ```sql
  SELECT id, organization_id FROM students WHERE id = '[STUDENT_UUID]';
  ```
- [ ] Check organization has an active bingo card:
  ```sql
  SELECT * FROM bingo_cards 
  WHERE organization_id = '[ORG_UUID]' AND status = 'active';
  ```

### Students see wrong org's card
- [ ] Verify `organization_id` is correct for each student
- [ ] Check RLS policy is properly applied (should be in migration 029)

### Migration failed
- [ ] Check for existing `organization_id` column: 
  ```sql
  \d students
  ```
- [ ] If column exists, verify policies are updated

## Rollback (if needed)
```bash
supabase migration down 029_students_organization_link.sql
```

This removes:
- organization_id column from students
- Updated RLS policies (reverts to old policies that don't filter by org)

⚠️ WARNING: Reverting will allow students to see cards from other organizations again.
