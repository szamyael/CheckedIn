import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { format, endOfDay, parseISO, startOfDay } from "date-fns";
import { EventSelector } from "@/components/EventSelector";
import { ExportReportButtons } from "@/components/ExportReportButtons";
import { ReportFilters } from "@/components/ReportFilters";
import { ReportModeTabs } from "@/components/ReportModeTabs";
import { ReportDateRangeFilter } from "@/components/ReportDateRangeFilter";
import { ReportMultiEventSelect } from "@/components/ReportMultiEventSelect";
import { AbsenteeReport } from "@/components/AbsenteeReport";
import { AttendanceCorrectionPanel } from "@/components/AttendanceCorrectionPanel";import type { ExportRow } from "@/lib/export-report";
import { DashboardPageHeader, DashboardSection } from "@/components/DashboardUi";

type AttendanceRow = {
  id: string;
  checked_in_at: string;
  break_out_at: string | null;
  break_in_at: string | null;
  checked_out_at: string | null;
  distance_from_venue_m: number | null;
  selfie_url: string | null;
  selfie_signed_url: string | null;
  event_id: string;
  event_title: string;
  students: {
    student_id: string;
    first_name: string;
    last_name: string;
    program: string;
    year_level: number | null;
    section: string | null;
  };
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    event?: string;
    events?: string;
    from?: string;
    to?: string;
    program?: string;
    year?: string;
    section?: string;
  }>;
}) {
  const params = await searchParams;
  const mode = params.mode ?? "single";
  const { event: eventId, events: eventsParam, from, to, program, year, section } =
    params;

  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .order("starts_at", { ascending: false });

  let targetEventIds: string[] = [];
  let reportTitle = "Attendance Report";

  if (mode === "single" && eventId) {
    targetEventIds = [eventId];
    reportTitle = events?.find((e) => e.id === eventId)?.title ?? reportTitle;
  } else if (mode === "multi" && eventsParam) {
    targetEventIds = eventsParam.split(",").filter(Boolean);
    reportTitle = `${targetEventIds.length} events`;
  } else if (mode === "range" && from && to) {
    const fromDate = startOfDay(parseISO(from));
    const toDate = endOfDay(parseISO(to));
    targetEventIds = (events ?? [])
      .filter((e) => {
        const starts = new Date(e.starts_at);
        return starts >= fromDate && starts <= toDate;
      })
      .map((e) => e.id);
    reportTitle = `${format(fromDate, "MMM d, yyyy")} – ${format(toDate, "MMM d, yyyy")}`;
  }

  const includeEvent = mode !== "single";
  let attendance: AttendanceRow[] = [];
  const programs = new Set<string>();
  const years = new Set<number>();
  const sections = new Set<string>();

  if (targetEventIds.length > 0) {
    const eventTitleById = new Map(
      (events ?? []).map((e) => [e.id, e.title] as const),
    );

    const { data } = await supabase
      .from("attendance_records")
      .select(
        "id, event_id, status, checked_in_at, break_out_at, break_in_at, checked_out_at, distance_from_venue_m, selfie_url, students(student_id, first_name, last_name, program, year_level, section)",
      )
      .in("event_id", targetEventIds)
      .in("status", ["checked_in", "late", "excused", "on_break", "checked_out"])
      .order("checked_in_at", { ascending: true });

    attendance = await Promise.all(
      (data ?? []).map(async (row) => {
        const student = Array.isArray(row.students)
          ? row.students[0]
          : row.students;
        const s = student as AttendanceRow["students"];

        programs.add(s.program);
        if (s.year_level != null) years.add(s.year_level);
        if (s.section) sections.add(s.section);

        let selfieSignedUrl: string | null = null;
        if (row.selfie_url) {
          const { data: signed } = await supabase.storage
            .from("selfies")
            .createSignedUrl(row.selfie_url as string, 3600);
          selfieSignedUrl = signed?.signedUrl ?? null;
        }

        const eid = row.event_id as string;
        return {
          id: row.id as string,
          event_id: eid,
          event_title: eventTitleById.get(eid) ?? "—",
          checked_in_at: row.checked_in_at as string,
          break_out_at: row.break_out_at as string | null,
          break_in_at: row.break_in_at as string | null,
          checked_out_at: row.checked_out_at as string | null,
          distance_from_venue_m: row.distance_from_venue_m as number | null,
          selfie_url: row.selfie_url as string | null,
          selfie_signed_url: selfieSignedUrl,
          students: s,
        };
      }),
    );

    if (program) {
      attendance = attendance.filter((r) => r.students.program === program);
    }
    if (year) {
      attendance = attendance.filter(
        (r) => String(r.students.year_level) === year,
      );
    }
    if (section) {
      attendance = attendance.filter((r) => r.students.section === section);
    }
  }

  const exportRows: ExportRow[] = attendance.map((r) => ({
    student_id: r.students.student_id,
    first_name: r.students.first_name,
    last_name: r.students.last_name,
    program: r.students.program,
    year_level: r.students.year_level,
    section: r.students.section,
    checked_in_at: r.checked_in_at,
    break_out_at: r.break_out_at,
    break_in_at: r.break_in_at,
    checked_out_at: r.checked_out_at,
    distance_from_venue_m: r.distance_from_venue_m,
    event_title: includeEvent ? r.event_title : undefined,
  }));

  const hasReport = targetEventIds.length > 0;

  return (
    <div className="space-y-8">
      <DashboardPageHeader eyebrow="REPORTING" title="Attendance reports" description="Review attendance by event, date range, program, and year level. Export only when the report is ready." />

      <Suspense fallback={<div className="h-9 w-80 animate-pulse rounded-lg bg-slate-200" />}>
        <ReportModeTabs />
      </Suspense>

      {mode === "single" && (
        <div>
          <label className="mb-1 block text-sm font-medium">Event</label>
          <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />}>
            <EventSelector events={events ?? []} />
          </Suspense>
        </div>
      )}

      {mode === "range" && (
        <Suspense fallback={null}>
          <ReportDateRangeFilter />
        </Suspense>
      )}

      {mode === "multi" && (
        <div>
          <label className="mb-2 block text-sm font-medium">Events</label>
          <Suspense fallback={null}>
            <ReportMultiEventSelect events={events ?? []} />
          </Suspense>
        </div>
      )}

      {hasReport && (
        <>
          <Suspense fallback={null}>
            <ReportFilters
              programs={[...programs].sort()}
              years={[...years].sort((a, b) => a - b)}
              sections={[...sections].sort()}
            />
          </Suspense>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {attendance.length} attendee{attendance.length !== 1 ? "s" : ""}
              {includeEvent && targetEventIds.length > 1 && (
                <span className="text-slate-700">
                  {" "}
                  across {targetEventIds.length} events
                </span>
              )}
            </p>
            <ExportReportButtons
              rows={exportRows}
              baseFilename={`attendance-${mode}`}
              eventTitle={reportTitle}
              includeEvent={includeEvent}
            />
          </div>
        </>
      )}

      {hasReport && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                {includeEvent && (
                  <th className="px-4 py-3 font-medium">Event</th>
                )}
                <th className="px-4 py-3 font-medium">Student ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Section</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium">Checked In</th>
                <th className="px-4 py-3 font-medium">Break Out</th>
                <th className="px-4 py-3 font-medium">Break In</th>
                <th className="px-4 py-3 font-medium">Checked Out</th>
                <th className="px-4 py-3 font-medium">Distance (m)</th>
                <th className="px-4 py-3 font-medium">Selfie</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  {includeEvent && (
                    <td className="px-4 py-3 text-slate-600">{row.event_title}</td>
                  )}
                  <td className="px-4 py-3 font-mono text-xs">{row.students.student_id}</td>
                  <td className="px-4 py-3">
                    {row.students.first_name} {row.students.last_name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.students.program}</td>
                  <td className="px-4 py-3">{row.students.year_level ?? "—"}</td>
                  <td className="px-4 py-3">{row.students.section ?? "—"}</td>
                  <td className="px-4 py-3">
                    {format(new Date(row.checked_in_at), "MMM d, yyyy h:mm:ss a")}
                  </td>
                  <td className="px-4 py-3">{row.break_out_at ? format(new Date(row.break_out_at), "MMM d, h:mm:ss a") : "—"}</td>
                  <td className="px-4 py-3">{row.break_in_at ? format(new Date(row.break_in_at), "MMM d, h:mm:ss a") : "—"}</td>
                  <td className="px-4 py-3">{row.checked_out_at ? format(new Date(row.checked_out_at), "MMM d, h:mm:ss a") : "—"}</td>
                  <td className="px-4 py-3">
                    {row.distance_from_venue_m?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.selfie_signed_url ? (
                      <a
                        href={row.selfie_signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td
                    colSpan={includeEvent ? 12 : 11}
                    className="px-4 py-6 text-center text-slate-700"
                  >
                    No attendance records for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mode === "single" && eventId && (
        <AbsenteeReport eventId={eventId} />
      )}

      <DashboardSection title="Correction requests" description="Review submitted attendance corrections.">
        <AttendanceCorrectionPanel isAdmin={false} />
      </DashboardSection>
    </div>
  );
}
