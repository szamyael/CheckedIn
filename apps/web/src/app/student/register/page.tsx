"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { PermissionBlockedCard } from "@/components/student/PermissionBlockedCard";
import { useLoader } from "@/components/LoaderProvider";
import {
  formatStudentIdInput,
  isValidStudentId,
  normalizeStudentId,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cropIdFaceToBase64 } from "@/lib/student/id-face-crop";
import { isStudentOnboardingComplete } from "@/lib/student/onboarding";
import { isStudentTermsAccepted } from "@/lib/student/terms";

type Draft = {
  studentId: string;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  program: string;
  section: string;
  yearLevel: number;
  imageBase64: string;
  avatarBase64: string;
};

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default function StudentRegisterPage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    studentId: "",
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
    program: "",
    section: "",
    yearLevel: 1,
    imageBase64: "",
    avatarBase64: "",
  });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [cameraBlocked, setCameraBlocked] = useState(false);

  useEffect(() => {
    if (!isStudentOnboardingComplete()) {
      router.replace("/student/onboarding");
      return;
    }
    if (!isStudentTermsAccepted()) {
      router.replace("/student/terms");
    }
  }, [router]);

  async function onIdFile(file: File | null) {
    if (!file) return;
    setError(null);
      showLoader("Scanning ID…");
    try {
      const image_base64 = await fileToBase64(file);
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "scan-student-id",
        { body: { image_base64 } },
      );
      if (fnError) throw new Error(fnError.message);
      const parsed = data as {
        student_id?: string;
        first_name?: string;
        middle_name?: string;
        last_name?: string;
        program?: string;
        error?: string;
      };
      if (parsed.error) throw new Error(parsed.error);
      const sid =
        normalizeStudentId(parsed.student_id ?? "") ??
        parsed.student_id ??
        "";
      if (!isValidStudentId(sid)) {
        throw new Error(
          "Could not read a valid Student ID (0XXX-XXXX). Retake the photo.",
        );
      }

      showLoader("Detecting ID photo…");
      const avatar_base64 = (await cropIdFaceToBase64(image_base64)) ?? "";

      setDraft((d) => ({
        ...d,
        studentId: sid,
        firstName: parsed.first_name ?? d.firstName,
        middleName: parsed.middle_name ?? d.middleName,
        lastName: parsed.last_name ?? d.lastName,
        program: parsed.program ?? d.program,
        imageBase64: image_base64,
        avatarBase64: avatar_base64,
      }));
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ID scan failed");
    } finally {
      hideLoader();
    }
  }

  async function completeRegistration(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    showLoader("Creating account…");
    try {
      const supabase = createClient();
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: draft.email.trim(),
          password,
        });
      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Registration failed");

      const { data, error: fnError } = await supabase.functions.invoke(
        "complete-student-registration",
        {
          body: {
            user_id: userId,
            email: draft.email.trim(),
            student_id: draft.studentId,
            first_name: draft.firstName.trim(),
            middle_name: draft.middleName.trim() || null,
            last_name: draft.lastName.trim(),
            program: draft.program.trim(),
            section: draft.section.trim() || null,
            year_level: draft.yearLevel,
            image_base64: draft.imageBase64,
            avatar_base64: draft.avatarBase64 || null,
          },
        },
      );
      if (fnError) throw new Error(fnError.message);
      const payload = data as { error?: string };
      if (payload?.error) throw new Error(payload.error);

      await supabase.auth.resend({
        type: "signup",
        email: draft.email.trim(),
      });

      router.push(
        `/student/verify-email?email=${encodeURIComponent(draft.email.trim())}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      hideLoader();
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 py-8">
      <div className="mb-6 flex justify-center">
        <BrandMark size={72} />
      </div>
      <h1 className="text-xl font-bold">Create student account</h1>
      <p className="mt-1 text-sm text-slate-500">Step {step} of 3</p>

      {step === 1 && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-600">
            Upload or capture a photo of your student ID card. Your browser will
            ask for camera access if you choose to take a photo.
          </p>
          {cameraBlocked && (
            <PermissionBlockedCard
              permission="camera"
              onRetry={() => setCameraBlocked(false)}
            />
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              setCameraBlocked(false);
              void onIdFile(e.target.files?.[0] ?? null);
            }}
            className="w-full text-sm"
          />
        </div>
      )}

      {step === 2 && (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.email.trim() || !draft.firstName.trim() || !draft.lastName.trim() || !draft.program.trim()) {
              setError("Fill in all required fields.");
              return;
            }
            setError(null);
            setStep(3);
          }}
        >
          <p className="text-sm text-slate-600">
            We filled these from your ID. Edit any typos — only Student ID is locked.
            {draft.avatarBase64 ? " Your ID photo was saved as your profile picture." : ""}
          </p>
          {draft.avatarBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/jpeg;base64,${draft.avatarBase64}`}
              alt="Detected ID photo"
              className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-teal-200"
            />
          )}
          <Field label="Student ID" value={draft.studentId} readOnly />
          <Field
            label="Email"
            value={draft.email}
            onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
            type="email"
            required
          />
          <Field
            label="First name"
            value={draft.firstName}
            onChange={(v) => setDraft((d) => ({ ...d, firstName: v }))}
            required
          />
          <Field
            label="Middle name"
            value={draft.middleName}
            onChange={(v) => setDraft((d) => ({ ...d, middleName: v }))}
          />
          <Field
            label="Last name"
            value={draft.lastName}
            onChange={(v) => setDraft((d) => ({ ...d, lastName: v }))}
            required
          />
          <Field
            label="Program"
            value={draft.program}
            onChange={(v) => setDraft((d) => ({ ...d, program: v }))}
            required
          />
          <Field
            label="Section"
            value={draft.section}
            onChange={(v) => setDraft((d) => ({ ...d, section: v }))}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Year level</label>
            <select
              value={draft.yearLevel}
              onChange={(e) =>
                setDraft((d) => ({ ...d, yearLevel: Number(e.target.value) }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            >
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
          >
            Continue
          </button>
        </form>
      )}

      {step === 3 && (
        <form className="mt-6 space-y-3" onSubmit={completeRegistration}>
          <p className="text-sm text-slate-600">
            Set a password for Student ID {draft.studentId}.
          </p>
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            required
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            type="password"
            required
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
          >
            Create account
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Link
        href="/student/login"
        className="mt-6 text-center text-sm text-teal-600"
      >
        Already have an account? Sign in
      </Link>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        required={required}
        readOnly={readOnly}
        value={value}
        onChange={(e) => {
          if (!onChange) return;
          if (label === "Student ID") {
            onChange(formatStudentIdInput(e.target.value));
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm read-only:bg-slate-100"
      />
    </div>
  );
}
