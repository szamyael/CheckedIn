"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeName = "navy" | "forest" | "burgundy" | "indigo" | "slate";
export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: ThemeName;
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeKey = "checkedin-color-theme";
const modeKey = "checkedin-theme-mode";

function resolveMode(mode: ThemeMode) {
  return mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "navy";
    const saved = localStorage.getItem(themeKey) as ThemeName | null;
    return ["navy", "forest", "burgundy", "indigo", "slate"].includes(saved ?? "") ? saved! : "navy";
  });
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem(modeKey) as ThemeMode | null;
    return ["light", "dark", "system"].includes(saved ?? "") ? saved! : "system";
  });
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(() => typeof window === "undefined" ? "light" : resolveMode((localStorage.getItem(modeKey) as ThemeMode | null) ?? "system"));

  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setResolvedMode(media.matches ? "dark" : "light");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.colorTheme = theme;
    root.dataset.mode = resolvedMode;
  }, [theme, resolvedMode]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme, mode, resolvedMode,
    setTheme(nextTheme) { localStorage.setItem(themeKey, nextTheme); setThemeState(nextTheme); },
    setMode(nextMode) { localStorage.setItem(modeKey, nextMode); setModeState(nextMode); setResolvedMode(resolveMode(nextMode)); },
  }), [theme, mode, resolvedMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
