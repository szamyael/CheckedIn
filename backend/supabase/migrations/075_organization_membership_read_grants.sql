BEGIN;

GRANT SELECT ON TABLE
    public.organization_programs,
    public.organization_memberships
TO authenticated;

COMMIT;
