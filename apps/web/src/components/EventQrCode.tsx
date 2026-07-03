"use client";

import { QRCodeSVG } from "qrcode.react";
import { buildEventQrPayload } from "@/lib/constants";

interface EventQrCodeProps {
  qrToken: string;
  eventTitle: string;
}

export function EventQrCode({ qrToken, eventTitle }: EventQrCodeProps) {
  const payload = buildEventQrPayload(qrToken);

  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6">
      <QRCodeSVG value={payload} size={200} level="H" />
      <p className="mt-4 text-center text-sm font-medium text-slate-900">
        {eventTitle}
      </p>
      <p className="mt-1 text-center text-xs text-slate-600">
        Students scan this QR in the mobile app
      </p>
    </div>
  );
}
