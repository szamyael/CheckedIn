"use client";

import { Check, Moon, Monitor, Palette, Sun } from "lucide-react";
import { ThemeMode, ThemeName, useTheme } from "@/components/ThemeProvider";

const themes: { name: ThemeName; label: string; description: string; color: string }[] = [
  { name: "navy", label: "Navy", description: "Institutional", color: "#17324D" },
  { name: "forest", label: "Forest", description: "Grounded", color: "#275D46" },
  { name: "burgundy", label: "Burgundy", description: "Classic", color: "#6B2E3D" },
  { name: "indigo", label: "Indigo", description: "Focused", color: "#3F4B88" },
  { name: "slate", label: "Slate", description: "Neutral", color: "#3F515C" },
];

const modes: { name: ThemeMode; label: string; icon: typeof Sun }[] = [
  { name: "light", label: "Light", icon: Sun },
  { name: "dark", label: "Dark", icon: Moon },
  { name: "system", label: "System", icon: Monitor },
];

export function ThemeSettings() {
  const { theme, mode, setTheme, setMode } = useTheme();
  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--foreground)]">
      <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]"><Palette size={20} /></div><div><h2 className="font-semibold">Appearance</h2><p className="mt-1 text-sm text-[var(--muted)]">Personalize the presentation without changing the workspace.</p></div></div>
      <div className="mt-6"><p className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)]">THEME MODE</p><div className="mt-3 grid grid-cols-3 gap-2">{modes.map(({ name, label, icon: Icon }) => <button key={name} type="button" onClick={() => setMode(name)} className={`flex min-h-12 items-center justify-center gap-2 border text-sm font-semibold ${mode === name ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"}`}><Icon size={16} />{label}</button>)}</div></div>
      <div className="mt-6"><p className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)]">COLOR THEME</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{themes.map(({ name, label, description, color }) => <button key={name} type="button" onClick={() => setTheme(name)} className={`flex min-h-14 items-center gap-3 border p-3 text-left ${theme === name ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] hover:border-[var(--primary)]"}`}><span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: color }}>{theme === name && <Check size={15} className="text-white" />}</span><span><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-[var(--muted)]">{description}</span></span></button>)}</div></div>
    </section>
  );
}
