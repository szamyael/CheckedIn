import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { DashboardNav, type DashboardNavItem } from "@/components/DashboardNav";
import { DashboardRealtimeSync } from "@/components/DashboardRealtimeSync";
import { SessionTimeoutGuard } from "@/components/SessionTimeoutGuard";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemePanelButton } from "@/components/ThemePanelButton";
import type { UserRole } from "@/lib/types";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (!profile?.role) redirect("/login");

  const role = profile.role as UserRole;

  const nav = [
    {
      href: role === "admin" ? "/dashboard/admin" : role === "faculty" ? "/dashboard/faculty" : "/dashboard/org",
      label: "Overview",
      icon: "users" as const,
    },
    ...(role === "org_member" || role === "admin" || role === "faculty"
      ? [
          {
            href: "/dashboard/events",
            label: role === "faculty" ? "Events (view)" : "Events",
            icon: "calendar" as const,
          },
        ]
      : []),
    ...(role === "org_member" || role === "admin"
      ? [
          {
            href: "/dashboard/org/bingo",
            label: "Bingo & Badges",
            icon: "bingo" as const,
          },
        ]
      : []),
    ...(role === "admin" || role === "faculty" || role === "org_member"
      ? [{ href: "/dashboard/monitor", label: "Live Monitor", icon: "monitor" as const }]
      : []),
    ...(role === "admin" || role === "faculty" || role === "org_member"
      ? [{ href: "/dashboard/reports", label: "Reports", icon: "reports" as const }]
      : []),
    ...(role === "admin" || role === "faculty"
      ? [{ href: "/dashboard/analytics", label: "Analytics", icon: "analytics" as const }]
      : []),
    ...(role === "admin"
      ? [
          { href: "/dashboard/settings", label: "Settings", icon: "settings" as const },
        ]
      : []),
  ] satisfies DashboardNavItem[];

  return (
    <div className="dashboard-workspace flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[#28445d] bg-[#0c2238]">
        <div className="border-b border-[#28445d] px-5 py-6">
          <BrandLogo variant="transparent" className="max-h-12 w-full max-w-[156px] brightness-0 invert" />
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-300">
            <span className="grid h-6 w-6 place-items-center border border-[#527086] bg-[#17324d]"><LayoutDashboard className="h-3.5 w-3.5" /></span>
            <span className="capitalize">{role.replace("_", " ")} workspace</span>
          </div>
        </div>

        <DashboardNav items={nav} />

        <div className="border-t border-[#28445d] p-4">
          <p className="mb-2 px-2 text-[10px] font-semibold tracking-[0.12em] text-slate-500">SIGNED IN AS</p>
          <p className="truncate px-2 text-xs text-slate-300">
            {profile?.email ?? user.email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-3 flex min-h-10 w-full items-center gap-3 border-l-2 border-transparent px-2 text-sm text-slate-300 hover:border-[#c18a2e] hover:bg-[#17324d] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-auto">
        <DashboardRealtimeSync />
        <SessionTimeoutGuard />
        <header className="flex min-h-[73px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 lg:px-10">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted)]">CHECKEDIN</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--primary-strong)]">Campus operations</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemePanelButton />
            <NotificationBell />
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1440px] flex-1 p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
