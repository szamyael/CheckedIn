"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoader } from "@/components/LoaderProvider";
import { OrgBadgesPanel } from "@/components/bingo/OrgBadgesPanel";
import {
  badgeSlugsForCard,
  createBingoCardCells,
  getSupabaseErrorMessage,
  insertBingoCard,
  isMissingColumnError,
  normalizeBingoCardRow,
  setBingoCardStatus,
  statusBadgeClass,
  statusLabel,
  type BingoCardRow,
  type BingoCardStatus,
} from "@/lib/bingo-cards";
import { fetchBingoCardEvents, type BingoCardEvent } from "@/lib/org-events";
import type { OrgBadgeRow } from "@/lib/org-badges";
import { createClient } from "@/lib/supabase/client";

type BingoCell = {
  id: string;
  position: number;
  event_id: string | null;
  label: string | null;
};

type AwardRow = {
  id: string;
  earned_at: string;
  points_awarded: number;
  org_badges: { name: string } | null;
  students: { first_name: string; last_name: string; student_id: string } | null;
};

const DEFAULT_FORM = {
  title: "Semester Bingo",
  season: "2026",
  streakThreshold: 3,
  lineBadgeName: "Events Goer",
  linePoints: 50,
  streakBadgeName: "Event Streak",
  streakPoints: 30,
};

export function OrgBingoManager({ organizationId }: { organizationId: string }) {
  const { showLoader, hideLoader } = useLoader();
  const [cards, setCards] = useState<BingoCardRow[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cells, setCells] = useState<BingoCell[]>([]);
  const [badges, setBadges] = useState<OrgBadgeRow[]>([]);
  const [events, setEvents] = useState<BingoCardEvent[]>([]);
  const [awards, setAwards] = useState<AwardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(DEFAULT_FORM.title);
  const [season, setSeason] = useState(DEFAULT_FORM.season);
  const [streakThreshold, setStreakThreshold] = useState(DEFAULT_FORM.streakThreshold);
  const [lineBadgeName, setLineBadgeName] = useState(DEFAULT_FORM.lineBadgeName);
  const [linePoints, setLinePoints] = useState(DEFAULT_FORM.linePoints);
  const [streakBadgeName, setStreakBadgeName] = useState(DEFAULT_FORM.streakBadgeName);
  const [streakPoints, setStreakPoints] = useState(DEFAULT_FORM.streakPoints);

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId) ?? null,
    [cards, selectedCardId],
  );

  const isReadOnly = selectedCard?.status === "archived";

  function applyCardToForm(card: BingoCardRow) {
    setTitle(card.title);
    setSeason(card.season_label);
    setStreakThreshold(card.streak_threshold);
  }

  function resetFormDefaults() {
    setTitle(DEFAULT_FORM.title);
    setSeason(DEFAULT_FORM.season);
    setStreakThreshold(DEFAULT_FORM.streakThreshold);
    setLineBadgeName(DEFAULT_FORM.lineBadgeName);
    setLinePoints(DEFAULT_FORM.linePoints);
    setStreakBadgeName(DEFAULT_FORM.streakBadgeName);
    setStreakPoints(DEFAULT_FORM.streakPoints);
  }

  const loadCardDetails = useCallback(
    async (cardId: string) => {
      const supabase = createClient();
      const { data: cellRows } = await supabase
        .from("bingo_cells")
        .select("id, position, event_id, label")
        .eq("card_id", cardId)
        .order("position");
      setCells((cellRows as BingoCell[]) ?? []);

      const { data: awardRows } = await supabase
        .from("student_org_badges")
        .select(
          "id, earned_at, points_awarded, org_badges(name), students(first_name, last_name, student_id)",
        )
        .eq("bingo_card_id", cardId)
        .order("earned_at", { ascending: false })
        .limit(30);
      setAwards((awardRows as unknown as AwardRow[]) ?? []);
    },
    [],
  );

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data: cardRows, error: cardsError } = await supabase
      .from("bingo_cards")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (cardsError) {
      setError(cardsError.message);
      return;
    }

    const list = ((cardRows ?? []) as Record<string, unknown>[]).map(
      normalizeBingoCardRow,
    );
    setCards(list);

    const badgeSelect =
      "id, organization_id, name, slug, points, kind, description, status, created_at";
    let { data: badgeRows, error: badgeError } = await supabase
      .from("org_badges")
      .select(badgeSelect)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (
      badgeError &&
      (isMissingColumnError(badgeError.message, "status") ||
        isMissingColumnError(badgeError.message, "description"))
    ) {
      ({ data: badgeRows, error: badgeError } = await supabase
        .from("org_badges")
        .select("id, organization_id, name, slug, points, kind, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }));
    }

    if (badgeError) {
      setError(badgeError.message);
    }

    setBadges(
      ((badgeRows ?? []) as OrgBadgeRow[]).map((b) => ({
        ...b,
        description: b.description ?? null,
        status: b.status ?? "active",
      })),
    );

    try {
      const eventRows = await fetchBingoCardEvents(supabase);
      setEvents(eventRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events");
      setEvents([]);
    }

    setSelectedCardId((current) => {
      if (current && list.some((c) => c.id === current)) return current;
      return (
        list.find((c) => c.status === "active")?.id ??
        list.find((c) => c.status === "draft")?.id ??
        list[0]?.id ??
        null
      );
    });
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!selectedCard) {
      setCells([]);
      setAwards([]);
      return;
    }
    applyCardToForm(selectedCard);
    void loadCardDetails(selectedCard.id);
  }, [selectedCard, loadCardDetails]);

  async function upsertCardBadges(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    cardId: string,
  ) {
    const slugs = badgeSlugsForCard(cardId, season);

    const { data: lineBadge, error: lineErr } = await supabase
      .from("org_badges")
      .upsert(
        {
          organization_id: organizationId,
          slug: slugs.line,
          name: lineBadgeName,
          points: linePoints,
          kind: "bingo_line",
          created_by: userId,
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
          slug: slugs.streak,
          name: streakBadgeName,
          points: streakPoints,
          kind: "streak",
          created_by: userId,
        },
        { onConflict: "organization_id,slug" },
      )
      .select()
      .single();
    if (streakErr) throw streakErr;

    return { lineBadgeId: lineBadge.id as string, streakBadgeId: streakBadge.id as string };
  }

  async function createNewCard() {
    setError(null);
    if (!organizationId) {
      setError("No organization is linked to your account.");
      return;
    }
    showLoader("Creating bingo card…");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const newCard = await insertBingoCard(supabase, {
        organization_id: organizationId,
        title: DEFAULT_FORM.title,
        season_label: DEFAULT_FORM.season,
        streak_threshold: DEFAULT_FORM.streakThreshold,
        created_by: user.id,
      });

      await createBingoCardCells(supabase, newCard.id);
      setSelectedCardId(newCard.id);
      resetFormDefaults();
      await reload();
    } catch (err) {
      const message = getSupabaseErrorMessage(err);
      
      // Check for RLS permission errors
      if (message.toLowerCase().includes("row-level security") ||
          message.toLowerCase().includes("permission denied")) {
        setError(
          "Permission denied. Make sure:\n" +
          "• Your account is linked to this organization\n" +
          "• You have the correct role (org_member or admin)\n" +
          "• Contact your organization admin if the issue persists\n\n" +
          `Details: ${message}`
        );
      }
      // Check for schema/migration errors
      else if (message.toLowerCase().includes("column") ||
               message.toLowerCase().includes("schema cache")) {
        setError(
          "Database schema issue. This usually means:\n" +
          "• Database migrations haven't been fully applied\n" +
          "• The bingo_cards table is missing the status column\n" +
          "• Contact your administrator to run: migration 027_bingo_card_status.sql\n\n" +
          `Details: ${message}`
        );
      }
      // Display any troubleshooting tips from insertBingoCard
      else if (message.includes("Try these troubleshooting steps")) {
        setError(message);
      }
      else {
        setError(message || "Could not create card");
      }
    } finally {
      hideLoader();
    }
  }

  async function saveCard() {
    if (!selectedCard) return;
    setError(null);
    showLoader("Saving bingo card…");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { lineBadgeId, streakBadgeId } = await upsertCardBadges(
        supabase,
        user.id,
        selectedCard.id,
      );

      const { error: updErr } = await supabase
        .from("bingo_cards")
        .update({
          title: title.trim() || DEFAULT_FORM.title,
          season_label: season.trim() || DEFAULT_FORM.season,
          streak_threshold: streakThreshold,
          line_badge_id: lineBadgeId,
          streak_badge_id: streakBadgeId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCard.id);
      if (updErr) throw updErr;

      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      hideLoader();
    }
  }

  async function changeCardStatus(status: BingoCardStatus) {
    if (!selectedCard) return;
    setError(null);
    showLoader(
      status === "active"
        ? "Publishing card…"
        : status === "archived"
          ? "Archiving card…"
          : "Saving as draft…",
    );
    try {
      const supabase = createClient();
      if (!isReadOnly) {
        await saveCardInternals(supabase);
      }
      await setBingoCardStatus(supabase, organizationId, selectedCard.id, status);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      hideLoader();
    }
  }

  async function saveCardInternals(supabase: ReturnType<typeof createClient>) {
    if (!selectedCard) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");

    const { lineBadgeId, streakBadgeId } = await upsertCardBadges(
      supabase,
      user.id,
      selectedCard.id,
    );

    const { error: updErr } = await supabase
      .from("bingo_cards")
      .update({
        title: title.trim() || DEFAULT_FORM.title,
        season_label: season.trim() || DEFAULT_FORM.season,
        streak_threshold: streakThreshold,
        line_badge_id: lineBadgeId,
        streak_badge_id: streakBadgeId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedCard.id);
    if (updErr) throw updErr;
  }

  async function deleteCard() {
    if (!selectedCard) return;
    if (
      !confirm(
        `Delete "${selectedCard.title}"? This removes the card and its cell assignments. Student progress on this card will be kept but unlinked.`,
      )
    ) {
      return;
    }

    setError(null);
    showLoader("Deleting card…");
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("bingo_cards")
        .delete()
        .eq("id", selectedCard.id);
      if (delErr) throw delErr;
      setSelectedCardId(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete card");
    } finally {
      hideLoader();
    }
  }

  async function assignEvent(position: number, eventId: string) {
    if (!selectedCard || isReadOnly) return;
    setError(null);
    showLoader("Updating cell…");
    try {
      const event = events.find((e) => e.id === eventId);
      const supabase = createClient();
      const { error: updErr } = await supabase
        .from("bingo_cells")
        .update({ event_id: eventId || null, label: event?.title ?? null })
        .eq("card_id", selectedCard.id)
        .eq("position", position);
      if (updErr) throw updErr;
      await loadCardDetails(selectedCard.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign event");
    } finally {
      hideLoader();
    }
  }

  const cellByPos = (pos: number) => cells.find((c) => c.position === pos);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bingo &amp; Badges</h1>
          <p className="mt-1 text-sm text-slate-700">
            Create multiple 3×3 bingo cards. Publish one active card for students;
            keep drafts while building and archive past seasons.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void createNewCard()}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          + New card
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Your bingo cards</h2>
        {cards.length === 0 ? (
          <p className="text-sm text-slate-500">
            No bingo cards yet. Click &quot;New card&quot; to create your first draft.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {cards.map((c) => (
              <li
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                  selectedCardId === c.id ? "bg-teal-50/60" : "bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCardId(c.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="font-medium text-slate-900">{c.title}</span>
                  <span className="ml-2 text-xs text-slate-500">{c.season_label}</span>
                  <span
                    className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadgeClass(c.status)}`}
                  >
                    {statusLabel(c.status)}
                  </span>
                </button>
                <p className="text-xs text-slate-400">
                  Updated {new Date(c.updated_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedCard && (
        <>
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Card settings</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(selectedCard.status)}`}
              >
                {statusLabel(selectedCard.status)}
              </span>
            </div>

            {isReadOnly && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                This card is archived. Restore to draft to edit, or delete it.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isReadOnly}
                  className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
                />
              </label>
              <label className="text-sm">
                Season label
                <input
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  disabled={isReadOnly}
                  className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
                />
              </label>
              <label className="text-sm">
                Streak threshold
                <input
                  type="number"
                  min={2}
                  value={streakThreshold}
                  onChange={(e) => setStreakThreshold(Number(e.target.value))}
                  disabled={isReadOnly}
                  className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
                />
              </label>
              <label className="text-sm">
                Line badge name
                <input
                  value={lineBadgeName}
                  onChange={(e) => setLineBadgeName(e.target.value)}
                  disabled={isReadOnly}
                  className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
                />
              </label>
              <label className="text-sm">
                Line badge points
                <input
                  type="number"
                  min={0}
                  value={linePoints}
                  onChange={(e) => setLinePoints(Number(e.target.value))}
                  disabled={isReadOnly}
                  className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
                />
              </label>
              <label className="text-sm">
                Streak badge name
                <input
                  value={streakBadgeName}
                  onChange={(e) => setStreakBadgeName(e.target.value)}
                  disabled={isReadOnly}
                  className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
                />
              </label>
              <label className="text-sm">
                Streak badge points
                <input
                  type="number"
                  min={0}
                  value={streakPoints}
                  onChange={(e) => setStreakPoints(Number(e.target.value))}
                  disabled={isReadOnly}
                  className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => void saveCard()}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Update
                </button>
              )}
              {selectedCard.status !== "draft" && !isReadOnly && (
                <button
                  type="button"
                  onClick={() => void changeCardStatus("draft")}
                  className="rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-800 hover:bg-amber-50"
                >
                  Save as draft
                </button>
              )}
              {selectedCard.status !== "active" && !isReadOnly && (
                <button
                  type="button"
                  onClick={() => void changeCardStatus("active")}
                  className="rounded-lg border border-teal-300 px-4 py-2 text-sm text-teal-800 hover:bg-teal-50"
                >
                  Publish (activate)
                </button>
              )}
              {selectedCard.status !== "archived" && (
                <button
                  type="button"
                  onClick={() => void changeCardStatus("archived")}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Archive
                </button>
              )}
              {selectedCard.status === "archived" && (
                <button
                  type="button"
                  onClick={() => void changeCardStatus("draft")}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Restore to draft
                </button>
              )}
              <button
                type="button"
                onClick={() => void deleteCard()}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">3×3 event grid</h2>
            <p className="text-sm text-slate-600">
              Assign any campus event to each cell.
              {events.length === 0 && (
                <span className="mt-1 block text-amber-700">
                  No events found yet. Create events on the Events page.
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
                      disabled={isReadOnly}
                      onChange={(e) => void assignEvent(position, e.target.value)}
                      className="w-full rounded-lg border bg-white px-2 py-2 text-xs disabled:bg-slate-100"
                    >
                      <option value="">Unassigned</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                          {ev.status !== "published" ? ` (${ev.status})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Recent badge awards</h2>
            {awards.length === 0 ? (
              <p className="text-sm text-slate-500">No awards for this card yet.</p>
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
        </>
      )}

      <OrgBadgesPanel
        organizationId={organizationId}
        badges={badges}
        onChanged={reload}
      />
    </div>
  );
}
