import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventApprovalPanel } from "@/components/EventApprovalPanel";
import { CreateOrganizationForm } from "@/components/CreateOrganizationForm";
import { CreateStaffForm } from "@/components/CreateStaffForm";
import { StaffActions } from "@/components/StaffActions";
import { StudentActions } from "@/components/StudentActions";
import { PendingStudentsBatchActions } from "@/components/PendingStudentsBatchActions";
import { StudentAchievementsPanel } from "@/components/StudentAchievementsPanel";
import { AdminBingoOverview } from "@/components/bingo/AdminBingoOverview";
import { OrganizationProgramAlignmentPanel } from "@/components/OrganizationProgramAlignmentPanel";
import { formatStudentDisplayName } from "@/lib/student/display-name";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  const { data: organizationPrograms } = await supabase
    .from("organization_programs")
    .select("id, organization_id, program, organizations(name)")
    .order("organization_id")
    .order("program");

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id, first_name, last_name, users(email, role, status), organizations(name)")
    .order("created_at", { ascending: false });

  const { data: students } = await supabase
    .from("students")
    .select("id, student_id, first_name, middle_name, last_name, name_extension, program, year_level, users(status)")
    .order("created_at", { ascending: false });

  const pendingStudents = (students ?? []).filter((s) => {
    const userRow = Array.isArray(s.users) ? s.users[0] : s.users;
    return userRow?.status === "pending";
  });
  const pendingCount = pendingStudents.length;
  const pendingIds = pendingStudents.map((s) => s.id);
  const allPrograms = [...new Set((students ?? []).map((s) => s.program.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );

  const { data: achievements } = await supabase
    .from("student_achievements")
    .select(
      "id, badge_name, badge_type, earned_at, students(student_id, first_name, last_name, program), events(title)",
    )
    .order("earned_at", { ascending: false })
    .limit(50);

  const { data: allEvents } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="mt-1 text-sm text-slate-700">
          Manage organizations, staff, and student accounts.
        </p>
      </div>

      <EventApprovalPanel events={allEvents ?? []} />

      <AdminBingoOverview />

      <OrganizationProgramAlignmentPanel
        organizations={organizations ?? []}
        existingMappings={organizationPrograms ?? []}
        allPrograms={allPrograms}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <CreateOrganizationForm />
        <CreateStaffForm organizations={organizations ?? []} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Staff Accounts</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(staff ?? []).map((s) => {
                const userRow = Array.isArray(s.users) ? s.users[0] : s.users;
                return (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-3 text-slate-700">{userRow?.email ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{userRow?.role?.replace("_", " ") ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{userRow?.status ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StaffActions
                        staff={{
                          id: s.id,
                          first_name: s.first_name,
                          last_name: s.last_name,
                          status: userRow?.status ?? "active",
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Student Accounts
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              {pendingCount} pending approval
            </span>
          )}
        </h2>
        <PendingStudentsBatchActions pendingIds={pendingIds} />
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Student ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(students ?? []).map((s) => {
                const userRow = Array.isArray(s.users) ? s.users[0] : s.users;
                return (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs">{s.student_id}</td>
                    <td className="px-4 py-3">
                      {formatStudentDisplayName({
                        first_name: s.first_name,
                        middle_name: s.middle_name,
                        last_name: s.last_name,
                        name_extension: s.name_extension,
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{s.program}</td>
                    <td className="px-4 py-3">{s.year_level ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">
                      <span
                        className={
                          userRow?.status === "pending"
                            ? "font-medium text-amber-600"
                            : undefined
                        }
                      >
                        {userRow?.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StudentActions
                        student={{
                          id: s.id,
                          student_id: s.student_id,
                          first_name: s.first_name,
                          last_name: s.last_name,
                          program: s.program,
                          year_level: s.year_level,
                          status: userRow?.status ?? "active",
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
              {(students ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-700">
                    No students registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentAchievementsPanel achievements={achievements ?? []} />
    </div>
  );
}
