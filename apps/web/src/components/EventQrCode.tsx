"use client";

import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { buildEventQrPayload } from "@/lib/constants";

interface EventQrCodeProps {
  qrToken: string;
  eventTitle: string;
  venueName?: string | null;
  startsAt?: string;
  compact?: boolean;
}

export function EventQrCode({
  qrToken,
  eventTitle,
  venueName,
  startsAt,
  compact = false,
}: EventQrCodeProps) {
  const payload = buildEventQrPayload(qrToken);
  const size = compact ? 140 : 200;

  return (
    <div
      className={`flex flex-col items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] ${
        compact ? "p-3" : "p-6"
      }`}
    >
      <div className="rounded-xl bg-white p-2">
        <QRCodeSVG
          value={payload}
          size={size}
          level="H"
          role="img"
          aria-label={`Check-in QR code for ${eventTitle || "this event"}`}
        />
      </div>
      {eventTitle && (
        <p
          className={`mt-3 text-center font-medium text-slate-900 ${
            compact ? "text-xs" : "text-sm"
          } text-[var(--foreground)]`}
        >
          {eventTitle}
        </p>
      )}
      {venueName && (
        <p className="mt-0.5 text-center text-xs text-[var(--muted)]">{venueName}</p>
      )}
      {startsAt && (
        <p         className="mt-0.5 text-center text-xs text-[var(--muted)]">
          {format(new Date(startsAt), "MMM d, yyyy h:mm a")}
        </p>
      )}
      <p className="mt-1 text-center text-xs text-[var(--muted)]">
        Students scan in the mobile app
      </p>
    </div>
  );
}
