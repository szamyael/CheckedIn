"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/student/QrScanner";
import {
  StudentErrorBanner,
  StudentPageTitle,
  studentPrimaryButtonClass,
} from "@/components/student/StudentUi";
import { useLoader } from "@/components/LoaderProvider";
import type { CheckInMeta } from "@/lib/student/api";
import { clearFlow, saveFlow } from "@/lib/student/attendance-flow";
import { createClient } from "@/lib/supabase/client";

export default function AttendanceScanPage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; body: string } | null>(
    null,
  );

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

        if (meta.can_check_out) {
          showLoader("Checking out…");
          const { data: outData, error: outErr } =
            await supabase.functions.invoke("check-out", {
              body: { qr_token: token },
            });
          if (outErr) throw new Error(outErr.message);
          const payload = outData as {
            success?: boolean;
            error?: string;
            event?: { title?: string };
          };
          if (!payload.success) {
            throw new Error(payload.error || "Check-out failed");
          }
          clearFlow();
          setResult({
            title: "Checked out",
            body: `Checked out of ${payload.event?.title ?? meta.title ?? "event"}. No OTP or selfie required.`,
          });
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

  return (
    <div className="space-y-4">
      <StudentPageTitle title="Scan Event QR" />
      <QrScanner onScan={(t) => void onScan(t)} onError={setError} />
      {error && <StudentErrorBanner message={error} />}
      <p className="text-center text-xs text-slate-500">
        Point your camera at the event QR. Scan once to check in, or again after
        check-in to check out.
      </p>
    </div>
  );
}
