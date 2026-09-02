"use client";

import { useCallback, useEffect, useState } from "react";
import { useLoader } from "@/components/LoaderProvider";
import {
  backfillEventOrganizationIds,
  fetchOrgBingoEvents,
  type OrgBingoEvent,
} from "@/lib/org-events";
import { createClient } from "@/lib/supabase/client";

type OrgBadge = {
  id: string;
  name: string;
  slug: string;
  points: number;
  kind: string;
};

type BingoCard = {
  id: string;
  title: string;
  season_label: string;
  streak_threshold: number;
  line_badge_id: string | null;
  streak_badge_id: string | null;
  is_active: boolean;
};

type BingoCell = {
  id: string;
  position: number;
  event_id: string | null;
  label: string | null;
};

type OrgEvent = OrgBingoEvent;

type AwardRow = {
  id: string;
  earned_at: string;
  points_awarded: number;
  org_badges: { name: string } | null;
  students: { first_name: string; last_name: string; student_id: string } | null;
};

export function OrgBingoManager({ organizationId }: { organizationId: string }) {
  const { showLoader, hideLoader } = useLoader();
  const [card, setCard] = useState<BingoCard | null>(null);
  const [cells, setCells] = useState<BingoCell[]>([]);
  const [badges, setBadges] = useState<OrgBadge[]>([]);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [awards, setAwards] = useState<AwardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("Semester Bingo");
  const [season, setSeason] = useState("2026");
  const [streakThreshold, setStreakThreshold] = useState(3);
  const [lineBadgeName, setLineBadgeName] = useState("Events Goer 2026");
  const [linePoints, setLinePoints] = useState(50);
  const [streakBadgeName, setStreakBadgeName] = useState("Event Streak");
  const [streakPoints, setStreakPoints] = useState(30);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data: cards } = await supabase
      .from("bingo_cards")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1);

    const active = (cards?.[0] as BingoCard | undefined) ?? null;
    setCard(active);

    const { data: badgeRows } = await supabase
      .from("org_badges")
      .select("id, name, slug, points, kind")
      .eq("organization_id", organizationId);
    setBadges((badgeRows as OrgBadge[]) ?? []);

    const { data: eventRows, error: eventsError } = await (async () => {
      try {
        await backfillEventOrganizationIds(supabase, organizationId);
        const rows = await fetchOrgBingoEvents(supabase, organizationId);
        return { data: rows, error: null };
      } catch (err) {
        return {
          data: [] as OrgEvent[],
          error: err instanceof Error ? err : new Error("Could not load events"),
        };
      }
    })();

    if (eventsError) {
      setError(eventsError.message);
    }
    setEvents(eventRows ?? []);

    if (active) {
      setTitle(active.title);
      setSeason(active.season_label);
      setStreakThreshold(active.streak_threshold);

      const { data: cellRows } = await supabase
        .from("bingo_cells")
        .select("id, position, event_id, label")
        .eq("card_id", active.id)
        .order("position");
      setCells((cellRows as BingoCell[]) ?? []);

      const { data: awardRows } = await supabase
        .from("student_org_badges")
        .select(
          "id, earned_at, points_awarded, org_badges(name), students(first_name, last_name, student_id)",
        )
        .eq("bingo_card_id", active.id)
        .order("earned_at", { ascending: false })
        .limit(30);
      setAwards((awardRows as unknown as AwardRow[]) ?? []);
    } else {
      setCells([]);
      setAwards([]);
    }
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createOrUpdateCard() {
    setError(null);
    showLoader("Saving bingo card…");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const slugLine = `line-${season}`.toLowerCase().replace(/\s+/g, "-");
      const slugStreak = `streak-${season}`.toLowerCase().replace(/\s+/g, "-");

      const { data: lineBadge, error: lineErr } = await supabase
        .from("org_badges")
        .upsert(
          {
            organization_id: organizationId,
            slug: slugLine,
            name: lineBadgeName,
            points: linePoints,
            kind: "bingo_line",
            created_by: user.id,
          },
          { onConflict: "organization_id,slug" },
        )
        .select()
        .single();
      if (lineErr) throw lineErr;

      const { data: streakBadge, error: streakErr } = await supabase
        .from("org_badges")
        .upsert(
          {
            organization_id: organizationId,
            slug: slugStreak,
            name: streakBadgeName,
            points: streakPoints,
            kind: "streak",
            created_by: user.id,
          },
          { onConflict: "organization_id,slug" },
        )
        .select()
        .single();
      if (streakErr) throw streakErr;

      if (card) {
        const { error: updErr } = await supabase
          .from("bingo_cards")
          .update({
            title,
            season_label: season,
            streak_threshold: streakThreshold,
            line_badge_id: lineBadge.id,
            streak_badge_id: streakBadge.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", card.id);
        if (updErr) throw updErr;
      } else {
        // Deactivate other cards, create active one with 9 empty cells.
        await supabase
          .from("bingo_cards")
          .update({ is_active: false })
          .eq("organization_id", organizationId);

        const { data: newCard, error: cardErr } = await supabase
          .from("bingo_cards")
          .insert({
            organization_id: organizationId,
            title,
            season_label: season,
            streak_threshold: streakThreshold,
            line_badge_id: lineBadge.id,
            streak_badge_id: streakBadge.id,
            is_active: true,
            created_by: user.id,
          })
          .select()
          .single();
        if (cardErr) throw cardErr;

        const cellInserts = Array.from({ length: 9 }, (_, position) => ({
          card_id: newCard.id,
          position,
          event_id: null,
          label: null,
        }));
        const { error: cellsErr } = await supabase
          .from("bingo_cells")
          .insert(cellInserts);
        if (cellsErr) throw cellsErr;
      }

      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      hideLoader();
    }
  }

  async function assignEvent(position: number, eventId: string) {
    if (!card) return;
    setError(null);
    showLoader("Updating cell…");
    try {
      const event = events.find((e) => e.id === eventId);
      const { error: updErr } = await supabaseUpdateCell(
        card.id,
        position,
        eventId || null,
        event?.title ?? null,
      );
      if (updErr) throw updErr;
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign event");
    } finally {
      hideLoader();
    }
  }

  async function supabaseUpdateCell(
    cardId: string,
    position: number,
    eventId: string | null,
    label: string | null,
  ) {
    const supabase = createClient();
    return supabase
      .from("bingo_cells")
      .update({ event_id: eventId, label })
      .eq("card_id", cardId)
      .eq("position", position);
  }

  async function activateCard() {
    if (!card) return;
    showLoader("Activating…");
    try {
      const supabase = createClient();
      await supabase
        .from("bingo_cards")
        .update({ is_active: false })
        .eq("organization_id", organizationId);
      await supabase
        .from("bingo_cards")
        .update({ is_active: true })
        .eq("id", card.id);
      await reload();
    } finally {
      hideLoader();
    }
  }

  const cellByPos = (pos: number) => cells.find((c) => c.position === pos);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bingo &amp; Badges</h1>
        <p className="mt-1 text-sm text-slate-700">
          Build a 3×3 bingo card from your published events. Completing a line
          or a streak awards org badges and points.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Card settings</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Season label
            <input
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Streak threshold
            <input
              type="number"
              min={2}
              value={streakThreshold}
              onChange={(e) => setStreakThreshold(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Line badge name
            <input
              value={lineBadgeName}
              onChange={(e) => setLineBadgeName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Line badge points
            <input
              type="number"
              min={0}
              value={linePoints}
              onChange={(e) => setLinePoints(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Streak badge name
            <input
              value={streakBadgeName}
              onChange={(e) => setStreakBadgeName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Streak badge points
            <input
              type="number"
              min={0}
              value={streakPoints}
              onChange={(e) => setStreakPoints(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void createOrUpdateCard()}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
          >
            {card ? "Update card & badges" : "Create active bingo card"}
          </button>
          {card && !card.is_active && (
            <button
              type="button"
              onClick={() => void activateCard()}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Activate this card
            </button>
          )}
          {card?.is_active && (
            <span className="rounded-full bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
              Active
            </span>
          )}
        </div>
      </section>

      {card && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">3×3 event grid</h2>
          <p className="text-sm text-slate-600">
            Assign one published org event to each cell.
            {events.length === 0 && (
              <span className="mt-1 block text-amber-700">
                No published events found for your organization yet. Create and
                publish events on the Events page (org-submitted events must be
                approved by an admin first).
              </span>
            )}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }, (_, position) => {
              const cell = cellByPos(position);
              return (
                <div
                  key={position}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Cell {position + 1}
                  </p>
                  <select
                    value={cell?.event_id ?? ""}
                    onChange={(e) =>
                      void assignEvent(position, e.target.value)
                    }
                    className="w-full rounded-lg border bg-white px-2 py-2 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Org badges</h2>
        {badges.length === 0 ? (
          <p className="text-sm text-slate-500">No badges yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {badges.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <span>
                  {b.name}{" "}
                  <span className="text-xs text-slate-400">({b.kind})</span>
                </span>
                <span className="font-medium text-teal-700">+{b.points} pts</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Recent badge awards</h2>
        {awards.length === 0 ? (
          <p className="text-sm text-slate-500">No awards yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {awards.map((a) => (
              <li key={a.id} className="rounded-lg border px-3 py-2">
                <span className="font-medium">
                  {a.students
                    ? `${a.students.first_name} ${a.students.last_name}`
                    : "Student"}
                </span>{" "}
                earned <span className="text-teal-700">{a.org_badges?.name}</span>{" "}
                (+{a.points_awarded})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
