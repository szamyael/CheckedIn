"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventQrCode } from "@/components/EventQrCode";
import { useAsyncAction } from "@/lib/useAsyncAction";
import type { Event } from "@/lib/types";

interface EventSecurityControlsProps { event: Event; }
type Otp = { code: string; expiresAt: string };

export function EventSecurityControls({ event }: EventSecurityControlsProps) {
  const run = useAsyncAction();
  const [otp, setOtp] = useState<Otp | null>(null);
  const [qrToken, setQrToken] = useState(event.qr_token);
  const [qrExpiresAt, setQrExpiresAt] = useState(event.qr_expires_at);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [otpLifetime, setOtpLifetime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadLatestOtp() {
    const { data } = await createClient().from("event_otp_codes")
      .select("code, expires_at, created_at").eq("event_id", event.id)
      .gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return;
    setOtp({ code: data.code, expiresAt: data.expires_at });
    setOtpLifetime(Math.max(1, Math.round((new Date(data.expires_at).getTime() - new Date(data.created_at).getTime()) / 1000)));
  }

  async function refreshCredential() {
    const { data } = await createClient().from("events").select("qr_token, qr_expires_at").eq("id", event.id).maybeSingle();
    if (!data) return;
    setQrToken(data.qr_token);
    setQrExpiresAt(data.qr_expires_at);
  }

  async function generateOtp() {
    setError(null);
    try {
      const data = await run("Generating OTP…", async () => {
        const { data, error: invokeError } = await createClient().functions.invoke("generate-event-otp", { body: { event_id: event.id } });
        if (invokeError || data?.error) throw new Error(data?.error ?? invokeError?.message ?? "Failed to generate OTP");
        return data;
      });
      setOtp({ code: data.code, expiresAt: data.expires_at });
      setOtpLifetime(data.expires_in_seconds ?? Math.max(1, Math.round((new Date(data.expires_at).getTime() - Date.now()) / 1000)));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to generate OTP"); }
  }

  async function rotateQr() {
    setError(null);
    try {
      const data = await run("Rotating QR code…", async () => {
        const { data, error: invokeError } = await createClient().functions.invoke("rotate-event-qr", { body: { event_id: event.id } });
        if (invokeError || data?.error) throw new Error(data?.error ?? invokeError?.message ?? "Failed to rotate QR");
        return data;
      });
      setQrToken(data.qr_token);
      setQrExpiresAt(data.qr_expires_at ?? null);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to rotate QR"); }
  }

  useEffect(() => {
    if (!otp) return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((new Date(otp.expiresAt).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [otp]);

  useEffect(() => {
    if (!otp || secondsLeft > 0 || refreshing) return;
    setRefreshing(true);
    void (async () => { try { await rotateQr(); await generateOtp(); } finally { setRefreshing(false); } })();
  }, [otp, secondsLeft, refreshing]);

  useEffect(() => {
    void refreshCredential();
    if (event.requires_otp) void loadLatestOtp();
    const supabase = createClient();
    const channel = supabase.channel(`event-security-${event.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${event.id}` }, (payload) => {
        const next = payload.new as { qr_token?: string; qr_expires_at?: string | null };
        if (next.qr_token) setQrToken(next.qr_token);
        setQrExpiresAt(next.qr_expires_at ?? null);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_otp_codes", filter: `event_id=eq.${event.id}` }, () => void loadLatestOtp())
      .subscribe();
    const poller = window.setInterval(() => { void refreshCredential(); if (event.requires_otp) void loadLatestOtp(); }, 10_000);
    return () => { window.clearInterval(poller); void supabase.removeChannel(channel); };
  }, [event.id, event.requires_otp]);

  if (event.status !== "published") return null;
  const percent = Math.min(100, (secondsLeft / Math.max(1, otpLifetime)) * 100);
  return (
    <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Security controls</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void generateOtp()} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">Generate attendance OTP</button>
        <button type="button" onClick={() => void rotateQr()} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900">Rotate QR code</button>
      </div>
      {event.requires_otp && <p className="text-xs text-amber-800">This event requires OTP for check-in.</p>}
      {otp && <div className="flex items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center" aria-label={`${secondsLeft} seconds until OTP expires`}>
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-200" />
            <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={secondsLeft <= 10 ? "text-rose-600" : "text-amber-600"} pathLength="100" strokeDasharray="100" strokeDashoffset={100 - percent} />
          </svg>
          <span className="absolute text-sm font-bold tabular-nums text-amber-950">{secondsLeft}s</span>
        </div>
        <div className="min-w-0 text-left"><p className="text-xs text-amber-900">Current attendance OTP</p><p className="text-3xl font-bold tracking-widest text-amber-950">{otp.code}</p><p className="text-xs text-amber-800">Expires {new Date(otp.expiresAt).toLocaleTimeString()} · QR refreshes automatically</p></div>
        {refreshing && <p className="ml-auto text-xs font-medium text-amber-900">Refreshing…</p>}
      </div>}
      {qrExpiresAt && !otp && <p className="text-xs text-slate-600">QR credential is live until {new Date(qrExpiresAt).toLocaleTimeString()}. It updates in place when rotated.</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <EventQrCode qrToken={qrToken} eventTitle={event.title} venueName={event.venue_name} startsAt={event.starts_at} compact />
    </div>
  );
}
