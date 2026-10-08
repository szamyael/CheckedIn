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
  Settings,
  Users,
  LayoutGrid,
} from "lucide-react";

const icons = {
  calendar: Calendar,
  users: Users,
  monitor: Radio,
  reports: BarChart3,
  analytics: LineChart,
  settings: Settings,
  bingo: LayoutGrid,
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
        <p className="dashboard-nav-label text-[10px] font-semibold tracking-[0.16em] text-white/45">WORKSPACE</p>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="grid h-8 w-8 place-items-center rounded-lg text-white/65 transition hover:bg-white/10 hover:text-white"
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
            className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:text-sm lg:min-h-11 lg:gap-3 lg:px-3 ${
              active ? "bg-white/15 text-white shadow-sm" : ""
            }`}
          >
            <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
            <span className="dashboard-nav-label">{label}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
