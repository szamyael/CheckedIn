"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Radio,
  QrCode,
  Settings,
  Users,
  LayoutGrid,
  UserRound,
} from "@/lib/icons";

const icons = {
  calendar: Calendar,
  users: Users,
  monitor: Radio,
  qrCode: QrCode,
  reports: BarChart3,
  analytics: LineChart,
  settings: Settings,
  bingo: LayoutGrid,
  profile: UserRound,
} as const;

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: keyof typeof icons;
}

export function DashboardNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <nav ref={navRef} data-collapsed={collapsed} className="dashboard-nav min-h-0 flex-1 overflow-x-auto px-2 py-2 lg:overflow-x-hidden lg:overflow-y-auto lg:px-3 lg:py-5" aria-label="Dashboard navigation">
      <div className="mb-3 hidden items-center justify-between px-3 lg:flex">
        <p className="dashboard-nav-label text-[10px] font-semibold tracking-[0.12em] text-[var(--muted)]">Workspace</p>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="grid h-11 w-11 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex w-max min-w-full gap-1 lg:w-auto lg:min-w-0 lg:flex-col">
        {items.map(({ href, label, icon }) => {
          const Icon = icons[icon];
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              aria-current={active ? "page" : undefined}
              className={`dashboard-nav-item flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] sm:text-sm lg:min-h-11 lg:px-3 ${
                active ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]" : ""
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className="dashboard-nav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
