"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Calendar, CircleCheck, QrCode, RotateCw } from "@/lib/icons";
import { normalizeCampusPassToken } from "@/lib/campus-pass.mjs";
import { createClient } from "@/lib/supabase/client";

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

function parseScanResult(value: unknown): { success: true; student: ScanStudent } | { success: false; error: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  if (result.success === false && typeof result.error === "string") {
    return { success: false, error: result.error };
  }
  if (result.success !== true || !result.student || typeof result.student !== "object") return null;

  const student = result.student as Record<string, unknown>;
  if (
    typeof student.name !== "string" ||
    typeof student.student_id !== "string" ||
    typeof student.program !== "string" ||
    (student.year_level !== null && typeof student.year_level !== "number") ||
    (student.section !== null && typeof student.section !== "string")
  ) {
    return null;
  }

  return {
    success: true,
    student: {
      name: student.name,
      student_id: student.student_id,
      program: student.program,
      year_level: student.year_level,
      section: student.section,
    },
  };
}

function CampusPassCamera({
  onToken,
  onError,
}: {
  onToken: (token: string) => void;
  onError: (message: string) => void;
}) {
  const [ready, setReady] = useState(false);
  const callbacks = useRef({ onToken, onError });

  useEffect(() => {
    callbacks.current = { onToken, onError };
  }, [onError, onToken]);

  useEffect(() => {
    const scanner = new Html5Qrcode("campus-pass-qr-reader");
    let cancelled = false;
    let handled = false;

    const stop = () => {
      if (scanner.isScanning) void scanner.stop().catch(() => undefined);
    };

    void scanner.start(
      { facingMode: "environment" },
      { fps: 8, qrbox: { width: 240, height: 240 } },
      (decoded) => {
        if (handled || cancelled) return;
        handled = true;
        const token = normalizeCampusPassToken(decoded);
        stop();
        if (token) callbacks.current.onToken(token);
        else callbacks.current.onError("That QR code is not a CheckedIn student campus pass.");
      },
      () => undefined,
    ).then(() => {
      if (cancelled) {
        stop();
        return;
      }
      setReady(true);
    }).catch((error: Error) => {
      if (!cancelled) callbacks.current.onError(error.message || "Allow camera access to scan a student pass.");
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      <div id="campus-pass-qr-reader" className="min-h-[280px] w-full" />
      {!ready && <p className="p-4 text-center text-sm text-white/70">Starting camera…</p>}
    </div>
  );
}

export function CampusPassAttendanceScanner({ events }: { events: CheckInEvent[] }) {
  const [eventId, setEventId] = useState("");
  const [scanKey, setScanKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<ScanStudent | null>(null);

  const scanToken = useCallback(async (token: string) => {
    setSubmitting(true);
    setError(null);
    setStudent(null);
    try {
      const { data, error: scanError } = await createClient().rpc("staff_scan_student_campus_pass", {
        p_event_id: eventId,
        p_student_pass_token: token,
      });
      if (scanError) {
        setError(scanError.message);
        return;
      }
      const result = parseScanResult(data);
      if (!result) {
        setError("The check-in response was invalid. Please retry the scan.");
        return;
      }
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStudent(result.student);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to record attendance. Please try again.");
    } finally {
      setSubmitting(false);
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
              setStudent(null);
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
            <CampusPassCamera key={scanKey} onToken={scanToken} onError={setScannerError} />
            <p className="text-sm text-[var(--muted)]">Point the camera at the QR on the student’s campus pass. The server confirms event eligibility and prevents duplicate check-ins.</p>
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
            {student ? <CircleCheck size={22} aria-hidden="true" /> : <QrCode size={22} aria-hidden="true" />}
          </span>
          <div>
            <h2 className="font-semibold text-[var(--text-strong)]">{student ? "Student checked in" : "Scan result"}</h2>
            <p className="text-sm text-[var(--muted)]">{submitting ? "Recording attendance…" : selectedEvent?.title ?? "Select an event"}</p>
          </div>
        </div>

        {error && <p role="alert" className="mt-5 border border-[var(--error)]/30 bg-[var(--error)]/5 p-3 text-sm text-[var(--error)]">{error}</p>}
        {student && (
          <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
            <p className="text-lg font-semibold text-[var(--text-strong)]">{student.name}</p>
            <p className="text-[var(--muted)]">Student ID · {student.student_id}</p>
            <p className="text-[var(--muted)]">{student.program}{student.year_level ? ` · Year ${student.year_level}` : ""}{student.section ? ` · ${student.section}` : ""}</p>
          </div>
        )}
        {(student || error) && events.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setStudent(null);
              setError(null);
              setScanKey((key) => key + 1);
            }}
            className="mt-5 inline-flex min-h-11 items-center gap-2 border border-[var(--border)] px-4 text-sm font-semibold text-[var(--primary-strong)] hover:bg-[var(--primary-soft)]"
          >
            <RotateCw size={16} aria-hidden="true" /> Scan another student
          </button>
        )}
      </aside>
    </div>
  );
}
