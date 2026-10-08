"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Home, LayoutGrid, QrCode, UserRound } from "lucide-react";
import { BrandMark } from "@/components/BrandLogo";
import { ThemePanelButton } from "@/components/ThemePanelButton";
import { NotificationPopup, type NotificationPopupItem } from "@/components/NotificationPopup";
import { NotificationSoundToggle } from "@/components/NotificationSoundToggle";

const LEFT_TABS = [
  { href: "/student", label: "Home", icon: Home, exact: true },
  { href: "/student/events", label: "Events", icon: CalendarDays, exact: false },
];
const RIGHT_TABS = [
  { href: "/student/bingo", label: "Bingo", icon: LayoutGrid, exact: false },
  { href: "/student/profile", label: "Profile", icon: UserRound, exact: false },
];

export function StudentShell({
  children,
  notificationCount = 0,
  notificationPopup = null,
  onDismissNotification = () => undefined,
  onSignOut,
}: {
  children: React.ReactNode;
  notificationCount?: number;
  onSignOut: () => void;
  notificationPopup?: NotificationPopupItem | null;
  onDismissNotification?: () => void;
}) {
  const pathname = usePathname();
  const tabs = [
    ...LEFT_TABS,
    { href: "/student/attendance/scan", label: "Scan", icon: QrCode, exact: false },
    ...RIGHT_TABS,
    { href: "/student/notifications", label: "Notifications", icon: Bell, exact: false },
  ];
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="student-portal flex min-h-dvh w-full overflow-x-hidden text-slate-900">
      <NotificationPopup
        item={notificationPopup}
        onDismiss={onDismissNotification}
        href="/student/notifications"
      />
      <aside className="student-sidebar sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r lg:flex">
        <div className="border-b px-6 py-6">
          <BrandMark size={42} />
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Student workspace
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Student navigation">
          {tabs.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
                {href === "/student/notifications" && notificationCount > 0 && (
                  <span className="ml-auto rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          Your campus, in sync.
        </div>
      </aside>

      <div className="student-main flex min-h-dvh min-w-0 flex-1 flex-col">
        <header         className="student-header sticky top-0 z-20 flex min-w-0 items-center justify-between border-b px-3 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="lg:hidden"><BrandMark size={36} /></span>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">CheckedIn</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--primary-strong)]">Student portal</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemePanelButton />
            <NotificationSoundToggle />
            <Link
              href="/student/notifications"
              className="relative grid h-11 w-11 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              aria-label="Notifications"
            >
              <Bell className="h-[22px] w-[22px]" />
              {notificationCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-11 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:px-4"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pb-10">
          {children}
        </main>

        <nav
          className="student-bottom-nav fixed inset-x-0 bottom-0 z-20 w-full border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
          aria-label="Student navigation"
        >
          <ul className="grid grid-cols-5">
            {tabs
              .filter(({ href }) => href !== "/student/notifications")
              .map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors ${
                        active ? "text-[var(--primary-strong)]" : "text-[#697178]"
                      }`}
                    >
                      <span className={`grid h-9 w-12 place-items-center rounded-2xl transition-colors ${href === "/student/attendance/scan" ? "bg-[var(--primary-strong)] text-white shadow-sm" : active ? "bg-[var(--primary-soft)]" : ""}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      {label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
