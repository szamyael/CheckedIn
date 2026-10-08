"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { DashboardSearchInput } from "@/components/DashboardSearchInput";

interface EventOption {
  id: string;
  title: string;
  starts_at: string;
}

export function ReportMultiEventSelect({ events }: { events: EventOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = new Set(
    (searchParams.get("events") ?? "").split(",").filter(Boolean),
  );
  const [query, setQuery] = useState("");
  const filteredEvents = useMemo(() => events.filter((event) => event.title.toLowerCase().includes(query.toLowerCase())), [events, query]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    const params = new URLSearchParams(searchParams.toString());
    const value = [...next].join(",");
    if (value) {
      params.set("events", value);
    } else {
      params.delete("events");
    }
    router.push(`/dashboard/reports?${params.toString()}`);
  }

  return (
    <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <DashboardSearchInput label="Search events" value={query} onChange={setQuery} placeholder="Search events…" />
      {events.length === 0 && (
        <p className="text-sm text-slate-700">No events available.</p>
      )}
      {filteredEvents.map((ev) => (
        <label
          key={ev.id}
          className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
        >
          <input
            type="checkbox"
            checked={selected.has(ev.id)}
            onChange={() => toggle(ev.id)}
            className="mt-1"
          />
          <span className="text-sm">
            <span className="font-medium">{ev.title}</span>
            <span className="text-slate-700">
              {" "}
              — {format(new Date(ev.starts_at), "MMM d, yyyy")}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}
