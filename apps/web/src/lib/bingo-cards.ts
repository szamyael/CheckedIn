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

export function getSupabaseErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message);
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export function normalizeBingoCardRow(row: Record<string, unknown>): BingoCardRow {
  const isActive = Boolean(row.is_active);
  const rawStatus = row.status as BingoCardStatus | undefined;
  const status: BingoCardStatus =
    rawStatus ?? (isActive ? "active" : "draft");

  return {
    id: row.id as string,
    title: row.title as string,
    season_label: row.season_label as string,
    streak_threshold: row.streak_threshold as number,
    line_badge_id: (row.line_badge_id as string | null) ?? null,
    streak_badge_id: (row.streak_badge_id as string | null) ?? null,
    is_active: isActive,
    status,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function isMissingColumnError(message: string, column: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(column.toLowerCase()) &&
    (lower.includes("column") ||
      lower.includes("schema cache") ||
      lower.includes("could not find"))
  );
}

export async function insertBingoCard(
  supabase: SupabaseClient,
  payload: {
    organization_id: string;
    title: string;
    season_label: string;
    streak_threshold: number;
    created_by: string;
  },
): Promise<BingoCardRow> {
  const base = {
    ...payload,
    is_active: false,
  };

  // Try inserting with status column first (migration 027 applied)
  let result = await supabase
    .from("bingo_cards")
    .insert({ ...base, status: "draft" as const })
    .select()
    .single();

  if (result.error) {
    // If status column is missing, fall back to old schema (pre-migration 027)
    if (isMissingColumnError(result.error.message, "status")) {
      result = await supabase.from("bingo_cards").insert(base).select().single();
    }
    
    // If still an error after fallback, provide diagnostic context
    if (result.error) {
      const errorMsg = result.error.message || "";
      const errorDetails = {
        message: errorMsg,
        hint: "Try these troubleshooting steps:",
        tips: [] as string[],
      };
      
      // Provide specific guidance based on error type
      if (errorMsg.toLowerCase().includes("permission denied") || 
          errorMsg.toLowerCase().includes("row-level security") ||
          errorMsg.toLowerCase().includes("rls")) {
        errorDetails.tips.push(
          "1. Verify your user role is 'org_member' or 'admin'",
          "2. Ensure your account is properly linked to the organization",
          "3. Check that the organization_id is correct"
        );
      }
      if (errorMsg.toLowerCase().includes("column") || 
          errorMsg.toLowerCase().includes("schema")) {
        errorDetails.tips.push(
          "1. Run database migrations (check migration 027_bingo_card_status.sql)",
          "2. Verify the bingo_cards table exists and has the expected columns"
        );
      }
      if (!errorDetails.tips.length) {
        errorDetails.tips.push(
          "1. Check browser console and server logs for more details",
          "2. Ensure Supabase project is accessible",
          "3. Verify bingo_cards table exists"
        );
      }
      
      const fullError = new Error(
        `Failed to create bingo card: ${errorMsg}\n${errorDetails.tips.join("\n")}`
      );
      throw fullError;
    }
  }

  return normalizeBingoCardRow(result.data as Record<string, unknown>);
}

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
  const now = new Date().toISOString();

  if (status === "active") {
    const demote = await supabase
      .from("bingo_cards")
      .update({ status: "draft", updated_at: now })
      .eq("organization_id", organizationId)
      .eq("status", "active");

    if (demote.error && isMissingColumnError(demote.error.message, "status")) {
      await supabase
        .from("bingo_cards")
        .update({ is_active: false, updated_at: now })
        .eq("organization_id", organizationId)
        .eq("is_active", true);
    }
  }

  let update = await supabase
    .from("bingo_cards")
    .update({ status, updated_at: now })
    .eq("id", cardId);

  if (update.error && isMissingColumnError(update.error.message, "status")) {
    if (status === "active") {
      await supabase
        .from("bingo_cards")
        .update({ is_active: false, updated_at: now })
        .eq("organization_id", organizationId)
        .eq("is_active", true);
    }
    update = await supabase
      .from("bingo_cards")
      .update({
        is_active: status === "active",
        updated_at: now,
      })
      .eq("id", cardId);
  }

  if (update.error) throw update.error;
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
