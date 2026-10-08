"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { IdCardCameraCapture } from "@/components/student/IdCardCameraCapture";
import { useLoader } from "@/components/LoaderProvider";
import {
  formatStudentIdInput,
  isValidStudentId,
  normalizeStudentId,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { compressImageToJpegBase64 } from "@/lib/student/compress-image";
import { cropIdFaceToBase64 } from "@/lib/student/id-face-crop";
import { isStudentOnboardingComplete } from "@/lib/student/onboarding";
import {
  clearRegistrationDraft,
  emptyRegistrationDraft,
  loadRegistrationDraft,
  loadRegistrationStep,
  readFunctionError,
  saveRegistrationDraft,
  type RegistrationDraft,
} from "@/lib/student/registration-draft";
import { formPlaceholders } from "@/lib/form-placeholders";
import { isStudentTermsAccepted } from "@/lib/student/terms";

export default function StudentRegisterPage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<RegistrationDraft>(emptyRegistrationDraft);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isResubmission, setIsResubmission] = useState(false);
  const [decisionReason, setDecisionReason] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const saved = loadRegistrationDraft();
    if (saved) {
      // Restore browser-persisted draft after hydration to avoid SSR/client mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(saved);
      setStep(loadRegistrationStep());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const resubmissionRequested = new URLSearchParams(window.location.search).get("resubmit") === "1";
    if (!resubmissionRequested && !isStudentOnboardingComplete()) {
      router.replace("/student/onboarding");
      return;
    }
    if (!resubmissionRequested && !isStudentTermsAccepted()) {
      router.replace("/student/terms");
      return;
    }

    async function prepareResubmission() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/student/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("email, role, status, account_status_reason")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "student" || profile.status !== "needs_reregistration") {
        router.replace("/student/login");
        return;
      }

      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("student_id, first_name, middle_name, last_name, name_extension, program, year_level, section")
        .eq("id", user.id)
        .single();
      if (studentError || !student) {
        setError("Your student application could not be loaded. Contact an administrator.");
        return;
      }

      clearRegistrationDraft();
      setDraft({
        ...emptyRegistrationDraft(),
        studentId: student.student_id,
        email: profile.email ?? user.email ?? "",
        firstName: student.first_name,
        middleName: student.middle_name ?? "",
        lastName: student.last_name,
        nameExtension: student.name_extension ?? "",
        program: student.program,
        yearLevel: student.year_level ?? 1,
        section: student.section ?? "",
      });
      setIsResubmission(true);
      setDecisionReason(profile.account_status_reason);
    }

    async function clearOrphanAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) await supabase.auth.signOut();
    }

    if (resubmissionRequested) void prepareResubmission();
    else void clearOrphanAuth();
  }, [router, hydrated]);

  useEffect(() => {
    if (!hydrated || step === 1) return;
    saveRegistrationDraft(draft, step);
  }, [draft, step, hydrated]);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error]);

  async function onIdFile(file: File | null) {
    if (!file) return;
    setError(null);
    setScanningId(true);
    showLoader("Scanning ID…");
    try {
      const image_base64 = await compressImageToJpegBase64(file, {
        maxSide: 1280,
        quality: 0.78,
      });
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "scan-student-id",
        { body: { image_base64 } },
      );
      if (fnError) {
        throw new Error(await readFunctionError(fnError, data));
      }
      const parsed = data as {
        student_id?: string;
        first_name?: string;
        middle_name?: string;
        last_name?: string;
        name_extension?: string;
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

      const avatarBase64 = await cropIdFaceToBase64(image_base64);

      const nextDraft: RegistrationDraft = {
        ...emptyRegistrationDraft(),
        email: isResubmission ? draft.email : "",
        studentId: sid,
        firstName: parsed.first_name ?? "",
        middleName: parsed.middle_name ?? "",
        lastName: parsed.last_name ?? "",
        nameExtension: parsed.name_extension ?? "",
        program: parsed.program ?? "",
        imageBase64: image_base64,
        avatarBase64: avatarBase64 ?? "",
        avatarFromId: Boolean(avatarBase64),
      };
      setDraft(nextDraft);
      saveRegistrationDraft(nextDraft, 2);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ID scan failed");
    } finally {
      setScanningId(false);
      hideLoader();
    }
  }

  async function onAvatarFile(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const avatarBase64 = await compressImageToJpegBase64(file, {
        maxSide: 640,
        quality: 0.82,
      });
      setDraft((d) => ({ ...d, avatarBase64, avatarFromId: false }));
    } catch {
      setError("Could not read that photo. Try another image.");
    }
  }

  async function completeRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    if (!isResubmission && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!isResubmission && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!draft.imageBase64) {
      setError("ID card photo missing. Go back and scan your ID again.");
      return;
    }

    setSubmitting(true);
    showLoader(isResubmission ? "Submitting registration…" : "Creating account…");
    const email = draft.email.trim().toLowerCase();

    try {
      const supabase = createClient();
      let userId: string;
      if (isResubmission) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user || user.email?.toLowerCase() !== email) {
          throw new Error("Sign in with the same account that received the re-registration request.");
        }
        userId = user.id;
      } else {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        const user = signUpData.user;
        if (!user?.id) {
          throw new Error("Registration failed. Please try again.");
        }
        if (!user.identities?.length) {
          throw new Error(
            "This email is already registered. Sign in or use forgot password.",
          );
        }
        userId = user.id;

        // New applications are submitted without keeping an authenticated session.
        await supabase.auth.signOut();
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "complete-student-registration",
        {
          body: {
            user_id: userId,
            email,
            student_id: draft.studentId,
            first_name: (draft.firstName ?? "").trim(),
            middle_name: (draft.middleName ?? "").trim() || null,
            last_name: (draft.lastName ?? "").trim(),
            name_extension: (draft.nameExtension ?? "").trim() || null,
            program: (draft.program ?? "").trim(),
            section: (draft.section ?? "").trim() || null,
            year_level: draft.yearLevel,
            image_base64: draft.imageBase64,
            avatar_base64: draft.avatarBase64 || null,
          },
        },
      );
      if (fnError) {
        throw new Error(await readFunctionError(fnError, data));
      }
      const payload = data as { error?: string; success?: boolean };
      if (payload?.error) throw new Error(payload.error);

      if (isResubmission) {
        await supabase.auth.signOut();
        clearRegistrationDraft();
        router.replace("/student/login?resubmitted=1");
      } else {
        try {
          await supabase.auth.resend({
            type: "signup",
            email,
          });
        } catch {
          // Account is already created; verification email may already be sent.
        }

        clearRegistrationDraft();
        router.replace(
          `/student/verify-email?email=${encodeURIComponent(email)}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-teal-500/30 border-t-teal-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 py-8">
      <div className="mb-6 flex justify-center">
        <BrandMark size={72} />
      </div>
      <h1 className="text-xl font-bold">
        {isResubmission ? "Re-submit student registration" : "Create student account"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">Step {step} of 3</p>
      {isResubmission && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>Update and submit your application again.</p>
          {decisionReason && <p className="mt-1">Admin remarks: {decisionReason}</p>}
        </div>
      )}

      {step === 1 && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-600">
            Use your camera to capture a clear photo of your student ID card.
            Your browser will ask for camera access.
          </p>
          <IdCardCameraCapture
            disabled={scanningId}
            onCapture={(file) => void onIdFile(file)}
          />
        </div>
      )}

      {step === 2 && (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !draft.email.trim() ||
              !draft.firstName.trim() ||
              !draft.lastName.trim() ||
              !draft.program.trim()
            ) {
              setError("Fill in all required fields.");
              return;
            }
            setError(null);
            saveRegistrationDraft(draft, 3);
            setStep(3);
          }}
        >
          <p className="text-sm text-slate-600">
            Names are read from the line above your course/program (e.g. Juan
            T. Tamad). Edit typos if needed. Student ID is locked.
          </p>
          <div className="rounded-2xl border border-slate-200 p-4 text-center">
            {draft.avatarBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/jpeg;base64,${draft.avatarBase64}`}
                alt="Profile"
                className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-teal-200"
              />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-teal-50 text-sm text-teal-800">
                No photo
              </div>
            )}
            <p className="mt-3 text-sm font-medium text-slate-900">
              Profile picture (optional)
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {draft.avatarFromId
                ? "Cropped from your ID photo. You can replace it below."
                : "Take a photo or upload one from your device."}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700"
              >
                Take photo
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700"
              >
                Upload
              </button>
            </div>
            {draft.avatarBase64 && (
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    avatarBase64: "",
                    avatarFromId: false,
                  }))
                }
                className="mt-2 text-xs text-slate-500 underline"
              >
                Remove photo
              </button>
            )}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                void onAvatarFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void onAvatarFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
          <Field label="Student ID" value={draft.studentId} readOnly />
          <Field
            label="Email"
            value={draft.email}
            onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
            type="email"
            required
            readOnly={isResubmission}
            placeholder={formPlaceholders.email}
          />
          <Field
            label="First name"
            value={draft.firstName}
            onChange={(v) => setDraft((d) => ({ ...d, firstName: v }))}
            required
            placeholder={formPlaceholders.firstName}
          />
          <Field
            label="Middle name"
            value={draft.middleName}
            onChange={(v) => setDraft((d) => ({ ...d, middleName: v }))}
            placeholder={formPlaceholders.middleName}
          />
          <Field
            label="Last name"
            value={draft.lastName}
            onChange={(v) => setDraft((d) => ({ ...d, lastName: v }))}
            required
            placeholder={formPlaceholders.lastName}
          />
          <Field
            label="Name extension"
            value={draft.nameExtension}
            onChange={(v) => setDraft((d) => ({ ...d, nameExtension: v }))}
            placeholder={formPlaceholders.nameExtension}
          />
          <Field
            label="Program"
            value={draft.program}
            onChange={(v) => setDraft((d) => ({ ...d, program: v }))}
            required
            placeholder={formPlaceholders.program}
          />
          <Field
            label="Section"
            value={draft.section}
            onChange={(v) => setDraft((d) => ({ ...d, section: v }))}
            placeholder={formPlaceholders.section}
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
            type="button"
            onClick={() => {
              setError(null);
              setStep(1);
            }}
            className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700"
          >
            Back to ID scan
          </button>
          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
          >
            Continue
          </button>
        </form>
      )}

      {step === 3 && (
        <form className="mt-6 space-y-3" onSubmit={(e) => void completeRegistration(e)}>
          <p className="text-sm text-slate-600">
            {isResubmission
              ? `Review and re-submit your application for Student ID ${draft.studentId}.`
              : `Set a password for Student ID ${draft.studentId}.`}
          </p>
          {!isResubmission && <>
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              required
              autoComplete="new-password"
              placeholder={formPlaceholders.password}
            />
            <Field
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              type="password"
              required
              autoComplete="new-password"
              placeholder={formPlaceholders.confirmPassword}
            />
          </>}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep(2);
            }}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting
              ? isResubmission ? "Submitting…" : "Creating account…"
              : isResubmission ? "Re-submit application" : "Create account"}
          </button>
        </form>
      )}

      {error && (
        <p
          ref={errorRef}
          className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600"
        >
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
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        required={required}
        readOnly={readOnly}
        autoComplete={autoComplete}
        placeholder={placeholder}
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
