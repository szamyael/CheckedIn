-- Kept separate from 056 so the newly-added enum value is committed before use.
UPDATE public.users
SET status = 'suspended'
WHERE role = 'student' AND status = 'disabled';
