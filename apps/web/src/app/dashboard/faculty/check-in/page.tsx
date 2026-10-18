import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/DashboardUi";
import { CampusPassAttendanceScanner } from "@/components/CampusPassAttendanceScanner";
import { createClient } from "@/lib/supabase/server";

export default async function FacultyCheckInPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (profileError) throw profileError;
  if (!profile || profile.status !== "active" || (profile.role !== "faculty" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  const now = new Date().toISOString();
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, venue_name, attendance_starts_at, attendance_ends_at, allowed_year_levels")
    .eq("status", "published")
    .lte("attendance_starts_at", now)
    .gt("attendance_ends_at", now)
    .order("attendance_starts_at", { ascending: true });
  if (eventsError) throw eventsError;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="ATTENDANCE"
        title="Student check-in"
        description="Scan student campus passes to check students in; scan a pass again to check the student out."
      />
      <CampusPassAttendanceScanner events={events ?? []} />
    </div>
  );
}
