"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { useLoader } from "@/components/LoaderProvider";
import { formPlaceholders } from "@/lib/form-placeholders";
import { createClient } from "@/lib/supabase/client";

function ResetCodeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = useMemo(() => params.get("email") ?? "", [params]);
  const masked = useMemo(
    () => params.get("masked") ?? email,
    [params, email],
  );
  const { showLoader, hideLoader } = useLoader();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
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
    showLoader("Updating password…");
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (otpError) throw otpError;
      const { error: updError } = await supabase.auth.updateUser({ password });
      if (updError) throw updError;
      await supabase.auth.signOut();
      router.push("/student/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      hideLoader();
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 py-10">
      <div className="mb-6 flex justify-center">
        <BrandMark size={72} />
      </div>
      <h1 className="text-xl font-bold">Enter reset code</h1>
      <p className="mt-2 text-sm text-slate-600">
        Code sent to <span className="font-medium">{masked}</span>
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          inputMode="numeric"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
          }
          placeholder={formPlaceholders.verificationCode}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={formPlaceholders.password}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
          required
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={formPlaceholders.confirmPassword}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
        >
          Update password
        </button>
      </form>
      <Link href="/student/login" className="mt-6 text-center text-sm text-teal-600">
        Back to sign in
      </Link>
    </div>
  );
}

export default function StudentForgotPasswordCodePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading…</div>}>
      <ResetCodeForm />
    </Suspense>
  );
}
