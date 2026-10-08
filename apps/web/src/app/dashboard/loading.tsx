import { LoaderCircle } from "lucide-react";

export default function DashboardLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading dashboard"
      className="space-y-6"
    >
      <div role="status" className="flex items-center gap-3 text-sm font-medium text-[var(--primary)]">
        <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />
        <span>Loading workspace…</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="h-3 w-24 rounded bg-[var(--surface-muted)] motion-safe:animate-pulse" />
            <div className="mt-5 h-7 w-16 rounded bg-[var(--surface-muted)] motion-safe:animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="h-72 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="h-4 w-36 rounded bg-[var(--surface-muted)] motion-safe:animate-pulse" />
          <div className="mt-8 h-44 rounded-xl bg-[var(--surface-muted)] motion-safe:animate-pulse" />
        </div>
        <div className="h-72 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="h-4 w-28 rounded bg-[var(--surface-muted)] motion-safe:animate-pulse" />
          <div className="mt-8 space-y-4">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-7 rounded-lg bg-[var(--surface-muted)] motion-safe:animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
