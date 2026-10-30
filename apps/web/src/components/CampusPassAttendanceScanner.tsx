"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Calendar, CircleCheck, QrCode } from "@/lib/icons";
import {
  getNewCampusPassTokens,
  claimCampusPassScanToken,
  normalizeCampusPassToken,
  parseCampusPassScanResult,
} from "@/lib/campus-pass.mjs";
import { createClient } from "@/lib/supabase/client";
import { UserErrorDialog } from "@/components/UserErrorDialog";

type CheckInEvent = {
  id: string;
  title: string;
  venue_name: string | null;
  attendance_starts_at: string;
  attendance_ends_at: string;
  allowed_year_levels: number[];
};

type ScanStudent = {
  name: string;
  student_id: string;
  program: string;
  year_level: number | null;
  section: string | null;
};

type ScanResult = {
  action: "checked_in" | "checked_out";
  student: ScanStudent;
  scannedAt: number;
};

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorApi = {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
};
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorApi;
type BarcodeDetectorWindow = Window & { BarcodeDetector?: BarcodeDetectorConstructor };

function CampusPassCamera({
  onToken,
  onError,
  isSubmitting,
}: {
  onToken: (token: string) => void;
  onError: (message: string) => void;
  isSubmitting: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [nativeScanner, setNativeScanner] = useState(false);
  const [qrDetected, setQrDetected] = useState(false);
  const callbacks = useRef({ onToken, onError });

  useEffect(() => {
    callbacks.current = { onToken, onError };
  }, [onError, onToken]);

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;
    let stream: MediaStream | null = null;
    let cancelled = false;
    let animationFrame: number | null = null;
    let resetSeenTimer: ReturnType<typeof setTimeout> | null = null;
    let nativeDetectionFailed = false;
    const seenTokens = new Set<string>();
    const seenValues = new Set<string>();

    const clearSeen = () => {
      seenTokens.clear();
      seenValues.clear();
      resetSeenTimer = null;
    };

    const handleDecodedValues = (values: string[]) => {
      if (resetSeenTimer !== null) {
        clearTimeout(resetSeenTimer);
        resetSeenTimer = null;
      }
      if (values.length === 0) {
        setQrDetected(false);
        resetSeenTimer = setTimeout(clearSeen, 500);
        return;
      }

      setQrDetected(values.some((value) => Boolean(normalizeCampusPassToken(value))));
      const newValues = values.filter((value) => {
        if (seenValues.has(value)) return false;
        seenValues.add(value);
        return true;
      });
      const tokens = getNewCampusPassTokens(values, seenTokens);
      for (const value of newValues) {
        if (!normalizeCampusPassToken(value)) {
          callbacks.current.onError("That QR code is not a CheckedIn student campus pass.");
        }
      }
      for (const token of tokens) callbacks.current.onToken(token);
    };

    const stopScanner = () => {
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const startHtml5Scanner = () => {
      if (cancelled || scanner) return;
      setNativeScanner(false);
      scanner = new Html5Qrcode("campus-pass-qr-reader", {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      });
      void scanner.start(
        { facingMode: "environment" },
        { fps: 8 },
        (decoded) => handleDecodedValues([decoded]),
        () => handleDecodedValues([]),
      ).then(() => {
        if (cancelled) {
          stopScanner();
          return;
        }
        setReady(true);
      }).catch((error: Error) => {
        if (!cancelled) callbacks.current.onError(error.message || "Allow camera access to scan a student pass.");
      });
    };

    const start = () => {
      if (cancelled) return;
      const BarcodeDetector = (window as BarcodeDetectorWindow).BarcodeDetector;
      let detector: BarcodeDetectorApi | null = null;
      if (BarcodeDetector) {
        try {
          detector = new BarcodeDetector({ formats: ["qr_code"] });
        } catch {
          detector = null;
        }
      }

      if (detector) {
        const activeDetector = detector;
        setNativeScanner(true);
        void (async () => {
          try {
            if (!navigator.mediaDevices?.getUserMedia) {
              throw new Error("Camera access requires a secure browser connection.");
            }
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: { facingMode: { ideal: "environment" } },
            });
            if (cancelled) {
              stream.getTracks().forEach((track) => track.stop());
              return;
            }

            const video = videoRef.current;
            if (!video) throw new Error("The camera preview is unavailable.");
            video.srcObject = stream;
            await video.play();
            if (cancelled) return;
            setReady(true);

            let detecting = false;
            const detectNextFrame = async () => {
              if (cancelled) return;
              if (!detecting && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                detecting = true;
                try {
                  const barcodes = await activeDetector.detect(video);
                  handleDecodedValues(barcodes.map((barcode) => barcode.rawValue));
                } catch {
                  if (!nativeDetectionFailed) {
                    nativeDetectionFailed = true;
                    stopScanner();
                    startHtml5Scanner();
                  }
                } finally {
                  detecting = false;
                }
              }
              if (!cancelled && !nativeDetectionFailed) {
                animationFrame = requestAnimationFrame(() => void detectNextFrame());
              }
            };
            animationFrame = requestAnimationFrame(() => void detectNextFrame());
          } catch (error) {
            stopScanner();
            if (!cancelled) {
              callbacks.current.onError(error instanceof Error ? error.message : "Allow camera access to scan student passes.");
            }
          }
        })();
        return;
      }

      startHtml5Scanner();
    };

    queueMicrotask(start);

    return () => {
      cancelled = true;
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      if (resetSeenTimer !== null) clearTimeout(resetSeenTimer);
      stopScanner();
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        className={`campus-pass-camera__video campus-pass-camera__video--mirrored ${nativeScanner ? "min-h-[280px] w-full object-cover" : "hidden"}`}
        muted
        playsInline
        aria-label="Camera scanning student campus passes"
      />
      <div
        id="campus-pass-qr-reader"
        className={`campus-pass-qr-reader campus-pass-qr-reader--mirrored ${nativeScanner ? "hidden" : "min-h-[280px] w-full"}`}
      />
      {ready && (
        <>
          <div className="campus-pass-camera__frame" aria-hidden="true">
            <span className="campus-pass-camera__scan-line" />
          </div>
          <p
            role="status"
            aria-live="polite"
            className={`absolute inset-x-0 bottom-0 z-10 p-3 text-center text-sm font-semibold text-white ${isSubmitting || qrDetected ? "bg-emerald-900/85" : "bg-black/65"}`}
          >
            {isSubmitting ? "Processing scan…" : qrDetected ? "QR detected — hold steady" : "Scanning for student passes…"}
          </p>
        </>
      )}
      {!ready && <p className="p-4 text-center text-sm text-white/70">Starting camera…</p>}
    </div>
  );
}

export function CampusPassAttendanceScanner({ events }: { events: CheckInEvent[] }) {
  const [eventId, setEventId] = useState("");
  const [pendingScans, setPendingScans] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const pendingTokens = useRef(new Set<string>());
  const submitting = pendingScans > 0;

  const scanToken = useCallback(async (token: string) => {
    if (!claimCampusPassScanToken(token, pendingTokens.current)) return;
    setPendingScans((count) => count + 1);
    setError(null);
    try {
      const { data, error: scanError } = await createClient().rpc("staff_scan_student_campus_pass", {
        p_event_id: eventId,
        p_student_pass_token: token,
      });
      if (scanError) {
        setError(scanError.message);
        return;
      }
      const result = parseCampusPassScanResult(data);
      if (!result) {
        setError("The check-in response was invalid. Please retry the scan.");
        return;
      }
      if (!result.success) {
        setError(result.error);
        return;
      }
      setScanResults((current) => [{ ...result, scannedAt: Date.now() }, ...current]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to record attendance. Please try again.");
    } finally {
      pendingTokens.current.delete(token);
      setPendingScans((count) => Math.max(0, count - 1));
    }
  }, [eventId]);

  const setScannerError = useCallback((message: string) => {
    setError(message);
  }, []);

  const selectedEvent = events.find((event) => event.id === eventId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.8fr)]">
      <section className="space-y-5 border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
        <div>
          <label htmlFor="campus-pass-event" className="block text-sm font-semibold text-[var(--text-strong)]">Choose an open event</label>
          <select
            id="campus-pass-event"
            value={eventId}
            disabled={submitting}
            onChange={(event) => {
              setEventId(event.target.value);
              setScanResults([]);
              setError(null);
            }}
            className="mt-2 min-h-12 w-full border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
          >
            <option value="">Select an event…</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
          {selectedEvent && (
            <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
              <Calendar size={16} aria-hidden="true" />
              {selectedEvent.venue_name ?? "Venue not set"} · {selectedEvent.allowed_year_levels.length ? `Years ${selectedEvent.allowed_year_levels.join(", ")}` : "All year levels"}
            </p>
          )}
        </div>

        {selectedEvent ? (
          <>
            <CampusPassCamera onToken={scanToken} onError={setScannerError} isSubmitting={submitting} />
            <p className="text-sm text-[var(--muted)]">Keep the camera pointed at student campus passes to scan one or more students. The first scan checks in; present that pass again after it leaves the camera view to check the student out.</p>
          </>
        ) : events.length ? (
          <div className="border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
            Select an open event to start the camera.
          </div>
        ) : (
          <div className="border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
            No published event currently has an open attendance window.
          </div>
        )}
      </section>

      <aside aria-live="polite" className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center bg-[var(--primary-soft)] text-[var(--primary)]">
            {scanResults.length ? <CircleCheck size={22} aria-hidden="true" /> : <QrCode size={22} aria-hidden="true" />}
          </span>
          <div>
            <h2 className="font-semibold text-[var(--text-strong)]">{scanResults.length ? "Scan results" : "Scan result"}</h2>
            <p className="text-sm text-[var(--muted)]">
              {submitting ? `Recording ${pendingScans} scan${pendingScans === 1 ? "" : "s"}…` : selectedEvent?.title ?? "Select an event"}
            </p>
          </div>
        </div>

        <UserErrorDialog message={error} />
        {scanResults.map((result, index) => (
          <div key={`${result.student.student_id}-${result.scannedAt}-${index}`} className="mt-5 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-lg font-semibold text-[var(--text-strong)]">{result.student.name}</p>
              <span className={`text-xs font-bold uppercase ${result.action === "checked_in" ? "text-[var(--success)]" : "text-[var(--muted)]"}`}>
                {result.action === "checked_in" ? "Checked in" : "Checked out"}
              </span>
            </div>
            <p className="font-semibold text-[var(--muted)]">Student ID · {result.student.student_id}</p>
            <p className="text-[var(--muted)]">
              {result.student.program}
              {result.student.year_level ? ` · Year ${result.student.year_level}` : ""}
              {result.student.section ? ` · ${result.student.section}` : ""}
            </p>
          </div>
        ))}
      </aside>
    </div>
  );
}
