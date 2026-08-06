"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { useLoader } from "@/components/LoaderProvider";
import { createClient } from "@/lib/supabase/client";

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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 py-10">
      <div className="mb-6 flex justify-center">
        <BrandMark size={72} />
      </div>
      <h1 className="text-xl font-bold">Verify email</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the 6-digit code sent to{" "}
        <span className="font-medium text-slate-800">{email || "your email"}</span>
        .
      </p>
      <form onSubmit={verify} className="mt-6 space-y-4">
        <input
          inputMode="numeric"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="000000"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xl tracking-[0.4em]"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-teal-600">{message}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
        >
          Verify
        </button>
      </form>
      <button
        type="button"
        onClick={() => void resend()}
        className="mt-4 text-sm text-teal-600"
      >
        Resend code
      </button>
      <Link
        href="/student/login"
        className="mt-6 text-center text-sm text-slate-500"
      >
        Back to sign in
      </Link>
    </div>
  );
}
