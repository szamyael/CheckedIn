"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EventQrCode } from "@/components/EventQrCode";
import type { Event } from "@/lib/types";

interface EventSecurityControlsProps {
  event: Event;
}

export function EventSecurityControls({ event }: EventSecurityControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"otp" | "qr" | null>(null);
  const [otp, setOtp] = useState<{ code: string; expiresAt: string } | null>(null);
  const [qrToken, setQrToken] = useState(event.qr_token);
  const [error, setError] = useState<string | null>(null);

  async function generateOtp() {
    setLoading("otp");
    setError(null);
    const supabase = createClient();
    const { data, error: fnError } = await supabase.functions.invoke(
      "generate-event-otp",
      { body: { event_id: event.id } },
    );
    setLoading(null);
    if (fnError || data?.error) {
      setError(data?.error ?? fnError?.message ?? "Failed to generate OTP");
      return;
    }
    setOtp({ code: data.code, expiresAt: data.expires_at });
    router.refresh();
  }

  async function rotateQr() {
    setLoading("qr");
    setError(null);
    const supabase = createClient();
    const { data, error: fnError } = await supabase.functions.invoke(
      "rotate-event-qr",
      { body: { event_id: event.id } },
    );
    setLoading(null);
    if (fnError || data?.error) {
      setError(data?.error ?? fnError?.message ?? "Failed to rotate QR");
      return;
    }
    setQrToken(data.qr_token);
    router.refresh();
  }

  if (event.status !== "published") return null;

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Security controls
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generateOtp}
          disabled={loading !== null}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading === "otp" ? "Generating…" : "Generate attendance OTP"}
        </button>
        <button
          type="button"
          onClick={rotateQr}
          disabled={loading !== null}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {loading === "qr" ? "Rotating…" : "Rotate QR code"}
        </button>
      </div>
      {event.requires_otp && (
        <p className="text-xs text-amber-800">This event requires OTP for check-in.</p>
      )}
      {otp && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-xs text-amber-900">Current attendance OTP</p>
          <p className="text-3xl font-bold tracking-widest text-amber-950">{otp.code}</p>
          <p className="text-xs text-amber-800">
            Expires {new Date(otp.expiresAt).toLocaleTimeString()}
          </p>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <EventQrCode
        qrToken={qrToken}
        eventTitle={event.title}
        venueName={event.venue_name}
        startsAt={event.starts_at}
        compact
      />
    </div>
  );
}
