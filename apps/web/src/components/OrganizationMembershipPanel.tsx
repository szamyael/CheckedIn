"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, Search } from "@/lib/icons";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { filterMembershipReport } from "@/lib/org-membership";
import { ExportReportButtons } from "@/components/ExportReportButtons";

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

export function OrganizationMembershipPanel({
  students,
  loadError,
}: {
  students: StudentMembership[];
  loadError?: string | null;
}) {
  const router = useRouter();
  const run = useAsyncAction();
  const [section, setSection] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [paidStatus, setPaidStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const filtered = useMemo(
    () => filterMembershipReport(students, { section, yearLevel, search, paidStatus }),
    [students, section, yearLevel, search, paidStatus],
  );
  async function update(action: "mark_paid" | "mark_unpaid" | "activate" | "disable", selectedIds: string[]) {
    if (selectedIds.length === 0 || pending) return;
    const label = action === "mark_paid"
      ? "record this walk-in payment and activate the student account"
      : action === "mark_unpaid"
        ? "mark this student unpaid and disable the account"
        : action === "activate"
          ? "activate paid student accounts"
          : "disable student accounts";
    if (selectedIds.length > 1 || (action !== "mark_paid" && action !== "mark_unpaid")) {
      const confirmation = selectedIds.length === 1
        ? `Are you sure you want to ${label}?`
        : `Are you sure you want to ${action === "mark_unpaid" ? "mark all filtered students unpaid" : label} for ${selectedIds.length} students?`;
      if (!window.confirm(confirmation)) return;
    }
    setError(null);
    setPending(true);
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
      if (!result.updated) throw new Error("No eligible student accounts were updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Membership update failed.");
    } finally {
      setPending(false);
    }
  }

  const exportHeaders = ["Student ID", "Name", "Program/Course", "Year Level", "Section", "Paid", "Account Status"];
  const exportRows = filtered.map((student) => ({
    student_id: student.student_id,
    first_name: student.first_name,
    last_name: student.last_name,
    program: student.program,
    year_level: student.year_level,
    section: student.section,
    checked_in_at: "",
    distance_from_venue_m: null,
  }));
  const exportMatrix = filtered.map((student) => [
      student.student_id,
      `${student.first_name} ${student.last_name}`,
      student.program,
      String(student.year_level ?? ""),
      student.section ?? "",
      student.paid_at ? "Yes" : "No",
      student.status,
    ]);

  const sections = [...new Set(students.map((student) => student.section).filter((value): value is string => Boolean(value)))].sort();
  const years = [...new Set(students.map((student) => student.year_level).filter((year): year is number => year != null))].sort((a, b) => a - b);
  const paidIds = filtered.filter((student) => student.paid_at).map((student) => student.id);
  const unpaidIds = filtered.filter((student) => !student.paid_at).map((student) => student.id);

  return (
    <section className="dashboard-membership-panel dashboard-section space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--primary)]">STUDENT ACCESS</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--primary-strong)]">Membership</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Record walk-in payments for mapped students. Marking a student paid activates their account; marking them unpaid disables it.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs font-semibold text-[var(--muted)]">Export membership report</p>
          <ExportReportButtons
            rows={exportRows}
            customHeaders={exportHeaders}
            customRows={exportMatrix}
            reportTitle="Organization Membership Report"
            sheetName="Membership"
            baseFilename="organization-membership-report"
            compact
            exportLabel="Export membership report"
          />
        </div>
      </div>
      <div className="dashboard-membership-toolbar flex flex-wrap gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
        <label className="flex min-h-10 min-w-56 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
          <Search className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
          <input
            aria-label="Search students"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, student ID, or program"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <select aria-label="Filter by section" value={section} onChange={(event) => setSection(event.target.value)} className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <option value="">All sections</option>
          {sections.map((value) => <option key={value} value={value ?? ""}>{value}</option>)}
        </select>
        <select aria-label="Filter by year level" value={yearLevel} onChange={(event) => setYearLevel(event.target.value)} className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <option value="">All year levels</option>
          {years.map((value) => <option key={value} value={value}>Year {value}</option>)}
        </select>
        <select aria-label="Filter by payment status" value={paidStatus} onChange={(event) => setPaidStatus(event.target.value as "all" | "paid" | "unpaid")} className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <option value="all">All payment statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <button type="button" disabled={pending || unpaidIds.length === 0} onClick={() => void update("mark_paid", unpaidIds)} aria-label={`Mark all as paid (${unpaidIds.length})`} title="Mark all as paid" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-green-600 px-3 text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"><CircleCheck size={20} aria-hidden="true" /></button>
        <button type="button" disabled={pending || paidIds.length === 0} onClick={() => void update("mark_unpaid", paidIds)} aria-label={`Mark all as unpaid (${paidIds.length})`} title="Mark all as unpaid" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-600 px-3 text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"><CircleX size={20} aria-hidden="true" /></button>
      </div>
      {loadError && <p role="alert" className="text-sm text-red-700">{loadError}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="table-scroll overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)]"><tr>{["Student", "Program/Course", "Year", "Section", "Paid", "Account"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{student.first_name} {student.last_name}</p>
                  <p className="text-xs text-[var(--muted)]">{student.student_id}</p>
                </td>
                <td className="px-4 py-3">{student.program}</td>
                <td className="px-4 py-3">{student.year_level ?? "—"}</td>
                <td className="px-4 py-3">{student.section ?? "—"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void update(student.paid_at ? "mark_unpaid" : "mark_paid", [student.id])}
                    className={`inline-flex items-center justify-center rounded-full p-1.5 disabled:cursor-wait disabled:opacity-50 ${student.paid_at ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}`}
                    aria-label={`${student.paid_at ? "Paid; mark unpaid" : "Unpaid; mark paid"} for ${student.first_name} ${student.last_name}`}
                    title={`${student.paid_at ? "Paid; mark unpaid" : "Unpaid; mark paid"}`}
                  >
                    {student.paid_at ? <CircleCheck size={18} aria-hidden="true" /> : <CircleX size={18} aria-hidden="true" />}
                  </button>
                </td>
                <td className="px-4 py-3 capitalize">{student.status.replace("_", " ")}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">No mapped students match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
