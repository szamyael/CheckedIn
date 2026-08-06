"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadFlow, saveFlow } from "@/lib/student/attendance-flow";

export default function AttendanceOtpPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [title, setTitle] = useState("Event");

  useEffect(() => {
    const flow = loadFlow();
    if (!flow?.qrToken || !flow.locationVerified) {
      router.replace("/student/attendance/scan");
      return;
    }
    setRequiresOtp(flow.requiresOtp === true);
    setTitle(flow.eventTitle ?? "Event");
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
    });
    router.push("/student/attendance/selfie");
  }

  return (
    <div className="flex min-h-[60vh] flex-col space-y-4">
      <h1 className="text-xl font-bold">Step 2 of 3 — OTP</h1>
      <p className="text-sm text-slate-600">{title}</p>
      {requiresOtp ? (
        <>
          <p className="text-sm text-slate-600">
            Enter the attendance OTP shown by your instructor.
          </p>
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
            }
            placeholder="OTP code"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-lg tracking-widest"
          />
        </>
      ) : (
        <p className="text-sm text-slate-600">
          This event does not require an OTP. Continue to selfie verification.
        </p>
      )}
      <button
        type="button"
        onClick={continueNext}
        disabled={requiresOtp && code.trim().length < 4}
        className="mt-auto rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
