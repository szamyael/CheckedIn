import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LogOut,
  Calendar,
  Users,
  BarChart3,
  Radio,
  LineChart,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { DashboardNav, type DashboardNavItem } from "@/components/DashboardNav";
import { DashboardRealtimeSync } from "@/components/DashboardRealtimeSync";
import { SessionTimeoutGuard } from "@/components/SessionTimeoutGuard";
import { BrandLogo } from "@/components/BrandLogo";
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
          { href: "/dashboard/admin", label: "Users", icon: "users" as const },
          { href: "/dashboard/settings", label: "Settings", icon: "settings" as const },
        ]
      : []),
    ...(role === "org_member"
      ? [{ href: "/dashboard/org", label: "Org Home", icon: "users" as const }]
      : []),
    ...(role === "faculty"
      ? [{ href: "/dashboard/faculty", label: "Faculty Home", icon: "users" as const }]
      : []),
  ] satisfies DashboardNavItem[];

  return (
    <div className="flex min-h-screen bg-[#f6f7f5]">
      <aside className="flex w-60 flex-col border-r border-[#28445d] bg-[#0c2238]">
        <div className="border-b border-[#28445d] px-4 py-5">
          <BrandLogo variant="transparent" className="max-h-16 w-full brightness-0 invert" />
          <p className="mt-2 text-center text-xs capitalize text-slate-300">
            {role}
          </p>
        </div>

        <DashboardNav items={nav} />

        <div className="border-t border-[#28445d] p-3">
          <p className="truncate px-3 text-xs text-slate-400">
            {profile?.email ?? user.email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-[#17324d] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-auto">
        <DashboardRealtimeSync />
        <SessionTimeoutGuard />
        <header className="flex items-center justify-end border-b border-[#e2e5e7] bg-white px-8 py-3">
          <NotificationBell />
        </header>
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
