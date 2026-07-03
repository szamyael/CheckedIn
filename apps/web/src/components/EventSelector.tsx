"use client";

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

  return (
    <select
      value={selected}
      className="min-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
      {events.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.title} — {format(new Date(ev.starts_at), "MMM d, yyyy")}
        </option>
      ))}
    </select>
  );
}
