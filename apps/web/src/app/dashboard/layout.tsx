import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogOut, Calendar, Users, BarChart3, Radio, LineChart, Settings } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
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

  const role = profile?.role as UserRole;

  const nav = [
    { href: "/dashboard/events", label: "Events", icon: Calendar },
    ...(role === "admin" || role === "faculty" || role === "org_member"
      ? [{ href: "/dashboard/monitor", label: "Live Monitor", icon: Radio }]
      : []),
    ...(role === "admin" || role === "faculty" || role === "org_member"
      ? [{ href: "/dashboard/reports", label: "Reports", icon: BarChart3 }]
      : []),
    ...(role === "admin" || role === "faculty"
      ? [{ href: "/dashboard/analytics", label: "Analytics", icon: LineChart }]
      : []),
    ...(role === "admin"
      ? [
          { href: "/dashboard/admin", label: "Users", icon: Users },
          { href: "/dashboard/settings", label: "Settings", icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <BrandLogo variant="transparent" className="max-h-16 w-full" />
          <p className="mt-2 text-center text-xs capitalize text-slate-700">{role}</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <p className="truncate px-3 text-xs text-slate-600">
            {profile?.email ?? user.email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-auto">
        <SessionTimeoutGuard />
        <header className="flex items-center justify-end border-b border-slate-200 bg-white px-8 py-3">
          <NotificationBell />
        </header>
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
