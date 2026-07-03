"use client";

import { useRouter, useSearchParams } from "next/navigation";

const MODES = [
  { value: "single", label: "Single event" },
  { value: "range", label: "Date range" },
  { value: "multi", label: "Multiple events" },
] as const;

export type ReportMode = (typeof MODES)[number]["value"];

export function ReportModeTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "single") as ReportMode;

  function setMode(next: ReportMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", next);
    params.delete("event");
    params.delete("events");
    params.delete("from");
    params.delete("to");
    router.push(`/dashboard/reports?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => setMode(m.value)}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            mode === m.value
              ? "bg-blue-600 text-white"
              : "border border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export function useReportMode(): ReportMode {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "single";
  if (mode === "range" || mode === "multi") return mode;
  return "single";
}
