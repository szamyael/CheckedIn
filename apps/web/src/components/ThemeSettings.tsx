"use client";

import { Moon, Monitor, Palette, Sun } from "@/lib/icons";
import { ThemeMode, useTheme } from "@/components/ThemeProvider";

const modes: { name: ThemeMode; label: string; icon: typeof Sun }[] = [
  { name: "light", label: "Light", icon: Sun },
  { name: "dark", label: "Dark", icon: Moon },
  { name: "system", label: "System", icon: Monitor },
];

export function ThemeSettings() {
  const { mode, setMode } = useTheme();
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--foreground)] shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Palette size={20} /></div><div><h2 className="font-semibold">Appearance</h2><p className="mt-1 text-sm text-[var(--muted)]">Choose a display mode for the CheckedIn design system.</p></div></div>
      <div className="mt-6"><p className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)]">DISPLAY MODE</p><div className="mt-3 grid grid-cols-3 gap-2">{modes.map(({ name, label, icon: Icon }) => <button key={name} type="button" onClick={() => setMode(name)} aria-pressed={mode === name} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${mode === name ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--surface-muted)]"}`}><Icon size={16} />{label}</button>)}</div></div>
    </section>
  );
}
