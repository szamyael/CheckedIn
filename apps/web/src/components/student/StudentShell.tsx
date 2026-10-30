"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Bell, CalendarDays, Home, LayoutGrid, QrCode, UserRound } from "@/lib/icons";
import { BrandLogo, BrandMark } from "@/components/BrandLogo";
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

const subscribeToDocumentBody = () => () => undefined;
const getDocumentBody = () => document.body;
const getServerDocumentBody = () => null;

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
  const portalTarget = useSyncExternalStore(
    subscribeToDocumentBody,
    getDocumentBody,
    getServerDocumentBody,
  );
  const tabs = [
    ...LEFT_TABS,
    { href: "/student/attendance/scan", label: "Scan", icon: QrCode, exact: false },
    ...RIGHT_TABS,
    { href: "/student/notifications", label: "Notifications", icon: Bell, exact: false },
  ];
  const notificationLabel = notificationCount > 99 ? "99+" : notificationCount;
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="student-portal flex min-h-dvh w-full overflow-x-clip text-[var(--foreground)]">
        <a className="skip-to-content" href="#student-content">Skip to content</a>
        <NotificationPopup
          item={notificationPopup}
          onDismiss={onDismissNotification}
          href="/student/notifications"
        />
        <aside className="student-sidebar sticky top-0 hidden h-dvh w-[17rem] shrink-0 flex-col border-r lg:flex">
          <div className="border-b px-7 py-7">
            <BrandLogo className="h-10 w-auto max-w-[190px]" priority />
            <p className="mt-7 text-xl font-semibold tracking-tight text-[var(--text-strong)]">
              Student portal
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Attendance, events, and your profile.
            </p>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6" aria-label="Student navigation">
            {tabs.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`student-nav-link relative flex min-h-12 items-center gap-3 px-3 text-sm font-medium ${
                    active
                      ? "text-[var(--primary-strong)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.6} aria-hidden="true" />
                  {label}
                  {href === "/student/notifications" && notificationCount > 0 && (
                    <span className="student-notification-count ml-auto">
                      {notificationLabel}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-[var(--border)] px-7 py-5 text-xs text-[var(--muted)]">
            CheckedIn <span className="mx-1 text-[var(--accent)]">/</span> Campus life, recorded.
          </div>
        </aside>

        <div className="student-main flex min-h-dvh min-w-0 flex-1 flex-col">
          <header className="student-header sticky top-0 z-20 flex min-w-0 items-center justify-between border-b px-3 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="lg:hidden"><BrandMark size={36} /></span>
              <div className="hidden sm:block">
                <p className="text-lg font-semibold leading-none tracking-tight text-[var(--primary-strong)]">CheckedIn</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">Student portal</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <ThemePanelButton />
              <NotificationSoundToggle />
              <Link
                href="/student/notifications"
                className="student-notification-link relative grid h-11 w-11 place-items-center text-[var(--muted)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : "Notifications"}
              >
                <Bell className="h-[22px] w-[22px]" />
                {notificationCount > 0 && (
                  <span className="student-notification-count student-notification-count--header absolute right-1 top-1">
                    {notificationLabel}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className="min-h-11 px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:px-4"
              >
                Sign out
              </button>
            </div>
          </header>

          <main id="student-content" tabIndex={-1} className="min-w-0 flex-1 overflow-x-hidden px-4 pb-24 pt-6 sm:px-8 sm:pt-9 lg:px-12 lg:pb-12">
            {children}
          </main>

        </div>
      </div>
      {portalTarget && createPortal(
        <nav
          className="student-bottom-nav fixed inset-x-0 bottom-0 z-20 w-full border-t backdrop-blur lg:hidden"
          aria-label="Student navigation"
        >
          <ul className="grid grid-cols-5 gap-1 px-2 py-2">
            {tabs
              .filter(({ href }) => href !== "/student/notifications")
              .map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`student-bottom-nav-item flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                        href === "/student/attendance/scan" ? "student-bottom-nav-item--scan" : ""
                      } ${active ? "text-[var(--primary-strong)]" : "text-[var(--muted)]"}`}
                    >
                      <span className={`student-bottom-nav-icon grid h-8 w-10 place-items-center transition-colors ${active && href !== "/student/attendance/scan" ? "text-[var(--accent)]" : ""}`}>
                        <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2 : 1.6} aria-hidden="true" />
                      </span>
                      <span className="student-bottom-nav-label">{label}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>,
        portalTarget,
      )}
    </>
  );
}
