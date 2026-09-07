import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { DashboardPageHeader, DashboardSection, DashboardStat } from "@/components/DashboardUi";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (!profile || !["admin", "faculty"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const [
    { count: totalEvents },
    { count: totalAttendance },
    { count: totalStudents },
    { data: topEvents },
    { data: programStats },
    { data: yearStats },
    { data: orgStats },
  ] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("attendance_records").select("*", { count: "exact", head: true }).eq("status", "checked_in"),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("events").select("id, title, attendance_records(count)").eq("status", "published"),
    supabase.from("students").select("program, attendance_records(count)"),
    supabase.from("students").select("year_level, attendance_records(count)"),
    supabase.from("organizations").select("name, events(count)"),
  ]);

  const eventRankings = (topEvents ?? [])
    .map((e) => ({
      label: e.title as string,
      value: Array.isArray(e.attendance_records)
        ? (e.attendance_records[0] as { count: number })?.count ?? 0
        : (e.attendance_records as { count: number })?.count ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const programMap = new Map<string, number>();
  for (const row of programStats ?? []) {
    const program = row.program as string;
    const count = Array.isArray(row.attendance_records)
      ? (row.attendance_records[0] as { count: number })?.count ?? 0
      : (row.attendance_records as { count: number })?.count ?? 0;
    programMap.set(program, (programMap.get(program) ?? 0) + count);
  }

  const programRankings = [...programMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const yearMap = new Map<number, number>();
  for (const row of yearStats ?? []) {
    const year = row.year_level as number | null;
    if (year == null) continue;
    const count = Array.isArray(row.attendance_records)
      ? (row.attendance_records[0] as { count: number })?.count ?? 0
      : (row.attendance_records as { count: number })?.count ?? 0;
    yearMap.set(year, (yearMap.get(year) ?? 0) + count);
  }

  const yearLevelRankings = [...yearMap.entries()]
    .map(([year, value]) => ({ label: `Year ${year}`, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const orgRankings = (orgStats ?? [])
    .map((o) => ({
      name: o.name as string,
      count: Array.isArray(o.events)
        ? (o.events[0] as { count: number })?.count ?? 0
        : (o.events as { count: number })?.count ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      <DashboardPageHeader eyebrow="ATTENDANCE INTELLIGENCE" title="Analytics" description="Institution-wide attendance, participation, and organization performance." />

      <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        <DashboardStat label="Events" value={totalEvents ?? 0} detail="Events in the system" />
        <DashboardStat label="Check-ins" value={totalAttendance ?? 0} detail="Confirmed attendance records" />
        <DashboardStat label="Students" value={totalStudents ?? 0} detail="Registered student accounts" />
      </div>

      <AnalyticsCharts
        eventRankings={eventRankings}
        programRankings={programRankings}
        yearLevelRankings={yearLevelRankings}
      />

      <DashboardSection title="Organization activity" description="Event creation by organization.">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {orgRankings.length === 0 ? (
          <p className="text-sm text-slate-700">No organizations yet.</p>
        ) : (
          <ul className="space-y-2">
            {orgRankings.map((o) => (
              <li key={o.name} className="flex justify-between text-sm">
                <span>{o.name}</span>
                <span className="font-medium text-blue-600">{o.count} events</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      </DashboardSection>
    </div>
  );
}
