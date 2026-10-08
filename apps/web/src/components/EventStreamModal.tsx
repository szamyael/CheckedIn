"use client";

import { useEffect } from "react";
import { Radio, X } from "lucide-react";
import type { Event } from "@/lib/types";
import { EventSecurityControls } from "@/components/EventSecurityControls";

export function EventStreamModal({
  event,
  onClose,
}: {
  event: Event;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Stream ${event.title}`}
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background)] text-[var(--foreground)]"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_color-mix(in_srgb,var(--primary)_14%,transparent),_transparent_45%)]" />
      <div className="relative mx-auto flex min-h-full max-w-7xl flex-col px-4 py-3 sm:px-8 sm:py-3">
        <header className="flex items-center justify-between gap-5 border-b border-[var(--border)] pb-4 sm:pb-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--primary-soft)] text-[var(--foreground)]">
              <Radio size={21} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold tracking-[0.18em] text-[var(--foreground)]">
                  CHECKEDIN · EVENT DISPLAY
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--success)_25%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-2 py-1 text-[10px] font-semibold text-[var(--foreground)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                  LIVE
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-[var(--muted)]">
                {event.venue_name || "Event check-in"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label="Close event stream"
          >
            <X size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Close display</span>
          </button>
        </header>

        <section className="py-5 sm:py-5">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-5 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Attendance is open
              </p>
              <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
                {event.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                {event.description ||
                  "Students can scan the event QR code in the CheckedIn app to record attendance."}
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm shadow-[var(--shadow-soft)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Location
              </p>
              <p className="mt-1 max-w-sm text-[var(--foreground)]">
                {event.venue_name}
                {event.venue_address ? ` · ${event.venue_address}` : ""}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)] sm:p-3">
            <EventSecurityControls event={event} stream />
          </div>
        </section>

        <footer className="mt-auto flex flex-col gap-2 border-t border-[var(--border)] py-2 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>Keep this display open for projection. Credentials refresh automatically.</p>
          <p>Press Esc to close</p>
        </footer>
      </div>
    </div>
  );
}
