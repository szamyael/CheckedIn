"use client";

import { useEffect, useId, useRef, useState } from "react";
import { KeyRound, LoaderCircle, RotateCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EventQrCode } from "@/components/EventQrCode";
import type { Event } from "@/lib/types";

interface EventSecurityControlsProps { event: Event; stream?: boolean; }
type Otp = { code: string; expiresAt: string; deadline: number; duration: number };

/** Live credentials. Requests deliberately use local state so the operator can
 * keep using the portal while a new QR or OTP is generated. */
export function EventSecurityControls({ event, stream = false }: EventSecurityControlsProps) {
  // Cards and the fullscreen stream can be mounted at the same time for one
  // event. Realtime channel names must therefore be unique per UI instance.
  const instanceId = useId().replace(/:/g, "");
  const serverClockOffset = useRef(0);
  const [otp, setOtp] = useState<Otp | null>(null);
  const [qrToken, setQrToken] = useState(event.qr_token);
  const [qrExpiresAt, setQrExpiresAt] = useState(event.qr_expires_at);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [action, setAction] = useState<"otp" | "qr" | null>(null);
  const refreshAttemptedFor = useRef<string | null>(null);

  async function loadLatestOtp() {
    const { data } = await createClient().from("event_otp_codes").select("code, expires_at, created_at").eq("event_id", event.id).gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) {
      setOtp(null);
      return;
    }
    const createdAt = new Date(data.created_at).getTime();
    const expiresAt = new Date(data.expires_at).getTime();
    const deadline = expiresAt - serverClockOffset.current;
    setOtp({ code: data.code, expiresAt: data.expires_at, deadline, duration: expiresAt - createdAt });
    setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
  }

  async function refreshCredential() {
    const { data } = await createClient().from("events").select("qr_token, qr_expires_at").eq("id", event.id).maybeSingle();
    if (!data) return;
    setQrToken(data.qr_token);
    setQrExpiresAt(data.qr_expires_at);
  }

  async function generateOtp() {
    setError(null); setAction("otp");
    try {
      const { data, error: invokeError } = await createClient().functions.invoke("generate-event-otp", { body: { event_id: event.id } });
      if (invokeError || data?.error) throw new Error(data?.error ?? invokeError?.message ?? "Failed to generate OTP");
      // The function returns the event's shared active OTP. If another staff
      // member already generated it, this view simply joins that stream.
      const receivedAt = Date.now();
      if (data.server_time) {
        serverClockOffset.current = new Date(data.server_time).getTime() - receivedAt;
      }
      const createdAt = new Date(data.created_at ?? data.server_time ?? receivedAt).getTime();
      const expiresAt = new Date(data.expires_at).getTime();
      const deadline = expiresAt - serverClockOffset.current;
      setOtp({ code: data.code, expiresAt: data.expires_at, deadline, duration: expiresAt - createdAt });
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to generate OTP"); } finally { setAction(null); }
  }

  async function rotateQr() {
    setError(null); setAction("qr");
    try {
      const { data, error: invokeError } = await createClient().functions.invoke("rotate-event-qr", { body: { event_id: event.id } });
      if (invokeError || data?.error) throw new Error(data?.error ?? invokeError?.message ?? "Failed to rotate QR");
      setQrToken(data.qr_token); setQrExpiresAt(data.qr_expires_at ?? null);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to rotate QR"); } finally { setAction(null); }
  }

  // Credential expiration is an external clock; start one background refresh
  // when it reaches zero rather than blocking the operator's workspace.
  useEffect(() => {
    if (!otp) return;
    let timer: number;
    const update = () => {
      const remainingMs = otp.deadline - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
      if (remainingMs > 0) {
        timer = window.setTimeout(update, remainingMs % 1000 || 1000);
      }
    };
    update();
    return () => window.clearTimeout(timer);
  }, [otp]);

  useEffect(() => {
    if (
      !otp ||
      secondsLeft > 0 ||
      refreshing ||
      action !== null ||
      refreshAttemptedFor.current === otp.expiresAt
    ) return;
    refreshAttemptedFor.current = otp.expiresAt;
    setRefreshing(true);
    void (async () => { try { await rotateQr(); await generateOtp(); } finally { setRefreshing(false); } })();
  // These functions intentionally keep the latest credential state without
  // recreating the expiration watcher on each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, secondsLeft, refreshing, action]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCredential(); if (event.requires_otp) void loadLatestOtp();
    const supabase = createClient();
    const channel = supabase.channel(`event-security-${event.id}-${instanceId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${event.id}` }, (payload) => {
      const next = payload.new as { qr_token?: string; qr_expires_at?: string | null };
      if (next.qr_token) setQrToken(next.qr_token); setQrExpiresAt(next.qr_expires_at ?? null);
    }).on("postgres_changes", { event: "INSERT", schema: "public", table: "event_otp_codes", filter: `event_id=eq.${event.id}` }, () => void loadLatestOtp()).subscribe();
    const poller = window.setInterval(() => { void refreshCredential(); if (event.requires_otp) void loadLatestOtp(); }, 10_000);
    return () => { window.clearInterval(poller); void supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, event.requires_otp, instanceId]);

  if (event.status !== "published") return null;
  const percent = Math.min(100, otp ? (secondsLeft * 1000 / Math.max(1, otp.duration)) * 100 : 0);
  const activeOtp = otp && secondsLeft > 0 ? otp : null;
  const themeBorder = stream ? "border-[var(--border)]" : "";
  const themeSurface = stream ? "bg-[var(--surface)]" : "";
  const themePrimaryText = stream ? "text-[var(--foreground)]" : "";
  const themeMutedText = stream ? "text-[var(--muted)]" : "";
  return (
    <div className={`${stream ? "space-y-3" : "mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"}`}>
      {!stream && (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Security controls
        </p>
      )}
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${stream ? "rounded-2xl border border-slate-200 bg-white p-4 sm:px-5" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          {event.requires_otp && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stream ? "bg-[var(--primary-soft)] text-[var(--primary-strong)] ring-1 ring-inset ring-[var(--border)]" : "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200"}`}>
              OTP required
            </span>
          )}
          {stream && (
            <p className="text-sm text-[var(--muted)]">
              QR credentials update automatically
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={action !== null}
            onClick={() => void generateOtp()}
            className={`${stream ? "min-h-11 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:opacity-90" : "rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"} inline-flex items-center justify-center gap-2 transition disabled:cursor-wait disabled:opacity-60`}
          >
            {action === "otp" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            )}
            {action === "otp" ? "Loading OTP…" : otp ? "Show shared OTP" : "Generate attendance OTP"}
          </button>
          <button
            type="button"
            disabled={action !== null}
            onClick={() => void rotateQr()}
            className={`${stream ? "min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]" : "rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900"} inline-flex items-center justify-center gap-2 transition disabled:cursor-wait disabled:opacity-60`}
          >
            {action === "qr" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCw className="h-4 w-4" aria-hidden="true" />
            )}
            {action === "qr" ? "Rotating QR…" : "Rotate QR code"}
          </button>
        </div>
      </div>

      <div className={stream ? "grid gap-4 lg:grid-cols-2 lg:items-stretch" : ""}>
        <div className={stream ? `rounded-2xl border ${themeBorder} ${themeSurface} p-3 sm:p-4` : ""}>
          {stream && (
            <div className="mb-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--foreground)]">
                Scan to check in
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Open the CheckedIn app and scan this event code
              </p>
            </div>
          )}
          <EventQrCode
            qrToken={qrToken}
            eventTitle={stream ? "" : event.title}
            venueName={stream ? undefined : event.venue_name}
            startsAt={stream ? undefined : event.starts_at}
            compact={!stream}
          />
        </div>
        <div className={stream ? `flex min-h-64 flex-col justify-center rounded-2xl border ${themeBorder} ${themeSurface} p-5 sm:p-7` : ""}>
          {activeOtp ? (
            <div className={`flex flex-col items-center gap-4 rounded-2xl border p-5 text-center sm:flex-row sm:text-left ${stream ? "border-[var(--border)] bg-[var(--primary-soft)] sm:gap-6 sm:p-7" : "border-amber-200 bg-amber-50"}`}>
              <div
                className={`relative grid h-20 w-20 shrink-0 place-items-center ${stream ? "sm:h-24 sm:w-24" : ""}`}
                aria-label={`OTP expires in ${secondsLeft} seconds`}
              >
                <svg className="h-full w-full -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className={stream ? "text-[var(--border)]" : "text-amber-200"} />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={stream ? secondsLeft <= 10 ? "text-[var(--error)]" : "text-[var(--accent)]" : secondsLeft <= 10 ? "text-rose-600" : "text-amber-600"} pathLength="100" strokeDasharray="100" strokeDashoffset={100 - percent} />
                </svg>
                <span className={`absolute text-sm font-bold tabular-nums ${stream ? themePrimaryText : "text-amber-950"}`}>
                  {secondsLeft}s
                </span>
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wider ${stream ? themeMutedText : "text-amber-900"}`}>
                  Current attendance OTP
                </p>
                <p className={`${stream ? "text-5xl sm:text-6xl" : "text-3xl"} mt-2 font-bold tracking-[0.18em] tabular-nums ${stream ? themePrimaryText : "text-amber-950"}`}>
                  {activeOtp.code}
                </p>
                <p className={`mt-2 text-xs ${stream ? themeMutedText : "text-amber-800"}`}>
                  Expires {new Date(activeOtp.expiresAt).toLocaleTimeString()}
                </p>
              </div>
              {refreshing && (
                <p className={`text-xs font-medium sm:ml-auto ${stream ? themeMutedText : "text-amber-900"}`}>
                  Refreshing…
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${stream ? "bg-[var(--primary-soft)] text-[var(--foreground)]" : "bg-amber-50 text-amber-700"}`}>
                {refreshing || action === "otp" ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <p className={`mt-4 font-semibold ${stream ? themePrimaryText : "text-slate-900"}`}>
                {event.requires_otp ? "Attendance OTP" : "Optional OTP"}
              </p>
              <p className={`mx-auto mt-1 max-w-xs text-sm leading-6 ${stream ? themeMutedText : "text-slate-500"}`}>
                {refreshing
                  ? "The previous code has expired. A fresh code is being requested."
                  : error && secondsLeft === 0
                    ? "The previous code expired. Retry to generate a new code."
                    : event.requires_otp
                  ? "Generate or load the shared code for students who have scanned the QR."
                  : "Generate a shared code if you need an additional check-in method."}
              </p>
              {qrExpiresAt && (
                <p className={`mt-4 text-xs ${stream ? themeMutedText : "text-slate-500"}`}>
                  QR active until {new Date(qrExpiresAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className={`rounded-xl border px-4 py-3 text-sm ${stream ? "border-[color-mix(in_srgb,var(--error)_30%,transparent)] bg-[var(--surface-muted)] text-[var(--error)]" : "border-red-200 bg-red-50 text-red-800"}`}>
          {error}
        </p>
      )}
    </div>
  );
}
