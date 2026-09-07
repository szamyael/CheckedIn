"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/student/QrScanner";
import { PermissionBlockedCard } from "@/components/student/PermissionBlockedCard";
import {
  StudentErrorBanner,
  StudentPageTitle,
  studentPrimaryButtonClass,
} from "@/components/student/StudentUi";
import { useLoader } from "@/components/LoaderProvider";
import type { CheckInMeta } from "@/lib/student/api";
import { isPermissionErrorMessage } from "@/lib/student/browser-permissions";
import { clearFlow, saveFlow } from "@/lib/student/attendance-flow";
import { createClient } from "@/lib/supabase/client";

export default function AttendanceScanPage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [error, setError] = useState<string | null>(null);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const [result, setResult] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [exitChoice, setExitChoice] = useState<{ token: string; title: string } | null>(null);

  const recordExit = useCallback(async (action: "break_out" | "check_out", token: string, title: string) => {
    setExitChoice(null);
    setError(null);
    showLoader(action === "break_out" ? "Recording break-out…" : "Checking out…");
    try {
      const supabase = createClient();
      const functionName = action === "break_out" ? "attendance-break" : "check-out";
      const { data, error: actionError } = await supabase.functions.invoke(functionName, {
        body: action === "break_out" ? { qr_token: token, action } : { qr_token: token },
      });
      if (actionError) throw new Error(actionError.message);
      const payload = data as { success?: boolean; error?: string; event?: { title?: string } };
      if (!payload.success) throw new Error(payload.error || "Attendance update failed");
      clearFlow();
      const eventTitle = payload.event?.title ?? title;
      setResult(action === "break_out"
        ? { title: "Break started", body: `Your break-out from ${eventTitle} is recorded. Scan the event QR again when you return.` }
        : { title: "Checked out", body: `Checked out of ${eventTitle}. No OTP or selfie required.` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attendance update failed");
      setScanKey((key) => key + 1);
    } finally {
      hideLoader();
    }
  }, [hideLoader, showLoader]);

  const onScan = useCallback(
    async (token: string) => {
      setError(null);
      showLoader("Checking attendance…");
      try {
        const supabase = createClient();
        const { data, error: fnError } = await supabase.functions.invoke(
          "event-check-in-meta",
          { body: { qr_token: token } },
        );
        if (fnError) throw new Error(fnError.message);
        const meta = data as CheckInMeta;
        if (meta.error && !meta.id) throw new Error(meta.error);

        if (meta.already_checked_out) {
          setResult({
            title: "Already checked out",
            body: `You already checked out of ${meta.title ?? "this event"}.`,
          });
          return;
        }

        if (meta.can_break_in) {
          showLoader("Recording break-in…");
          const { data: breakData, error: breakErr } = await supabase.functions.invoke("attendance-break", {
            body: { qr_token: token, action: "break_in" },
          });
          if (breakErr) throw new Error(breakErr.message);
          const payload = breakData as { success?: boolean; error?: string; event?: { title?: string } };
          if (!payload.success) throw new Error(payload.error || "Break-in failed");
          clearFlow();
          setResult({ title: "Welcome back", body: `You are checked back in to ${payload.event?.title ?? meta.title ?? "the event"}.` });
          return;
        }

        if (meta.can_check_out || meta.can_break_out) {
          setExitChoice({ token, title: meta.title ?? "this event" });
          return;
        }

        saveFlow({
          qrToken: token,
          eventId: meta.id,
          eventTitle: meta.title,
          requiresOtp: meta.requires_otp === true,
        });
        router.push("/student/attendance/location");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scan failed");
      } finally {
        hideLoader();
      }
    },
    [hideLoader, router, showLoader],
  );

  if (result) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-3xl text-teal-600">
          ✓
        </div>
        <h1 className="text-xl font-bold">{result.title}</h1>
        <p className="text-sm text-slate-600">{result.body}</p>
        <button
          type="button"
          onClick={() => router.push("/student")}
          className={studentPrimaryButtonClass}
        >
          Back to home
        </button>
      </div>
    );
  }

  if (exitChoice) {
    return (
      <div className="space-y-5">
        <StudentPageTitle title={exitChoice.title} subtitle="Choose the attendance action that matches your plans." />
        <div className="border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="font-semibold text-[var(--primary-strong)]">Leaving temporarily?</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Record a break for lunch or a short exit. Scan the QR again when you return.</p>
          <button type="button" onClick={() => void recordExit("break_out", exitChoice.token, exitChoice.title)} className={`${studentPrimaryButtonClass} mt-5 w-full`}>Break out</button>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="font-semibold text-[var(--primary-strong)]">Leaving for the day?</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Check out to close your attendance for this event.</p>
          <button type="button" onClick={() => void recordExit("check_out", exitChoice.token, exitChoice.title)} className="mt-5 w-full border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--primary-strong)] hover:bg-[var(--primary-soft)]">Check out</button>
        </div>
        <button type="button" onClick={() => { setExitChoice(null); setScanKey((key) => key + 1); }} className="w-full text-sm font-medium text-[var(--muted)]">Cancel and scan again</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StudentPageTitle title="Scan Event QR" />
      {cameraBlocked ? (
        <PermissionBlockedCard
          permission="camera"
          onRetry={() => {
            setCameraBlocked(false);
            setError(null);
            setScanKey((k) => k + 1);
          }}
        />
      ) : (
        <QrScanner
          key={scanKey}
          onScan={(t) => void onScan(t)}
          onError={(message) => {
            setError(message);
            if (isPermissionErrorMessage(message)) setCameraBlocked(true);
          }}
        />
      )}
      {error && !cameraBlocked && <StudentErrorBanner message={error} />}
      <p className="text-center text-xs text-slate-500">
        Point your camera at the event QR. Scan once to check in, or again after
        check-in, choose a temporary break, or check out for the day.
      </p>
    </div>
  );
}
