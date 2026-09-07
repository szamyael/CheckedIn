"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, X } from "lucide-react";
import { ThemeSettings } from "@/components/ThemeSettings";

export function ThemePanelButton() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--primary)] hover:bg-[var(--primary-soft)]" aria-label="Open appearance settings" aria-expanded={open}>
        {open ? <X size={20} /> : <Palette size={20} />}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:max-h-[calc(100dvh-6rem)] sm:w-[22rem]">
          <ThemeSettings />
        </div>
      )}
    </div>
  );
}
