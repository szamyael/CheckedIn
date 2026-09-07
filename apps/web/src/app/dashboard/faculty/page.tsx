import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BarChart3, Calendar, ClipboardCheck, LineChart, Radio } from "lucide-react";
import { DashboardPageHeader, DashboardSection, DashboardStat } from "@/components/DashboardUi";
import { format } from "date-fns";

export default async function FacultyDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "faculty" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const now = new Date().toISOString();
  const [{ count: publishedCount }, { count: activeCount }, { count: attendanceCount }, { data: upcomingEvents }] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published").gte("ends_at", now),
    supabase.from("attendance_records").select("*", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("id, title, venue_name, starts_at, ends_at, status")
      .eq("status", "published")
      .gte("ends_at", now)
      .order("starts_at", { ascending: true })
      .limit(4),
  ]);

  return (
    <div className="space-y-8">
      <DashboardPageHeader eyebrow="ATTENDANCE INTELLIGENCE" title="Faculty overview" description="Review event activity, monitor attendance in real time, and turn participation data into clear reports." />

      <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        <DashboardStat label="Published events" value={publishedCount ?? 0} detail="Available for attendance review" />
        <DashboardStat label="Upcoming events" value={activeCount ?? 0} detail="Still open or scheduled" />
        <DashboardStat label="Attendance records" value={attendanceCount ?? 0} detail="Visible across published events" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/reports"
          className="group flex items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--primary)]"
        >
          <BarChart3 className="h-7 w-7 text-[var(--primary)]" />
          <div>
            <p className="font-semibold">Reports</p>
            <p className="text-sm text-slate-700">Attendance &amp; absentees</p>
          </div>
        </Link>

        <Link
          href="/dashboard/monitor"
          className="group flex items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--primary)]"
        >
          <Radio className="h-7 w-7 text-[var(--primary)]" />
          <div>
            <p className="font-semibold">Live Monitor</p>
            <p className="text-sm text-slate-700">Watch check-ins in real time</p>
          </div>
        </Link>

        <Link
          href="/dashboard/analytics"
          className="group flex items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--primary)]"
        >
          <LineChart className="h-7 w-7 text-[var(--primary)]" />
          <div>
            <p className="font-semibold">Analytics</p>
            <p className="text-sm text-slate-700">Trends and participation</p>
          </div>
        </Link>

        <Link
          href="/dashboard/events"
          className="group flex items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--primary)]"
        >
          <Calendar className="h-7 w-7 text-[var(--primary)]" />
          <div>
            <p className="font-semibold">View Events</p>
            <p className="text-sm text-slate-700">
              {publishedCount ?? 0} published events (read-only)
            </p>
          </div>
        </Link>
      </div>

      <DashboardSection title="Upcoming attendance windows" description="Start with Live Monitor when an event is actively checking students in.">
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {(upcomingEvents ?? []).map((event) => (
            <div key={event.id} className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[var(--primary-strong)]">{event.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{event.venue_name} &middot; {format(new Date(event.starts_at), "EEE, MMM d · h:mm a")}</p>
              </div>
              <Link href={`/dashboard/monitor?event=${event.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 border border-[var(--primary)] px-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-soft)]">
                <Radio className="h-4 w-4" /> Monitor
              </Link>
            </div>
          ))}
          {(upcomingEvents ?? []).length === 0 && (
            <div className="px-5 py-8 text-sm text-[var(--muted)]">No upcoming published events are available to review.</div>
          )}
        </div>
      </DashboardSection>

      <DashboardSection title="Faculty workflow" description="Use these tools in the order attendance happens.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { href: "/dashboard/events", label: "Review schedule", description: "See published event windows.", icon: Calendar },
            { href: "/dashboard/monitor", label: "Watch live attendance", description: "Review check-ins, breaks, and checkout.", icon: Radio },
            { href: "/dashboard/reports", label: "Close the loop", description: "Review records and export a report.", icon: ClipboardCheck },
          ].map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href} className="border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--primary)]">
              <Icon className="h-5 w-5 text-[var(--primary)]" />
              <p className="mt-4 font-semibold text-[var(--primary-strong)]">{label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
            </Link>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
