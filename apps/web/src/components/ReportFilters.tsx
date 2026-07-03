"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ReportFilters({ programs }: { programs: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const program = params.get("program") ?? "";
  const year = params.get("year") ?? "";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard/reports?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">Program</label>
        <select
          value={program}
          onChange={(e) => update("program", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">Year Level</label>
        <select
          value={year}
          onChange={(e) => update("year", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All years</option>
          {[1, 2, 3, 4, 5].map((y) => (
            <option key={y} value={String(y)}>Year {y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
