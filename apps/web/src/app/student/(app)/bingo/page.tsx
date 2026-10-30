"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Check, Sparkles } from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";
import { studentInputClass } from "@/components/student/StudentUi";
import { UserErrorDialog } from "@/components/UserErrorDialog";

type Cell = {
  id: string;
  position: number;
  event_id: string | null;
  label: string | null;
  events: { title: string; starts_at: string } | null;
};

type Card = {
  id: string;
  title: string;
  season_label: string;
  streak_threshold: number;
};

type OrgBadgeAward = {
  id: string;
  points_awarded: number;
  earned_at: string;
  org_badges: { name: string; kind: string } | null;
};

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const SELECTED_CARD_KEY = "checkedin.bingo.selectedCardId";

export default function StudentBingoPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [awards, setAwards] = useState<OrgBadgeAward[]>([]);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [awardsError, setAwardsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const card = useMemo(
    () => cards.find((item) => item.id === selectedId) ?? null,
    [cards, selectedId],
  );

  useEffect(() => {
    async function loadCards() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cardRows } = await supabase
        .from("bingo_cards")
        .select("id, title, season_label, streak_threshold")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      const list = (cardRows as Card[] | null) ?? [];
      setCards(list);

      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(SELECTED_CARD_KEY)
          : null;
      const nextId =
        (stored && list.some((item) => item.id === stored) ? stored : null) ??
        list[0]?.id ??
        null;
      setSelectedId(nextId);
      setLoading(false);
    }
    void loadCards();
  }, []);

  useEffect(() => {
    async function loadBoard() {
      if (!selectedId) {
        setCells([]);
        setCompleted(new Set());
        setAwards([]);
        setBoardError(null);
        setAwardsError(null);
        return;
      }

      setBoardError(null);
      setAwardsError(null);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cellRows, error: cellError } = await supabase
        .from("bingo_cells")
        .select("id, position, event_id, label, events(title, starts_at)")
        .eq("card_id", selectedId)
        .order("position");
      if (cellError) {
        setCells([]);
        setCompleted(new Set());
        setBoardError(`Unable to load Bingo card: ${cellError.message}`);
        return;
      }
      const nextCells = (cellRows as unknown as Cell[]) ?? [];
      setCells(nextCells);

      const eventIds = [...new Set(
        nextCells.flatMap((cell) => cell.event_id ? [cell.event_id] : []),
      )];
      const attendedEventIds = new Set<string>();
      if (eventIds.length > 0) {
        const { data: attendanceRows, error: attendanceError } = await supabase
          .from("attendance_records")
          .select("event_id")
          .eq("student_id", user.id)
          .in("event_id", eventIds)
          .in("status", ["checked_in", "late", "on_break", "checked_out"]);
        if (attendanceError) {
          setCompleted(new Set());
          setBoardError(`Unable to load attendance progress: ${attendanceError.message}`);
          return;
        }
        for (const row of attendanceRows ?? []) {
          attendedEventIds.add(row.event_id as string);
        }
      }
      setCompleted(new Set(
        nextCells
          .filter((cell) => cell.event_id && attendedEventIds.has(cell.event_id))
          .map((cell) => cell.id),
      ));

      const { data: badgeAwards, error: awardsError } = await supabase
        .from("student_org_badges")
        .select("id, points_awarded, earned_at, org_badges(name, kind)")
        .eq("student_id", user.id)
        .eq("bingo_card_id", selectedId)
        .order("earned_at", { ascending: false });
      if (awardsError) {
        setAwardsError(awardsError.message);
        return;
      }
      setAwards((badgeAwards as unknown as OrgBadgeAward[]) ?? []);
    }
    void loadBoard();
  }, [selectedId]);

  function selectCard(cardId: string) {
    setSelectedId(cardId);
    window.localStorage.setItem(SELECTED_CARD_KEY, cardId);
  }

  const completedPositions = useMemo(() => {
    const set = new Set<number>();
    for (const cell of cells) {
      if (completed.has(cell.id)) set.add(cell.position);
    }
    return set;
  }, [cells, completed]);

  const completedLines = LINES.filter((line) =>
    line.every((p) => completedPositions.has(p)),
  );

  const streak = useMemo(() => {
    const ordered = [...cells]
      .filter((c) => c.event_id)
      .sort((a, b) => {
        const ta = a.events?.starts_at
          ? new Date(a.events.starts_at).getTime()
          : 0;
        const tb = b.events?.starts_at
          ? new Date(b.events.starts_at).getTime()
          : 0;
        return ta - tb;
      });
    let best = 0;
    let run = 0;
    for (const c of ordered) {
      if (completed.has(c.id)) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    return best;
  }, [cells, completed]);

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading your Bingo cards…</p>;
  }

  if (!card) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
        No published bingo cards yet. Check back when an organization publishes one.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-l-2 border-[var(--accent)] pl-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)]">EVENT BINGO</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--primary-strong)]">{card.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {completed.size} / {cells.length || 9} completed · {card.season_label}
        </p>
      </header>

      {cards.length > 1 && (
        <label className="block text-sm font-medium text-[var(--primary-strong)]">
          Choose a bingo card
          <select
            className={`${studentInputClass} mt-2`}
            value={card.id}
            onChange={(event) => selectCard(event.target.value)}
          >
            {cards.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
                {item.season_label ? ` · ${item.season_label}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {boardError ? (
        <UserErrorDialog message={boardError} />
      ) : (
        <>
          <div className="grid grid-cols-2 border border-[var(--border)] bg-[var(--surface)] text-center">
            <div className="border-r border-[var(--border)] p-4">
              <p className="text-2xl font-semibold text-[var(--primary-strong)]">{streak}</p>
              <p className="mt-1 text-xs font-medium text-[var(--muted)]">Event streak</p>
            </div>
            <div className="p-4">
              <p className="text-2xl font-semibold text-[var(--warning)]">{completedLines.length}</p>
              <p className="mt-1 text-xs font-medium text-[var(--muted)]">Lines completed</p>
            </div>
          </div>

          <div className="relative aspect-square border border-[var(--border)] bg-[var(--surface-muted)] p-1.5">
            <div className="grid h-full grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }, (_, position) => {
                const cell = cells.find((c) => c.position === position);
                const done = cell ? completed.has(cell.id) : false;
                const onCompletedLine = completedLines.some((line) =>
                  line.includes(position),
                );
                return (
                  <div
                    key={position}
                    className={`flex flex-col items-center justify-center border p-2 text-center text-[11px] ${
                      done
                        ? `border-[color-mix(in_srgb,var(--warning)_38%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_14%,var(--surface))] text-[var(--warning)] ${onCompletedLine ? "ring-1 ring-inset ring-[var(--warning)]" : ""}`
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                    }`}
                  >
                    <span className="text-[10px] font-semibold leading-tight sm:text-xs">
                      {cell?.events?.title ?? cell?.label ?? "Empty"}
                    </span>
                    {done && <span className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--action-background)] text-[var(--action-foreground)]"><Check size={14} /></span>}
                  </div>
                );
              })}
            </div>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 3 3"
              preserveAspectRatio="none"
            >
              {completedLines.map((line) => {
                const start = line[0];
                const end = line[2];
                return (
                  <line
                    key={line.join("-")}
                    x1={(start % 3) + 0.5}
                    y1={Math.floor(start / 3) + 0.5}
                    x2={(end % 3) + 0.5}
                    y2={Math.floor(end / 3) + 0.5}
                    stroke="var(--warning)"
                    strokeLinecap="round"
                    strokeWidth="0.07"
                  />
                );
              })}
            </svg>
          </div>
        </>
      )}

      <section className="border-t border-[var(--border)] pt-6">
        <div className="mb-3 flex items-center gap-2"><Award size={18} className="text-[var(--warning)]" /><h2 className="text-base font-semibold text-[var(--primary-strong)]">Recognition earned</h2></div>
        {awards.length === 0 ? (
          awardsError ? (
            <UserErrorDialog message={`Unable to load Bingo recognition: ${awardsError}`} />
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Complete a line or streak on this card to earn badges.
            </p>
          )
        ) : (
          <ul className="space-y-2">
            {awards.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-[var(--foreground)]"><Sparkles size={16} className="text-[var(--warning)]" />{a.org_badges?.name ?? "Badge"}</span>
                <span className="font-semibold text-[var(--warning)]">+{a.points_awarded}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
