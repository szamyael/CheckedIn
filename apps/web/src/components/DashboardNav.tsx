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
    <nav className="flex-1 space-y-1 p-3">
      {items.map(({ href, label, icon }) => {
        const Icon = icons[icon];
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 border-l-2 px-3 py-2 text-sm font-medium text-slate-300 hover:border-[#c18a2e] hover:bg-[#17324d] hover:text-white ${
              active ? "border-[#c18a2e] bg-[#17324d] text-white" : "border-transparent"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}