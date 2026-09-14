"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { Event } from "@/lib/types";
import { EventSecurityControls } from "@/components/EventSecurityControls";

export function EventStreamModal({ event, onClose }: { event: Event; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return <div role="dialog" aria-modal="true" aria-label={`Stream ${event.title}`} className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 p-4 text-white sm:p-8"><div className="mx-auto flex min-h-full max-w-5xl flex-col"><div className="flex items-start justify-between gap-4 border-b border-white/20 pb-5"><div><p className="text-xs font-semibold tracking-[0.16em] text-amber-300">LIVE EVENT STREAM</p><h1 className="mt-2 text-3xl font-bold sm:text-5xl">{event.title}</h1><p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">{event.description || "Attendance is currently open for this event."}</p><p className="mt-3 text-sm font-medium text-white">{event.venue_name}{event.venue_address ? ` · ${event.venue_address}` : ""}</p></div><button type="button" onClick={onClose} className="rounded-lg border border-white/30 p-2 text-white hover:bg-white/10" aria-label="Close event stream"><X size={24} /></button></div><main className="flex flex-1 items-center py-8"><div className="w-full rounded-2xl bg-white p-5 text-slate-900 shadow-2xl sm:p-8"><EventSecurityControls event={event} stream /></div></main><p className="pb-2 text-center text-xs text-slate-300">Keep this view open for projection. QR and OTP refresh in place.</p></div></div>;
}
