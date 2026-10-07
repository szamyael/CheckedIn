"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { studentInputClass } from "@/components/student/StudentUi";

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
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cellRows } = await supabase
        .from("bingo_cells")
        .select("id, position, event_id, label, events(title, starts_at)")
        .eq("card_id", selectedId)
        .order("position");
      const nextCells = (cellRows as unknown as Cell[]) ?? [];
      setCells(nextCells);

      const cellIds = nextCells.map((cell) => cell.id);
      if (cellIds.length > 0) {
        const { data: done } = await supabase
          .from("student_bingo_cells")
          .select("cell_id")
          .eq("student_id", user.id)
          .in("cell_id", cellIds);
        setCompleted(new Set((done ?? []).map((d) => d.cell_id as string)));
      } else {
        setCompleted(new Set());
      }

      const { data: badgeAwards } = await supabase
        .from("student_org_badges")
        .select("id, points_awarded, earned_at, org_badges(name, kind)")
        .eq("student_id", user.id)
        .eq("bingo_card_id", selectedId)
        .order("earned_at", { ascending: false });
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
    return <p className="text-sm text-[#697178]">Loading your Bingo cards…</p>;
  }

  if (!card) {
    return (
      <div className="border border-dashed border-[#cbd2d4] bg-white p-10 text-center text-sm text-[#697178]">
        No published bingo cards yet. Check back when an organization publishes one.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-l-2 border-[#c18a2e] pl-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-[#697178]">EVENT BINGO</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0c2238]">{card.title}</h1>
        <p className="mt-2 text-sm text-[#697178]">
          {completed.size} / {cells.length || 9} completed · {card.season_label}
        </p>
      </header>

      {cards.length > 1 && (
        <label className="block text-sm font-medium text-[#0c2238]">
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

      <div className="grid grid-cols-2 border border-[#e2e5e7] bg-white text-center">
        <div className="border-r border-[#e2e5e7] p-4">
          <p className="text-2xl font-semibold text-[#17324d]">{streak}</p>
          <p className="mt-1 text-xs font-medium text-[#697178]">Event streak</p>
        </div>
        <div className="p-4">
          <p className="text-2xl font-semibold text-[#a46618]">{hasLine ? "1" : "0"}</p>
          <p className="mt-1 text-xs font-medium text-[#697178]">Lines completed</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 border border-[#17324d] bg-[#17324d] p-1.5">
        {Array.from({ length: 9 }, (_, position) => {
          const cell = cells.find((c) => c.position === position);
          const done = cell ? completed.has(cell.id) : false;
          return (
            <div
              key={position}
              className={`flex aspect-square flex-col items-center justify-center border p-2 text-center text-[11px] ${
                done
                  ? "border-[#d9c38d] bg-[#fff6df] text-[#7c5311]"
                  : "border-[#e2e5e7] bg-white text-[#3f484f]"
              }`}
            >
              <span className="text-[10px] font-semibold leading-tight sm:text-xs">
                {cell?.events?.title ?? cell?.label ?? "Empty"}
              </span>
              {done && <span className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#c18a2e] text-white"><Check size={14} /></span>}
            </div>
          );
        })}
      </div>

      <section className="border-t border-[#e2e5e7] pt-6">
        <div className="mb-3 flex items-center gap-2"><Award size={18} className="text-[#a46618]" /><h2 className="text-base font-semibold text-[#0c2238]">Recognition earned</h2></div>
        {awards.length === 0 ? (
          <p className="text-sm text-[#697178]">
            Complete a line or streak on this card to earn badges.
          </p>
        ) : (
          <ul className="space-y-2">
            {awards.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between border border-[#e2e5e7] bg-white px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-[#0c2238]"><Sparkles size={16} className="text-[#c18a2e]" />{a.org_badges?.name ?? "Badge"}</span>
                <span className="font-semibold text-[#a46618]">+{a.points_awarded}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
