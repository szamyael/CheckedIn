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
      {open && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] shadow-2xl"><ThemeSettings /></div>}
    </div>
  );
}
