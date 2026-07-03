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
      className={`flex flex-col items-center rounded-xl border border-slate-200 bg-white ${
        compact ? "p-3" : "p-6"
      }`}
    >
      <QRCodeSVG value={payload} size={size} level="H" />
      <p
        className={`mt-3 text-center font-medium text-slate-900 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {eventTitle}
      </p>
      {venueName && (
        <p className="mt-0.5 text-center text-xs text-slate-600">{venueName}</p>
      )}
      {startsAt && (
        <p className="mt-0.5 text-center text-xs text-slate-500">
          {format(new Date(startsAt), "MMM d, yyyy h:mm a")}
        </p>
      )}
      <p className="mt-1 text-center text-xs text-slate-600">
        Students scan in the mobile app
      </p>
    </div>
  );
}
