"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "@/lib/icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CheckedIn route error", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--background)] px-5 py-12 text-[var(--foreground)]">
      <section className="w-full max-w-lg rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow-lift)] sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--error)_12%,transparent)] text-[var(--error)]">
          <AlertTriangle aria-hidden="true" size={26} />
        </div>
        <p className="mt-6 text-xs font-bold tracking-[0.18em] text-[var(--error)]">
          SOMETHING WENT WRONG
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
          We couldn’t load this page
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Your work is safe. Try again, or return to the previous page and
          continue from there.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mx-auto mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)]"
        >
          <RotateCw aria-hidden="true" size={17} />
          Try again
        </button>
      </section>
    </main>
  );
}
