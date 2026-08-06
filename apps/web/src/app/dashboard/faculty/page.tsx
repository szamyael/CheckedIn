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
        <h1 className="text-2xl font-bold text-slate-900">Faculty Dashboard</h1>
        <p className="mt-1 text-sm text-slate-700">
          Generate attendance reports, monitor live check-ins, and review
          analytics. Organizations create and manage events.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/reports"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-200"
        >
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold">Reports</p>
            <p className="text-sm text-slate-700">Attendance &amp; absentees</p>
          </div>
        </Link>

        <Link
          href="/dashboard/monitor"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-200"
        >
          <Radio className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold">Live Monitor</p>
            <p className="text-sm text-slate-700">Watch check-ins in real time</p>
          </div>
        </Link>

        <Link
          href="/dashboard/analytics"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-200"
        >
          <LineChart className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold">Analytics</p>
            <p className="text-sm text-slate-700">Trends and participation</p>
          </div>
        </Link>

        <Link
          href="/dashboard/events"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-200"
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
