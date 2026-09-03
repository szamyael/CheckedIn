"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BootstrapGate } from "@/components/BootstrapGate";
import { BrandMark } from "@/components/BrandLogo";
import { PhoneStudentRedirect } from "@/components/student/PhoneStudentRedirect";
import { formPlaceholders } from "@/lib/form-placeholders";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const run = useAsyncAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await run("Signing in…", async () => {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Your session could not be created. Please try again.");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("status, role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          setError("Your account profile could not be loaded. Contact an administrator.");
          return;
        }

        if (profile?.status === "disabled") {
          await supabase.auth.signOut();
          setError("This account has been disabled.");
          return;
        }

        if (profile?.status === "pending") {
          await supabase.auth.signOut();
          setError("Your account is pending admin approval.");
          return;
        }

        if (profile?.role === "student") {
          router.push("/student");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      });
    } catch {
      setError("Sign in failed. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-10">
      <PhoneStudentRedirect />
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandMark size={160} className="drop-shadow-lg" />
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl">
          <div className="mb-6 text-center">
            <p className="text-sm text-slate-300">
              Admin, Faculty &amp; Organization Portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder={formPlaceholders.email}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder={formPlaceholders.password}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-500"
            >
              Sign in
            </button>

            <p className="text-center text-sm">
              <a
                href="/forgot-password"
                className="text-teal-400 hover:underline"
              >
                Forgot password?
              </a>
            </p>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Students:{" "}
            <Link
              href="/student/login"
              className="text-teal-400 hover:underline"
            >
              open the student portal
            </Link>
          </p>

          <BootstrapGate />
        </div>
      </div>
    </div>
  );
}
