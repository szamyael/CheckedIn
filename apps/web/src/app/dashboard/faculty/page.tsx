import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, BarChart3 } from "lucide-react";

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
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Faculty Dashboard</h1>
        <p className="mt-1 text-sm text-slate-700">
          Manage events and generate attendance reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/events"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-200"
        >
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold">Events</p>
            <p className="text-sm text-slate-700">{count ?? 0} total events</p>
          </div>
        </Link>

        <Link
          href="/dashboard/reports"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-200"
        >
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold">Reports</p>
            <p className="text-sm text-slate-700">View attendance records</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
