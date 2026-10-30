"use client";

import { useEffect, useState } from "react";

interface ApiLog {
  id: number;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  created_at: string;
}

interface MonitorData {
  heartbeat: {
    status: "online" | "offline";
    checkedAt?: string;
    latencyMs?: number;
  };
  logs: ApiLog[];
}

function ApiLogTable({
  logs,
  emptyMessage,
}: {
  logs: ApiLog[];
  emptyMessage: string;
}) {
  return (
    <div className="table-scroll rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-[var(--border)] text-[var(--muted)]">
          <tr>
            <th scope="col" className="px-4 py-3">Time</th>
            <th scope="col" className="px-4 py-3">Method</th>
            <th scope="col" className="px-4 py-3">Route</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Duration</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-[var(--border)] last:border-0">
              <td className="whitespace-nowrap px-4 py-3">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{log.method}</td>
              <td className="px-4 py-3 font-mono text-xs">{log.path}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    log.status_code >= 500
                      ? "text-[var(--error)]"
                      : log.status_code >= 400
                        ? "text-[var(--warning)]"
                        : "text-[var(--success)]"
                  }
                >
                  {log.status_code}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                {log.duration_ms} ms
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-[var(--muted)]">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminApiMonitor() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heartbeatSamples, setHeartbeatSamples] = useState<(number | null)[]>([]);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    let active = true;
    let nextCheck: number | undefined;
    let controller: AbortController | undefined;

    async function refresh() {
      controller = new AbortController();
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        controller?.abort();
      }, 10_000);

      try {
        const response = await fetch("/api/admin/monitor", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as Partial<MonitorData> & {
          error?: string;
        };
        if (!active) return;
        if (!result.heartbeat || !Array.isArray(result.logs)) {
          setData(null);
          setError(result.error ?? "Monitor response was incomplete.");
          setHeartbeatSamples((samples) => [...samples, null].slice(-6));
          return;
        }
        setData(result as MonitorData);
        setError(response.ok ? null : result.error ?? "Monitor is unavailable.");
        const latency = result.heartbeat.latencyMs;
        setHeartbeatSamples((samples) =>
          [
            ...samples,
            result.heartbeat?.status === "online" &&
            typeof latency === "number" &&
            Number.isFinite(latency)
              ? latency
              : null,
          ].slice(-6),
        );
      } catch {
        if (!active) return;
        setData(null);
        setHeartbeatSamples((samples) => [...samples, null].slice(-6));
        setError(
          timedOut
            ? "Heartbeat check timed out."
            : "Could not reach the API monitor.",
        );
      } finally {
        window.clearTimeout(timeout);
        if (active) {
          nextCheck = window.setTimeout(() => void refresh(), 15_000);
        }
      }
    }

    void refresh();
    return () => {
      active = false;
      window.clearTimeout(nextCheck);
      controller?.abort();
    };
  }, []);

  useEffect(() => {
    if (!showMore) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowMore(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showMore]);

  const online = data?.heartbeat.status === "online";
  const statusLabel = online
    ? "Supabase reachable"
    : error
      ? "Supabase unavailable"
      : "Checking Supabase…";
  const heartbeatPoints = [0, 1]
    .flatMap((repeat) =>
      Array.from({ length: 6 }, (_, index) => {
        const latency = heartbeatSamples[index] ?? null;
        const startX = repeat * 160 + (index * 160) / 6;
        const width = 160 / 6;
        const amplitude =
          latency === null
            ? 0
            : 2 + (Math.min(Math.max(latency, 0), 1000) / 1000) * 12;
        return [
          `${startX},18`,
          `${startX + width * 0.2},18`,
          `${startX + width * 0.3},20`,
          `${startX + width * 0.42},${18 - amplitude}`,
          `${startX + width * 0.53},${18 + amplitude * 0.65}`,
          `${startX + width * 0.65},16`,
          `${startX + width * 0.76},18`,
          `${startX + width},18`,
        ].join(" ");
      }),
    )
    .join(" ");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-3">
          <span
            aria-label={
              online
                ? "Heartbeat online"
                : error
                  ? "Heartbeat offline"
                  : "Heartbeat checking"
            }
            className={`h-3 w-3 rounded-full ${
              online
                ? "animate-pulse motion-reduce:animate-none bg-emerald-500"
                : error
                  ? "bg-rose-500"
                  : "animate-pulse motion-reduce:animate-none bg-amber-500"
            }`}
          />
          <div>
            <p className="font-semibold">Database heartbeat</p>
            <p className="text-sm text-[var(--muted)]">{statusLabel}</p>
          </div>
        </div>
        <svg
          aria-label={`Database heartbeat trace; latest response ${data?.heartbeat.latencyMs ?? "unavailable"} milliseconds`}
          className={`h-9 min-w-[120px] flex-1 basis-24 ${
            online ? "text-[var(--success)]" : "text-[var(--error)]"
          }`}
          role="img"
          viewBox="0 0 160 36"
          preserveAspectRatio="none"
        >
          <g className="heartbeat-trace-scroll">
            <polyline
              fill="none"
              points={heartbeatPoints}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
        <div className="text-sm text-[var(--muted)] sm:text-right">
          <p>{data?.heartbeat.latencyMs ?? "—"} ms</p>
          <p>
            Last check:{" "}
            {data?.heartbeat.checkedAt
              ? new Date(data.heartbeat.checkedAt).toLocaleTimeString()
              : "Checking…"}
          </p>
        </div>
      </div>

      {error && (
        <p role="status" className="text-sm text-[var(--error)]">
          {error}
        </p>
      )}

      <div>
        <p className="mb-1 font-semibold">Recent API calls</p>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Web app API routes only. Request bodies, query strings, and credentials
          are not recorded. The heartbeat and logs refresh automatically; checks
          time out after 10 seconds.
        </p>
        {!data && !error ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--muted)]">
            Loading API monitor…
          </div>
        ) : (
          <ApiLogTable
            logs={(data?.logs ?? []).slice(0, 5)}
            emptyMessage={error ? "API calls are unavailable." : "No API calls recorded yet."}
          />
        )}
        {(data?.logs.length ?? 0) > 5 && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            View more (20)
          </button>
        )}
      </div>

      {showMore && (
        <div
          className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowMore(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-log-dialog-title"
            className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] p-5">
              <div>
                <h2 id="api-log-dialog-title" className="text-lg font-semibold">
                  Recent API calls
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Showing the 20 most recent calls.
                </p>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setShowMore(false)}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                Close
              </button>
            </div>
            <div className="overflow-auto p-4">
              <ApiLogTable
                logs={(data?.logs ?? []).slice(0, 20)}
                emptyMessage="No API calls recorded yet."
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
