"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

interface EventOption {
  id: string;
  title: string;
  starts_at: string;
}

export function EventSelector({
  events,
  basePath = "/dashboard/reports",
}: {
  events: EventOption[];
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("event") ?? "";
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => events.filter((event) => event.title.toLowerCase().includes(query.toLowerCase())), [events, query]);

  return (
    <div className="min-w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm">
      <label className="flex items-center gap-2 border-b border-[var(--border)] px-2 pb-2 text-[var(--muted)]">
        <Search size={15} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events…" className="w-full border-0 bg-transparent p-1 text-sm outline-none" />
      </label>
      <select
      value={selected}
      aria-label="Select event"
      size={Math.min(6, Math.max(2, filtered.length + 1))}
      className="mt-2 w-full bg-transparent px-2 py-1 text-sm outline-none"
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
          params.set("event", e.target.value);
        } else {
          params.delete("event");
        }
        router.push(`${basePath}?${params.toString()}`);
      }}
    >
      <option value="">Select event…</option>
      {filtered.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.title} — {format(new Date(ev.starts_at), "MMM d, yyyy")}
        </option>
      ))}
      </select>
    </div>
  );
}
