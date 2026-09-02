import type { SupabaseClient } from "@supabase/supabase-js";

export type BingoCardEvent = {
  id: string;
  title: string;
  starts_at: string;
  status: string;
  organization_id: string | null;
  created_by: string;
};

/** All events visible to the current user (admin, org, published campus-wide, etc.). */
export async function fetchBingoCardEvents(
  supabase: SupabaseClient,
): Promise<BingoCardEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, status, organization_id, created_by")
    .order("starts_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BingoCardEvent[];
}
