import type { ReactNode } from "react";
import { Camera, Check, MapPin, QrCode, ShieldCheck } from "@/lib/icons";

export const studentInputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent)]/25";

export const studentPrimaryButtonClass =
  "min-h-11 w-full rounded-lg bg-[var(--action-background)] py-3 text-sm font-semibold text-[var(--action-foreground)] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:opacity-60";

export const studentSecondaryButtonClass =
  "block min-h-11 w-full rounded-lg border border-[var(--border)] py-2.5 text-center text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2";

const attendanceSteps = [
  { label: "Scan", icon: QrCode },
  { label: "Location", icon: MapPin },
  { label: "OTP", icon: ShieldCheck },
  { label: "Selfie", icon: Camera },
];

export function StudentStepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Check-in progress" className="mb-6">
      <ol className="flex items-start justify-between">
        {attendanceSteps.map(({ label, icon: Icon }, index) => {
          const step = index + 1;
          const complete = step < current;
          const active = step === current;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span
                  aria-current={active ? "step" : undefined}
                  className={`grid h-9 w-9 place-items-center rounded-full border text-xs font-bold ${
                    complete
                      ? "border-[var(--success)] bg-[var(--success)] text-white"
                      : active
                        ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                        : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]"
                  }`}
                >
                  {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span className={`text-center text-[11px] ${active ? "font-semibold text-[var(--primary-strong)]" : "text-[var(--muted)]"}`}>
                  {label}
                </span>
              </div>
              {index < attendanceSteps.length - 1 && (
                <span className={`mt-4 h-px flex-1 ${step < current ? "bg-[var(--success)]" : "bg-[var(--border)]"}`} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StudentPageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-[var(--primary-strong)]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
    </div>
  );
}

export function StudentCard({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const base =
    "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] " + className;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} text-left`}>
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

export function StudentErrorBanner({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg border border-[color-mix(in_srgb,var(--error)_35%,var(--border))] bg-[color-mix(in_srgb,var(--error)_12%,var(--surface))] px-3 py-2 text-sm text-[var(--error)]">
      {message}
    </p>
  );
}

export function StudentInfoBanner({
  message,
  tone = "amber",
}: {
  message: string;
  tone?: "amber" | "slate" | "teal";
}) {
  const tones = {
    amber: "border-[color-mix(in_srgb,var(--warning)_38%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface))] text-[var(--warning)]",
    slate: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]",
    teal: "border-[color-mix(in_srgb,var(--primary)_38%,var(--border))] bg-[var(--primary-soft)] text-[var(--primary-strong)]",
  };
  return (
    <div role="status" className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>
      {message}
    </div>
  );
}

export function StudentEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
      {message}
    </div>
  );
}
