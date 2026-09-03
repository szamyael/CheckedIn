import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BarChart3, Radio, LineChart, Calendar } from "lucide-react";

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

  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#a46618]">Attendance intelligence</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#0c2238]">Faculty Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#697178]">
          Generate attendance reports, monitor live check-ins, and review
          analytics. Organizations create and manage events.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/reports"
          className="flex items-center gap-4 rounded-lg border border-[#e2e5e7] bg-white p-6 hover:border-[#17324d]"
        >
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold">Reports</p>
            <p className="text-sm text-slate-700">Attendance &amp; absentees</p>
          </div>
        </Link>

        <Link
          href="/dashboard/monitor"
          className="flex items-center gap-4 rounded-lg border border-[#e2e5e7] bg-white p-6 hover:border-[#17324d]"
        >
          <Radio className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold">Live Monitor</p>
            <p className="text-sm text-slate-700">Watch check-ins in real time</p>
          </div>
        </Link>

        <Link
          href="/dashboard/analytics"
          className="flex items-center gap-4 rounded-lg border border-[#e2e5e7] bg-white p-6 hover:border-[#17324d]"
        >
          <LineChart className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold">Analytics</p>
            <p className="text-sm text-slate-700">Trends and participation</p>
          </div>
        </Link>

        <Link
          href="/dashboard/events"
          className="flex items-center gap-4 rounded-lg border border-[#e2e5e7] bg-white p-6 hover:border-[#17324d]"
        >
          <Calendar className="h-8 w-8 text-slate-500" />
          <div>
            <p className="font-semibold">View Events</p>
            <p className="text-sm text-slate-700">
              {count ?? 0} published events (read-only)
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
