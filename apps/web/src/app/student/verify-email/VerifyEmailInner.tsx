"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { useLoader } from "@/components/LoaderProvider";
import { EMAIL_OTP_LENGTH } from "@/lib/constants";
import { formPlaceholders } from "@/lib/form-placeholders";
import { createClient } from "@/lib/supabase/client";
import {
  StudentErrorBanner,
  StudentInfoBanner,
  studentInputClass,
  studentPrimaryButtonClass,
} from "@/components/student/StudentUi";

export default function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = useMemo(() => params.get("email") ?? "", [params]);
  const { showLoader, hideLoader } = useLoader();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    showLoader("Verifying…");
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "signup",
      });
      if (otpError) throw otpError;
      router.push("/student");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      hideLoader();
    }
  }

  async function resend() {
    setMessage(null);
    setError(null);
    showLoader("Sending code…");
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (resendError) throw resendError;
      setMessage("A new code was sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      hideLoader();
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[var(--surface)] px-6 py-10 text-[var(--foreground)]">
      <div className="mb-6 flex justify-center">
        <BrandMark size={72} />
      </div>
      <h1 className="text-xl font-bold text-[var(--primary-strong)]">Verify email</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Enter the {EMAIL_OTP_LENGTH}-digit code sent to{" "}
        <span className="font-medium text-[var(--text-strong)]">{email || "your email"}</span>
        .
      </p>
      <form onSubmit={verify} className="mt-6 space-y-4">
        <input
          inputMode="numeric"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH))
          }
          placeholder={formPlaceholders.verificationCode}
          className={`${studentInputClass} text-center text-xl tracking-[0.4em]`}
          required
        />
        {error && <StudentErrorBanner message={error} />}
        {message && <StudentInfoBanner message={message} tone="teal" />}
        <button
          type="submit"
          className={studentPrimaryButtonClass}
        >
          Verify
        </button>
      </form>
      <button
        type="button"
        onClick={() => void resend()}
        className="mt-4 text-sm font-medium text-[var(--primary)]"
      >
        Resend code
      </button>
      <Link
        href="/student/login"
        className="mt-6 text-center text-sm text-[var(--muted)]"
      >
        Back to sign in
      </Link>
    </div>
  );
}
