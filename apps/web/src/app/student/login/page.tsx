"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { useLoader } from "@/components/LoaderProvider";
import {
  StudentErrorBanner,
  studentInputClass,
  studentPrimaryButtonClass,
  studentSecondaryButtonClass,
} from "@/components/student/StudentUi";
import {
  formatStudentIdInput,
  isValidStudentId,
  normalizeStudentId,
} from "@/lib/constants";
import { resolveStudentEmail } from "@/lib/student/api";
import { createClient } from "@/lib/supabase/client";

export default function StudentLoginPage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized =
      normalizeStudentId(studentId) ??
      (isValidStudentId(studentId.trim()) ? studentId.trim() : null);

    if (!normalized) {
      setError("Enter a valid Student ID (0XXX-XXXX).");
      return;
    }

    showLoader("Signing in…");
    try {
      const email = await resolveStudentEmail(normalized);
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (
          signInError.message.toLowerCase().includes("email not confirmed") ||
          signInError.message.toLowerCase().includes("not confirmed")
        ) {
          router.push(
            `/student/verify-email?email=${encodeURIComponent(email)}`,
          );
          return;
        }
        setError(signInError.message);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sign-in failed.");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, status")
        .eq("id", user.id)
        .single();

      if (profile?.status === "disabled") {
        await supabase.auth.signOut();
        setError("This account has been disabled.");
        return;
      }

      if (profile?.role !== "student") {
        router.push("/dashboard");
        return;
      }

      await supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id);

      router.push("/student");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      hideLoader();
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 py-10">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-6 flex justify-center">
          <BrandMark size={140} />
        </div>
        <p className="mb-10 text-center text-sm text-slate-500">
          Student Attendance
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Student ID
            </label>
            <input
              inputMode="numeric"
              autoComplete="username"
              required
              value={studentId}
              onChange={(e) => setStudentId(formatStudentIdInput(e.target.value))}
              placeholder="0123-4567"
              className={studentInputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={studentInputClass}
            />
          </div>

          {error && <StudentErrorBanner message={error} />}

          <button type="submit" className={studentPrimaryButtonClass}>
            Sign In
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-sm">
          <Link
            href="/student/forgot-password"
            className="block text-teal-600 hover:underline"
          >
            Forgot password?
          </Link>
          <Link href="/student/register" className={studentSecondaryButtonClass}>
            Create Account
          </Link>
          <Link
            href="/login"
            className="block pt-4 text-xs text-slate-400 hover:underline"
          >
            Staff portal
          </Link>
        </div>
      </div>
    </div>
  );
}
