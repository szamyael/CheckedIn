import type { ReactNode } from "react";

export function DashboardPageHeader({
  eyebrow = "OPERATIONS",
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="dashboard-page-header flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.08em] text-[var(--primary)]">{eyebrow}</p>
        <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[26px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {actions && <div className="relative z-10 w-full shrink-0 sm:w-auto">{actions}</div>}
    </header>
  );
}

export function DashboardStat({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <section className="dashboard-stat-card min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-shadow sm:p-5">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-3 break-words text-3xl font-semibold tabular-nums tracking-tight text-[var(--foreground)]">{value}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p>
    </section>
  );
}

export function DashboardSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="dashboard-section min-w-0 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {children}
    </section>
  );
}
