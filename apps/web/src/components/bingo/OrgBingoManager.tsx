"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Award, CalendarDays, Plus, Sparkles, Trophy } from "lucide-react";
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
      "id, organization_id, name, slug, points, kind, description, earning_criteria, minimum_points, award_rule, image_url, status, created_at";
    let { data: badgeRows, error: badgeError } = await supabase
      .from("org_badges")
      .select(badgeSelect)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (
      badgeError &&
      (isMissingColumnError(badgeError.message, "status") ||
        isMissingColumnError(badgeError.message, "description") ||
        isMissingColumnError(badgeError.message, "earning_criteria") ||
        isMissingColumnError(badgeError.message, "minimum_points") ||
        isMissingColumnError(badgeError.message, "award_rule") ||
        isMissingColumnError(badgeError.message, "image_url"))
    ) {
      const fallbackResult = await supabase
        .from("org_badges")
        .select("id, organization_id, name, slug, points, kind, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      badgeRows = fallbackResult.data as typeof badgeRows;
      badgeError = fallbackResult.error;
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
    <div className="space-y-7">
      <header className="relative isolate overflow-hidden rounded-3xl bg-[var(--primary-strong)] p-6 text-white shadow-[var(--shadow-card)] sm:p-8">
        <div className="absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 right-1/4 -z-10 h-64 w-64 rounded-full bg-[var(--accent)]/10" />
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-white/65">PARTICIPATION &amp; RECOGNITION</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight !text-white sm:text-4xl">Bingo &amp; Badges</h1>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Build event challenges, publish cards for students, and celebrate every milestone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void createNewCard()}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[var(--primary-strong)] shadow-sm transition hover:bg-[var(--primary-soft)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New bingo card
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Bingo cards", value: cards.length, detail: "Across all seasons", icon: Sparkles },
          { label: "Published", value: cards.filter((card) => card.status === "active").length, detail: "Available to students", icon: CalendarDays },
          { label: "Badge designs", value: badges.length, detail: "Recognition options", icon: Award },
          { label: "Recent awards", value: awards.length, detail: selectedCard ? "For selected card" : "Latest activity", icon: Trophy },
        ].map(({ label, value, detail, icon: Icon }) => (
          <section key={label} className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--primary-strong)]">{value}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </section>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.65fr)]">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--primary)]">LIBRARY</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--primary-strong)]">Bingo cards</h2>
            </div>
            <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">{cards.length}</span>
          </div>
          {cards.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5 text-sm leading-6 text-[var(--muted)]">
              Your card library is empty. Create a card to start building a student challenge.
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {cards.map((card) => {
                const selected = selectedCardId === card.id;
                return (
                  <li key={card.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`w-full rounded-xl border p-3.5 text-left transition ${
                        selected
                          ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-sm"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[var(--primary-strong)]">{card.title}</span>
                          <span className="mt-1 block text-xs text-[var(--muted)]">{card.season_label}</span>
                        </span>
                        <ArrowUpRight className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-[var(--primary)]" : "text-[var(--muted)]"}`} aria-hidden="true" />
                      </span>
                      <span className="mt-3 flex items-center justify-between gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(card.status)}`}>
                          {statusLabel(card.status)}
                        </span>
                        <span className="text-[10px] text-[var(--muted)]">Updated {new Date(card.updated_at).toLocaleDateString()}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold text-[var(--primary-strong)]">A simple flow</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Assign events to a card, save your settings, then publish it for students.</p>
          </div>
        </section>

        {selectedCard ? (
          <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-5">
              <div>
                <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--primary)]">CARD SETTINGS</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--primary-strong)]">{selectedCard.title}</h2>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusBadgeClass(selectedCard.status)}`}>
                {statusLabel(selectedCard.status)}
              </span>
            </div>

            {isReadOnly && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                This card is archived. Restore it to draft before making changes.
              </p>
            )}

            <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[var(--muted)]">
                Card title
                <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isReadOnly} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal disabled:opacity-60" />
              </label>
              <label className="text-xs font-semibold text-[var(--muted)]">
                Season label
                <input value={season} onChange={(e) => setSeason(e.target.value)} disabled={isReadOnly} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal disabled:opacity-60" />
              </label>
              <label className="text-xs font-semibold text-[var(--muted)]">
                Events for a streak
                <input type="number" min={2} value={streakThreshold} onChange={(e) => setStreakThreshold(Number(e.target.value))} disabled={isReadOnly} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal disabled:opacity-60" />
              </label>
              <div className="hidden sm:block" />
              <label className="text-xs font-semibold text-[var(--muted)]">
                Line reward
                <input value={lineBadgeName} onChange={(e) => setLineBadgeName(e.target.value)} disabled={isReadOnly} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal disabled:opacity-60" />
              </label>
              <label className="text-xs font-semibold text-[var(--muted)]">
                Line reward points
                <input type="number" min={0} value={linePoints} onChange={(e) => setLinePoints(Number(e.target.value))} disabled={isReadOnly} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal disabled:opacity-60" />
              </label>
              <label className="text-xs font-semibold text-[var(--muted)]">
                Streak reward
                <input value={streakBadgeName} onChange={(e) => setStreakBadgeName(e.target.value)} disabled={isReadOnly} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal disabled:opacity-60" />
              </label>
              <label className="text-xs font-semibold text-[var(--muted)]">
                Streak reward points
                <input type="number" min={0} value={streakPoints} onChange={(e) => setStreakPoints(Number(e.target.value))} disabled={isReadOnly} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal disabled:opacity-60" />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--border)] pt-5">
              {!isReadOnly && (
                <button type="button" onClick={() => void saveCard()} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-strong)]">Save changes</button>
              )}
              {selectedCard.status !== "draft" && !isReadOnly && (
                <button type="button" onClick={() => void changeCardStatus("draft")} className="min-h-10 rounded-xl border border-amber-300 px-3 text-sm font-medium text-amber-800 hover:bg-amber-50">Save as draft</button>
              )}
              {selectedCard.status !== "active" && !isReadOnly && (
                <button type="button" onClick={() => void changeCardStatus("active")} className="min-h-10 rounded-xl border border-[var(--primary)]/40 px-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-soft)]">Publish for students</button>
              )}
              {selectedCard.status !== "archived" && (
                <button type="button" onClick={() => void changeCardStatus("archived")} className="min-h-10 rounded-xl border border-[var(--border)] px-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)]">Archive</button>
              )}
              {selectedCard.status === "archived" && (
                <button type="button" onClick={() => void changeCardStatus("draft")} className="min-h-10 rounded-xl border border-[var(--border)] px-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]">Restore to draft</button>
              )}
              <button type="button" onClick={() => void deleteCard()} className="min-h-10 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50">Delete card</button>
            </div>
          </section>
        ) : (
          <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]"><Sparkles className="h-6 w-6" aria-hidden="true" /></span>
              <h2 className="mt-4 text-lg font-semibold text-[var(--primary-strong)]">Start a new challenge</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Create a bingo card, add events to its squares, and set the rewards students can earn.</p>
            </div>
          </section>
        )}
      </div>

      {selectedCard && (
        <>
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--primary)]">CHALLENGE BUILDER</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--primary-strong)]">3×3 event grid</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Choose one campus event for each square.</p>
              </div>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--muted)]">{cells.filter((cell) => cell.event_id).length} of 9 assigned</span>
            </div>
            {events.length === 0 && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">No events found yet. Create events on the Events page.</p>
            )}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 9 }, (_, position) => {
                const cell = cellByPos(position);
                return (
                  <div key={position} className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">{position + 1}</span>
                      <span className="truncate text-xs font-semibold text-[var(--primary-strong)]">{cell?.label ?? "Choose an event"}</span>
                    </div>
                    <label className="sr-only" htmlFor={`bingo-cell-${position}`}>Event for square {position + 1}</label>
                    <select id={`bingo-cell-${position}`} value={cell?.event_id ?? ""} disabled={isReadOnly} onChange={(e) => void assignEvent(position, e.target.value)} className="w-full rounded-xl border bg-[var(--surface)] px-3 py-2.5 text-xs disabled:opacity-60">
                      <option value="">Unassigned</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>{event.title}{event.status !== "published" ? ` (${event.status})` : ""}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--primary)]">STUDENT MILESTONES</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--primary-strong)]">Recent badge awards</h2>
              </div>
              <Trophy className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            {awards.length === 0 ? (
              <p className="mt-4 rounded-xl bg-[var(--background)] px-4 py-5 text-sm text-[var(--muted)]">No awards for this card yet. Published cards and their rewards will show progress here.</p>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--border)]">
                {awards.map((award) => (
                  <li key={award.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <p className="min-w-0 text-sm text-[var(--foreground)]">
                      <span className="font-semibold">{award.students ? `${award.students.first_name} ${award.students.last_name}` : "Student"}</span>
                      {" earned "}
                      <span className="font-medium text-[var(--primary)]">{award.org_badges?.name}</span>
                    </p>
                    <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">+{award.points_awarded} pts</span>
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
