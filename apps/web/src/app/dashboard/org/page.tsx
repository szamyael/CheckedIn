import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, LayoutGrid } from "lucide-react";

export default async function OrgDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "org_member" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Organization Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-700">
          Create events (subject to admin approval) and manage Bingo badges for
          your students.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/events"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 hover:border-teal-200"
        >
          <Calendar className="h-8 w-8 text-teal-600" />
          <div>
            <p className="font-semibold">Manage Events</p>
            <p className="text-sm text-slate-700">
              Create calendar events with QR codes
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/org/bingo"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 hover:border-teal-200"
        >
          <LayoutGrid className="h-8 w-8 text-teal-600" />
          <div>
            <p className="font-semibold">Bingo &amp; Badges</p>
            <p className="text-sm text-slate-700">
              3×3 card, line &amp; streak rewards
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
