"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EventQrCode } from "@/components/EventQrCode";
import { useAsyncAction } from "@/lib/useAsyncAction";
import type { Event } from "@/lib/types";

interface EventSecurityControlsProps {
  event: Event;
}

export function EventSecurityControls({ event }: EventSecurityControlsProps) {
  const router = useRouter();
  const run = useAsyncAction();
  const [otp, setOtp] = useState<{ code: string; expiresAt: string } | null>(null);
  const [qrToken, setQrToken] = useState(event.qr_token);
  const [error, setError] = useState<string | null>(null);

  async function generateOtp() {
    setError(null);
    try {
      const data = await run("Generating OTP…", async () => {
        const supabase = createClient();
        const { data, error: fnError } = await supabase.functions.invoke(
          "generate-event-otp",
          { body: { event_id: event.id } },
        );
        if (fnError || data?.error) {
          throw new Error(data?.error ?? fnError?.message ?? "Failed to generate OTP");
        }
        return data;
      });
      setOtp({ code: data.code, expiresAt: data.expires_at });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate OTP");
    }
  }

  async function rotateQr() {
    setError(null);
    try {
      const data = await run("Rotating QR code…", async () => {
        const supabase = createClient();
        const { data, error: fnError } = await supabase.functions.invoke(
          "rotate-event-qr",
          { body: { event_id: event.id } },
        );
        if (fnError || data?.error) {
          throw new Error(data?.error ?? fnError?.message ?? "Failed to rotate QR");
        }
        return data;
      });
      setQrToken(data.qr_token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rotate QR");
    }
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
          onClick={() => void generateOtp()}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
        >
          Generate attendance OTP
        </button>
        <button
          type="button"
          onClick={() => void rotateQr()}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900"
        >
          Rotate QR code
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
