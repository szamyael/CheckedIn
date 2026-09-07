import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SystemSettingsForm } from "@/components/SystemSettingsForm";
import { BroadcastNotificationForm } from "@/components/BroadcastNotificationForm";
import { AttendanceCorrectionPanel } from "@/components/AttendanceCorrectionPanel";
import { DashboardPageHeader, DashboardSection } from "@/components/DashboardUi";
export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, created_at, users(email)")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-8">
      <DashboardPageHeader eyebrow="SYSTEM CONTROL" title="System settings" description="Configure attendance policies, broadcasts, review queues, and the institutional audit trail." />

      <div className="grid gap-8 lg:grid-cols-2">
        <SystemSettingsForm />
        <BroadcastNotificationForm />
      </div>

      <DashboardSection title="Audit trail" description="Recent administrative actions across CheckedIn.">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-slate-600">
              <tr>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2 pr-4">Entity</th>
                <th className="py-2">User</th>
              </tr>
            </thead>
            <tbody>
              {(auditLogs ?? []).map((log) => {
                const userRow = Array.isArray(log.users) ? log.users[0] : log.users;
                return (
                  <tr key={log.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4">{log.action}</td>
                    <td className="py-2 pr-4">{log.entity_type ?? "—"}</td>
                    <td className="py-2">{userRow?.email ?? "—"}</td>
                  </tr>
                );
              })}
              {(auditLogs ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-600">No audit entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      </DashboardSection>

      <DashboardSection title="Attendance corrections" description="Review and approve staff correction requests.">
        <AttendanceCorrectionPanel isAdmin />
      </DashboardSection>
    </div>  );
}
