import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
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
    <div className="dashboard-workspace min-h-dvh bg-[var(--background)] text-[var(--foreground)] lg:flex">
      <aside className="dashboard-sidebar sticky top-0 z-40 flex w-full flex-col border-b border-white/10 bg-[var(--primary-strong)] text-white lg:h-dvh lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6 lg:block lg:px-5 lg:py-6">
          <BrandLogo variant="transparent" className="max-h-10 w-full max-w-36 brightness-0 invert lg:max-h-12 lg:max-w-[156px]" />
          <div className="flex items-center gap-2 text-xs text-white/75 lg:mt-5">
            <span className="hidden h-7 w-7 place-items-center rounded-lg border border-white/15 bg-white/10 lg:grid">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            </span>
            <span className="capitalize">{role.replace("_", " ")} workspace</span>
          </div>
        </div>

        <DashboardNav items={nav} />

        <div className="hidden border-t border-white/10 p-4 lg:block">
          <p className="mb-2 px-2 text-[10px] font-semibold tracking-[0.12em] text-white/50">SIGNED IN AS</p>
          <p className="truncate px-2 text-xs text-slate-300">
            {profile?.email ?? user.email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-3 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardRealtimeSync />
        <SessionTimeoutGuard />
        <header className="dashboard-topbar flex min-h-[68px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 lg:sticky lg:top-0 lg:z-30 lg:min-h-[73px] lg:px-10">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted)]">CHECKEDIN</p>
            <p className="mt-0.5 text-sm font-semibold capitalize text-[var(--primary-strong)]">
              {role.replace("_", " ")} · Campus operations
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <form action={signOut} className="lg:hidden">
              <button
                type="submit"
                aria-label="Sign out"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] sm:px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
            <ThemePanelButton />
            <NotificationBell />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 xl:p-10">{children}</main>
      </div>
    </div>
  );
}
