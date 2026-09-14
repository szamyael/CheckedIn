-- Student account review: denied accounts are suspended with a staff-visible reason.

ALTER TYPE public.account_status ADD VALUE IF NOT EXISTS 'suspended';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_status_reason TEXT;

COMMENT ON COLUMN public.users.account_status_reason IS
  'Required staff review reason when a student account is suspended; cleared on approval.';
