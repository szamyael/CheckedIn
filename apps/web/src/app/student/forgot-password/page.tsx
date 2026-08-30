"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { useLoader } from "@/components/LoaderProvider";
import { formPlaceholders } from "@/lib/form-placeholders";
import {
  formatStudentIdInput,
  isValidStudentId,
  normalizeStudentId,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function ForgotPasswordForm() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [studentId, setStudentId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized =
      normalizeStudentId(studentId) ??
      (isValidStudentId(studentId.trim()) ? studentId.trim() : null);
    if (!normalized) {
      setError("Enter a valid Student ID (0XXX-XXXX).");
      return;
    }
    if (!file) {
      setError("Capture or upload your student ID card.");
      return;
    }

    showLoader("Verifying ID…");
    try {
      const image_base64 = await fileToBase64(file);
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "student-verify-reset",
        { body: { student_id: normalized, image_base64 } },
      );
      if (fnError) throw new Error(fnError.message);
      const payload = data as {
        email?: string;
        masked_email?: string;
        error?: string;
      };
      if (!payload.email) {
        throw new Error(payload.error || "Could not verify student ID");
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: payload.email,
        options: { shouldCreateUser: false },
      });
      if (otpError) throw otpError;

      router.push(
        `/student/forgot-password/code?email=${encodeURIComponent(payload.email)}&masked=${encodeURIComponent(payload.masked_email ?? payload.email)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      hideLoader();
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 py-10">
      <div className="mb-6 flex justify-center">
        <BrandMark size={72} />
      </div>
      <h1 className="text-xl font-bold">Reset password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Scan your student ID to verify your identity. We will send a reset code
        to the email on your account.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Student ID</label>
          <input
            inputMode="numeric"
            value={studentId}
            onChange={(e) => setStudentId(formatStudentIdInput(e.target.value))}
            placeholder={formPlaceholders.studentId}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ID card photo</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
        >
          Send reset code
        </button>
      </form>
      <Link href="/student/login" className="mt-6 text-center text-sm text-teal-600">
        Back to sign in
      </Link>
    </div>
  );
}

export default function StudentForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading…</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
