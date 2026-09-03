import type { ReactNode } from "react";

export const studentInputClass =
  "w-full rounded-lg border border-[#e2e5e7] bg-white px-3 py-3 text-sm text-[#202428] outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#c18a2e]/25";

export const studentPrimaryButtonClass =
  "w-full rounded-lg bg-[#17324d] py-3 text-sm font-semibold text-white hover:bg-[#0c2238] disabled:opacity-60";

export const studentSecondaryButtonClass =
  "block w-full rounded-lg border border-[#e2e5e7] py-2.5 text-center text-sm font-medium text-[#3f484f] hover:bg-[#eef1f0]";

export function StudentPageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-[#0c2238]">{title}</h1>
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
    "rounded-lg border border-[#e2e5e7] bg-white p-4 shadow-sm " + className;
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
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#b43b45]">
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
    amber: "border-amber-200 bg-amber-50 text-[#a46618]",
    slate: "border-[#e2e5e7] bg-[#eef1f0] text-[#3f484f]",
    teal: "border-[#b9d8d0] bg-[#edf7f2] text-[#237a57]",
  };
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}
    >
      {message}
    </div>
  );
}

export function StudentEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#cbd2d4] p-8 text-center text-sm text-[#697178]">
      {message}
    </div>
  );
}
