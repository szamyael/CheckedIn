/* Ensure deployed databases that pre-date the location picker accept an
   optional human-readable address, and that organization staff can create
   their own organization's events. Safe to run after migration 042. */

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue_address TEXT;

DROP POLICY IF EXISTS events_insert_org_or_admin ON public.events;
CREATE POLICY events_insert_org_or_admin ON public.events
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND (
      public.current_user_role() = 'admin'
      OR (
        public.current_user_role() = 'org_member'
        AND organization_id IS NOT NULL
        AND organization_id = public.staff_organization_id()
      )
    )
  );

COMMENT ON COLUMN public.events.venue_address IS
  'Human-readable address resolved from the selected event coordinates.';

-- Make the new column visible to the REST API immediately after deployment.
NOTIFY pgrst, 'reload schema';
