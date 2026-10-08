"use client";

import { Search } from "lucide-react";
import type { ChangeEvent, FocusEvent, KeyboardEvent } from "react";

export function DashboardSearchInput({
  value,
  onChange,
  placeholder,
  label,
  className = "",
  autoFocus = false,
  autoComplete = "off",
  onKeyDown,
  onFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={`dashboard-search-control group flex min-h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 shadow-sm transition focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[var(--primary-soft)] ${className}`}>
      <Search className="h-[17px] w-[17px] shrink-0 text-[var(--muted)] transition-colors group-focus-within:text-[var(--primary)]" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className="dashboard-search-input min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
      />
    </label>
  );
}
