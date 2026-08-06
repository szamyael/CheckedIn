"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { parseEventQrPayload } from "@/lib/constants";

export function QrScanner({
  onScan,
  onError,
}: {
  onScan: (token: string) => void;
  onError?: (message: string) => void;
}) {
  const [ready, setReady] = useState(false);
  const handled = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const id = "student-qr-reader";
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;
    let cancelled = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (handled.current || cancelled) return;
          const token = parseEventQrPayload(decoded);
          if (!token) {
            onError?.("Invalid QR code. Scan a CheckedIn event code.");
            return;
          }
          handled.current = true;
          void scanner.stop().catch(() => undefined);
          onScan(token);
        },
        () => undefined,
      )
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: Error) => {
        onError?.(
          err.message ||
            "Camera permission denied. Allow camera access to scan QR codes.",
        );
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s?.isScanning) {
        void s.stop().catch(() => undefined);
      }
    };
  }, [onScan, onError]);

  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      <div id="student-qr-reader" className="min-h-[280px] w-full" />
      {!ready && (
        <p className="p-4 text-center text-sm text-white/70">
          Starting camera…
        </p>
      )}
    </div>
  );
}
