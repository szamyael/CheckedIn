"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

interface EventOption { id: string; title: string; starts_at: string; }

export function EventSelector({ events, basePath = "/dashboard/reports" }: { events: EventOption[]; basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("event") ?? "";
  const [query, setQuery] = useState("");
  const carousel = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? events.filter((event) => event.title.toLowerCase().includes(term)) : events;
  }, [events, query]);

  const chooseEvent = (eventId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (eventId) params.set("event", eventId); else params.delete("event");
    const suffix = params.toString();
    router.push(suffix ? `${basePath}?${suffix}` : basePath);
  };
  const moveCarousel = (direction: number) => carousel.current?.scrollBy({ left: direction * 300, behavior: "smooth" });

  return <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
    <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 text-slate-500 ring-1 ring-inset ring-slate-200 focus-within:bg-white focus-within:ring-blue-400">
        <Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events…" className="w-full border-0 bg-transparent py-2.5 text-sm text-slate-900 outline-none" />
      </label>
      <div className="flex items-center gap-2"><span className="text-xs font-medium text-slate-500">{filtered.length} event{filtered.length === 1 ? "" : "s"}</span><button type="button" onClick={() => moveCarousel(-1)} aria-label="Previous events" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"><ChevronLeft size={17} /></button><button type="button" onClick={() => moveCarousel(1)} aria-label="Next events" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"><ChevronRight size={17} /></button></div>
    </div>
    {filtered.length === 0 ? <div className="px-5 py-12 text-center"><CalendarDays className="mx-auto text-slate-300" size={26} /><p className="mt-3 text-sm font-medium text-slate-700">No matching events</p><p className="mt-1 text-xs text-slate-500">Try another event title.</p></div> : <div ref={carousel} role="listbox" aria-label="Select event" className="flex snap-x gap-3 overflow-x-auto p-4 [scrollbar-width:thin]">
      {filtered.map((event) => {
        const isSelected = event.id === selected;
        return <button key={event.id} role="option" aria-selected={isSelected} type="button" onClick={() => chooseEvent(event.id)} className={`w-60 shrink-0 snap-start rounded-xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${isSelected ? "border-blue-600 bg-blue-600 text-white shadow-md" : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isSelected ? "bg-white/15 text-white" : "bg-blue-50 text-blue-600"}`}><CalendarDays size={18} /></span>{isSelected && <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold tracking-wide">SELECTED</span>}</div><p className="mt-5 line-clamp-2 min-h-10 text-sm font-semibold leading-5">{event.title}</p><p className={`mt-2 text-xs ${isSelected ? "text-blue-100" : "text-slate-500"}`}>{format(new Date(event.starts_at), "EEE, MMM d · h:mm a")}</p></button>;
      })}
    </div>}
    {selected && <div className="border-t border-[var(--border)] px-4 py-3"><button type="button" onClick={() => chooseEvent("")} className="text-xs font-semibold text-slate-500 transition hover:text-slate-900">Clear selected event</button></div>}
  </div>;
}
