import type { SupabaseClient } from "@supabase/supabase-js";

export type BingoCardStatus = "draft" | "active" | "archived";

export type BingoCardRow = {
  id: string;
  title: string;
  season_label: string;
  streak_threshold: number;
  line_badge_id: string | null;
  streak_badge_id: string | null;
  is_active: boolean;
  status: BingoCardStatus;
  created_at: string;
  updated_at: string;
};

export function badgeSlugsForCard(cardId: string, season: string) {
  const suffix = cardId.slice(0, 8);
  const seasonSlug = season.toLowerCase().replace(/\s+/g, "-");
  return {
    line: `line-${seasonSlug}-${suffix}`,
    streak: `streak-${seasonSlug}-${suffix}`,
  };
}

export async function createBingoCardCells(
  supabase: SupabaseClient,
  cardId: string,
) {
  const cellInserts = Array.from({ length: 9 }, (_, position) => ({
    card_id: cardId,
    position,
    event_id: null,
    label: null,
  }));
  const { error } = await supabase.from("bingo_cells").insert(cellInserts);
  if (error) throw error;
}

export async function setBingoCardStatus(
  supabase: SupabaseClient,
  organizationId: string,
  cardId: string,
  status: BingoCardStatus,
) {
  if (status === "active") {
    await supabase
      .from("bingo_cards")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("status", "active");
  }

  const { error } = await supabase
    .from("bingo_cards")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", cardId);

  if (error) throw error;
}

export function statusLabel(status: BingoCardStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "archived":
      return "Archived";
    default:
      return "Draft";
  }
}

export function statusBadgeClass(status: BingoCardStatus): string {
  switch (status) {
    case "active":
      return "bg-teal-50 text-teal-700";
    case "archived":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-amber-50 text-amber-800";
  }
}
