"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

export default function StudentBingoPage() {
  const [card, setCard] = useState<Card | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [awards, setAwards] = useState<OrgBadgeAward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cards } = await supabase
        .from("bingo_cards")
        .select("id, title, season_label, streak_threshold")
        .eq("status", "active")
        .limit(5);

      const active = (cards?.[0] as Card | undefined) ?? null;
      setCard(active);

      if (active) {
        const { data: cellRows } = await supabase
          .from("bingo_cells")
          .select("id, position, event_id, label, events(title, starts_at)")
          .eq("card_id", active.id)
          .order("position");
        setCells((cellRows as unknown as Cell[]) ?? []);

        const { data: done } = await supabase
          .from("student_bingo_cells")
          .select("cell_id")
          .eq("student_id", user.id);
        setCompleted(new Set((done ?? []).map((d) => d.cell_id as string)));

        const { data: badgeAwards } = await supabase
          .from("student_org_badges")
          .select("id, points_awarded, earned_at, org_badges(name, kind)")
          .eq("student_id", user.id)
          .order("earned_at", { ascending: false });
        setAwards((badgeAwards as unknown as OrgBadgeAward[]) ?? []);
      }

      setLoading(false);
    }
    void load();
  }, []);

  const completedPositions = useMemo(() => {
    const set = new Set<number>();
    for (const cell of cells) {
      if (completed.has(cell.id)) set.add(cell.position);
    }
    return set;
  }, [cells, completed]);

  const hasLine = LINES.some((line) =>
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
    return <p className="text-sm text-slate-500">Loading bingo…</p>;
  }

  if (!card) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        No active bingo card yet. Check back when an organization publishes one.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">{card.title}</h1>
        <p className="text-sm text-slate-500">
          Season {card.season_label} · Streak goal {card.streak_threshold}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center text-sm">
        <div className="rounded-2xl border bg-white p-3">
          <p className="text-lg font-bold text-teal-600">{streak}</p>
          <p className="text-xs text-slate-500">Event streak</p>
        </div>
        <div className="rounded-2xl border bg-white p-3">
          <p className="text-lg font-bold text-teal-600">
            {hasLine ? "Yes" : "No"}
          </p>
          <p className="text-xs text-slate-500">Line complete</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, position) => {
          const cell = cells.find((c) => c.position === position);
          const done = cell ? completed.has(cell.id) : false;
          return (
            <div
              key={position}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border p-2 text-center text-[11px] ${
                done
                  ? "border-teal-400 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <span className="font-semibold leading-tight">
                {cell?.events?.title ?? cell?.label ?? "Empty"}
              </span>
              {done && <span className="mt-1 text-teal-600">✓</span>}
            </div>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Your org badges</h2>
        {awards.length === 0 ? (
          <p className="text-sm text-slate-400">
            Complete a line or streak to earn badges.
          </p>
        ) : (
          <ul className="space-y-2">
            {awards.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {a.org_badges?.name ?? "Badge"}
                </span>
                <span className="text-teal-600"> +{a.points_awarded}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
