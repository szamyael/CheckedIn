import type { ReactNode } from "react";

export function DashboardPageHeader({
  eyebrow = "OPERATIONS",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-end sm:p-7">
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--primary)]">{eyebrow}</p>
        <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-[var(--primary-strong)] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {actions && <div className="w-full shrink-0 sm:w-auto">{actions}</div>}
    </header>
  );
}

export function DashboardStat({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <section className="min-w-0 border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] sm:text-[11px]">{label.toUpperCase()}</p>
      <p className="mt-3 break-words text-3xl font-semibold tracking-tight text-[var(--primary-strong)] sm:text-4xl">{value}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p>
    </section>
  );
}

export function DashboardSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--primary-strong)]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {children}
    </section>
  );
}
