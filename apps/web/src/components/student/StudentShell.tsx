"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Home, LayoutGrid, UserRound } from "lucide-react";
import { BrandMark } from "@/components/BrandLogo";

const TABS = [
  { href: "/student", label: "Home", icon: Home, exact: true },
  { href: "/student/events", label: "Events", icon: CalendarDays, exact: false },
  { href: "/student/bingo", label: "Bingo", icon: LayoutGrid, exact: false },
  { href: "/student/profile", label: "Profile", icon: UserRound, exact: false },
];

export function StudentShell({
  children,
  notificationCount = 0,
  onSignOut,
}: {
  children: React.ReactNode;
  notificationCount?: number;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 text-slate-900 shadow-xl">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <BrandMark size={36} />
        <div className="flex items-center gap-2">
          <Link
            href="/student/notifications"
            className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-[22px] w-[22px]" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur">
        <ul className="grid grid-cols-4">
          {TABS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-1 py-3 text-xs font-medium ${
                    active ? "text-teal-600" : "text-slate-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
