"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadFlow, saveFlow } from "@/lib/student/attendance-flow";
import { StudentErrorBanner, StudentStepIndicator, studentInputClass, studentPrimaryButtonClass } from "@/components/student/StudentUi";

export default function AttendanceOtpPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [title, setTitle] = useState("Event");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const flow = loadFlow();
    if (!flow?.qrToken || !flow.locationVerified) {
      router.replace("/student/attendance/scan");
      return;
    }
    // Restore per-tab attendance state after navigation; sessionStorage is client-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRequiresOtp(flow.requiresOtp === true);
    setTitle(flow.eventTitle ?? "Event");
    setError(flow.otpError);
  }, [router]);

  function continueNext() {
    const flow = loadFlow();
    if (!flow) {
      router.replace("/student/attendance/scan");
      return;
    }
    if (requiresOtp && code.trim().length < 4) return;
    saveFlow({
      ...flow,
      otpCode: requiresOtp ? code.trim() : undefined,
      otpError: undefined,
    });
    router.push("/student/attendance/selfie");
  }

  return (
    <div className="flex min-h-[60vh] flex-col space-y-4">
      <StudentStepIndicator current={3} />
      <h1 className="text-xl font-bold text-[var(--text-strong)]">Attendance OTP</h1>
      <p className="text-sm text-[var(--muted)]">{title}</p>
      {error && (
        <StudentErrorBanner message={`${error} Enter the latest OTP announced at the event, then continue.`} />
      )}
      {requiresOtp ? (
        <>
          <p className="text-sm text-[var(--muted)]">
            Enter the attendance OTP shown by your instructor.
          </p>
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
            }
            aria-label="Attendance OTP"
            placeholder="Enter OTP code"
            className={`${studentInputClass} text-center text-lg tracking-widest`}
          />
        </>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          This event does not require an OTP. Continue to selfie verification.
        </p>
      )}
      <button
        type="button"
        onClick={continueNext}
        disabled={requiresOtp && code.trim().length < 4}
        className={`${studentPrimaryButtonClass} mt-auto`}
      >
        Continue
      </button>
    </div>
  );
}
