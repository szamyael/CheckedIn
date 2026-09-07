"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
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

  return (
    <nav className="flex-1 px-3 py-5" aria-label="Dashboard navigation">
      <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-slate-500">
        WORKSPACE
      </p>
      <div className="space-y-1">
      {items.map(({ href, label, icon }) => {
        const Icon = icons[icon];
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-10 items-center gap-3 border-l-2 px-3 text-sm font-medium text-slate-300 transition-colors hover:border-[#c18a2e] hover:bg-[#17324d] hover:text-white ${
              active ? "border-[#c18a2e] bg-[#17324d] text-white" : "border-transparent"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
