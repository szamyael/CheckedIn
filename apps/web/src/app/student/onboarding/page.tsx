"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { StudentTermsBody } from "@/components/student/StudentTermsBody";
import {
  ensureBrowserPermission,
  permissionCopy,
} from "@/lib/student/browser-permissions";
import { markStudentOnboardingComplete } from "@/lib/student/onboarding";
import { markStudentTermsAccepted } from "@/lib/student/terms";

const walkthrough = [
  {
    title: "Welcome to CheckedIn",
    body: "Register once, join campus events, and record attendance with QR codes from your phone or browser.",
    bullets: [
      "View upcoming events and attendance history",
      "Earn bingo badges when you check in",
      "Same account works on web and mobile",
    ],
  },
  {
    title: "What you need to register",
    body: "Have these ready before creating your account:",
    bullets: [
      "Physical student ID card (for a clear photo)",
      "Valid Student ID number (format 0XXX-XXXX)",
      "School email address on file with your institution",
      "A secure password for sign-in",
    ],
  },
  {
    title: "How check-in works",
    body: "At an event, attendance follows a short verified flow:",
    bullets: [
      "Scan the event QR code at the venue",
      "Verify GPS location inside the event geofence",
      "Enter the one-time code (OTP) if required",
      "Take a live selfie to confirm presence",
    ],
  },
];

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const totalSteps = walkthrough.length + 2;
  const onPermissionsStep = step === walkthrough.length;
  const onTermsStep = step === walkthrough.length + 1;

  async function requestCamera() {
    const ok = await ensureBrowserPermission("camera");
    setCameraGranted(ok);
  }

  async function requestLocation() {
    const ok = await ensureBrowserPermission("location");
    setLocationGranted(ok);
  }

  function finish() {
    markStudentTermsAccepted();
    markStudentOnboardingComplete();
    router.replace("/student/login");
  }

  function next() {
    if (step < walkthrough.length + 1) {
      setStep((s) => s + 1);
      return;
    }
    finish();
  }

  const page = onPermissionsStep || onTermsStep ? null : walkthrough[step];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <BrandMark size={40} />
        <span className="text-xs text-slate-500">
          {step + 1} / {totalSteps}
        </span>
      </div>

      {page && (
        <>
          <h1 className="text-xl font-bold text-slate-900">{page.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{page.body}</p>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            {page.bullets.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-teal-600">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {onPermissionsStep && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-slate-900">Device permissions</h1>
          <p className="text-sm text-slate-600">
            CheckedIn needs camera and location access to register you and verify
            attendance. You can change these anytime in your browser settings.
          </p>

          <PermissionCard
            title="Camera"
            description={permissionCopy("camera").body}
            granted={cameraGranted}
            onAllow={() => void requestCamera()}
          />
          <PermissionCard
            title="Location"
            description={permissionCopy("location").body}
            granted={locationGranted}
            onAllow={() => void requestLocation()}
          />

          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            If you block access, we will ask again when you register, scan a QR
            code, or check in.
          </p>
        </div>
      )}

      {onTermsStep && (
        <div className="flex min-h-0 flex-1 flex-col">
          <StudentTermsBody className="flex-1 overflow-y-auto pr-1" />
          <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-slate-100 pt-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600"
            />
            <span>I have read and accept the Terms &amp; Privacy Notice</span>
          </label>
        </div>
      )}

      <div className="mt-auto space-y-2 pt-8">
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-teal-600" : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={onTermsStep && !termsAccepted}
          onClick={() => {
            if (onTermsStep) finish();
            else next();
          }}
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {onTermsStep
            ? "I accept and continue"
            : onPermissionsStep
              ? "Continue"
              : "Continue"}
        </button>

        {onPermissionsStep ? (
          <button
            type="button"
            onClick={next}
            className="w-full py-2 text-sm text-slate-500"
          >
            Skip permissions for now
          </button>
        ) : step > 0 && !onTermsStep ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="w-full py-2 text-sm text-slate-500"
          >
            Back
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PermissionCard({
  title,
  description,
  granted,
  onAllow,
}: {
  title: string;
  description: string;
  granted: boolean;
  onAllow: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {granted && <span className="text-sm text-teal-600">Allowed</span>}
      </div>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <button
        type="button"
        disabled={granted}
        onClick={onAllow}
        className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
      >
        {granted ? "Allowed" : "Allow"}
      </button>
    </div>
  );
}
