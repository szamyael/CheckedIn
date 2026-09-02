import type { SupabaseClient } from "@supabase/supabase-js";

export type OrgBingoEvent = {
  id: string;
  title: string;
  starts_at: string;
  status: string;
  organization_id: string | null;
  created_by: string;
};

/**
 * Published events eligible for an org bingo card: linked by organization_id
 * or created by a member of that organization (covers legacy rows with null org).
 */
export async function fetchOrgBingoEvents(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrgBingoEvent[]> {
  const { data: staffRows } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("organization_id", organizationId);

  const staffIds = (staffRows ?? []).map((row) => row.id as string);

  let query = supabase
    .from("events")
    .select("id, title, starts_at, status, organization_id, created_by")
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  if (staffIds.length > 0) {
    query = query.or(
      `organization_id.eq.${organizationId},created_by.in.(${staffIds.join(",")})`,
    );
  } else {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OrgBingoEvent[];
}

/** Backfill organization_id on events created by org staff that were saved without it. */
export async function backfillEventOrganizationIds(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const { data: staffRows } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("organization_id", organizationId);

  const staffIds = (staffRows ?? []).map((row) => row.id as string);
  if (staffIds.length === 0) return 0;

  const { data: updated, error } = await supabase
    .from("events")
    .update({ organization_id: organizationId })
    .is("organization_id", null)
    .in("created_by", staffIds)
    .select("id");

  if (error) throw error;
  return updated?.length ?? 0;
}
