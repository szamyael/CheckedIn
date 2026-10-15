"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { filterMembershipReport } from "@/lib/org-membership";

type StudentMembership = {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  year_level: number | null;
  section: string | null;
  status: string;
  paid_at: string | null;
};

export function OrganizationMembershipPanel({ students }: { students: StudentMembership[] }) {
  const router = useRouter();
  const run = useAsyncAction();
  const [section, setSection] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const filtered = useMemo(
    () => filterMembershipReport(students, { section, yearLevel }),
    [students, section, yearLevel],
  );
  const targetIds = filtered.map((student) => student.id);

  async function update(action: "activate" | "disable", selectedIds = targetIds) {
    if (selectedIds.length === 0) return;
    const label = action === "activate" ? "activate paid student accounts" : "disable student accounts";
    if (!window.confirm(`Are you sure you want to ${label} for ${selectedIds.length} student${selectedIds.length === 1 ? "" : "s"}?`)) return;
    setError(null);
    try {
      const response = await run("Updating membership accounts…", () =>
        fetch("/api/org/memberships", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, studentIds: selectedIds }),
        }),
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Membership update failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Membership update failed.");
    }
  }

  function downloadReport() {
    const header = ["Student ID", "Name", "Program/Course", "Year Level", "Section", "Paid", "Account Status"];
    const rows = filtered.map((student) => [
      student.student_id,
      `${student.first_name} ${student.last_name}`,
      student.program,
      student.year_level ?? "",
      student.section ?? "",
      student.paid_at ? "Yes" : "No",
      student.status,
    ]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "organization-membership-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const sections = [...new Set(students.map((student) => student.section).filter((value): value is string => Boolean(value)))].sort();
  const years = [...new Set(students.map((student) => student.year_level).filter((year): year is number => year != null))].sort((a, b) => a - b);

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-semibold text-[var(--primary-strong)]">Membership</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Activate paid students and disable mapped student accounts. Students outside your mapped programs are excluded.</p>
        </div>
        <button type="button" onClick={downloadReport} className="border border-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-soft)]">Generate paid report</button>
      </div>
      <div className="flex flex-wrap gap-3">
        <select aria-label="Filter by section" value={section} onChange={(event) => setSection(event.target.value)} className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <option value="">All sections</option>
          {sections.map((value) => <option key={value} value={value ?? ""}>{value}</option>)}
        </select>
        <select aria-label="Filter by year level" value={yearLevel} onChange={(event) => setYearLevel(event.target.value)} className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <option value="">All year levels</option>
          {years.map((value) => <option key={value} value={value}>Year {value}</option>)}
        </select>
        <button type="button" onClick={() => void update("activate")} className="bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Activate all paid ({filtered.filter((student) => student.paid_at).length})</button>
        <button type="button" onClick={() => void update("disable")} className="bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800">Disable all ({filtered.length})</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)]"><tr>{["Student", "Program/Course", "Year", "Section", "Paid", "Account", "Action"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
          <tbody>
            {filtered.map((student) => <tr key={student.id} className="border-b border-[var(--border)] last:border-0"><td className="px-4 py-3"><p className="font-medium">{student.first_name} {student.last_name}</p><p className="text-xs text-[var(--muted)]">{student.student_id}</p></td><td className="px-4 py-3">{student.program}</td><td className="px-4 py-3">{student.year_level ?? "—"}</td><td className="px-4 py-3">{student.section ?? "—"}</td><td className="px-4 py-3">{student.paid_at ? <span className="font-semibold text-teal-700">Paid</span> : <span className="text-[var(--muted)]">Unpaid</span>}</td><td className="px-4 py-3 capitalize">{student.status.replace("_", " ")}</td><td className="px-4 py-3"><div className="flex gap-2 whitespace-nowrap"><button type="button" disabled={!student.paid_at || student.status === "active"} onClick={() => void update("activate", [student.id])} className="text-xs font-semibold text-teal-700 hover:underline disabled:text-slate-400">Activate</button><button type="button" disabled={student.status === "disabled"} onClick={() => void update("disable", [student.id])} className="text-xs font-semibold text-red-700 hover:underline disabled:text-slate-400">Disable</button></div></td></tr>)}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">No mapped students match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
