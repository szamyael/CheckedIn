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
    <header className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--primary)]">{eyebrow}</p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-[var(--primary-strong)]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

export function DashboardStat({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-[11px] font-semibold tracking-[0.1em] text-[var(--muted)]">{label.toUpperCase()}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--primary-strong)]">{value}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p>
    </section>
  );
}

export function DashboardSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--primary-strong)]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {children}
    </section>
  );
}
