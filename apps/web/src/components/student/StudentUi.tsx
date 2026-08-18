import type { ReactNode } from "react";

export const studentInputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

export const studentPrimaryButtonClass =
  "w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60";

export const studentSecondaryButtonClass =
  "block w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50";

export function StudentPageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
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
    "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm " + className;
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
    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
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
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
  };
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${tones[tone]}`}
    >
      {message}
    </div>
  );
}

export function StudentEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
