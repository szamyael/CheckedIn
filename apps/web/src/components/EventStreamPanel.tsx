"use client";

import { useMemo, useState } from "react";
import { Radio, Search } from "lucide-react";
import type { Event } from "@/lib/types";
import { EventSecurityControls } from "@/components/EventSecurityControls";

/** A staff-friendly display surface for the currently selected event. */
export function EventStreamPanel({ events }: { events: Event[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? "");
  const visible = useMemo(() => events.filter((event) => event.title.toLowerCase().includes(query.toLowerCase())), [events, query]);
  const selected = events.find((event) => event.id === selectedId) ?? visible[0];

  if (!events.length) return null;
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><Radio size={20} /></span><div><h2 className="font-semibold">Event stream</h2><p className="mt-1 text-sm text-[var(--muted)]">Choose an event to display its live QR code and attendance OTP.</p></div></div>
      <label className="mt-4 flex max-w-lg items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--muted)]"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search an event…" className="w-full border-0 bg-transparent text-sm outline-none" /></label>
      <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
        {visible.map((event) => <button key={event.id} type="button" onClick={() => setSelectedId(event.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selected?.id === event.id ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"}`}>{event.title}</button>)}
      </div>
      {selected ? <EventSecurityControls event={selected} /> : <p className="mt-4 text-sm text-[var(--muted)]">No events match that search.</p>}
    </section>
  );
}
