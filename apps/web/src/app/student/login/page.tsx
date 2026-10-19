"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from "@/lib/icons";
import { BrandMark } from "@/components/BrandLogo";
import { useLoader } from "@/components/LoaderProvider";
import { formPlaceholders } from "@/lib/form-placeholders";
import { StudentErrorBanner } from "@/components/student/StudentUi";
import { formatStudentIdInput, isValidStudentId, normalizeStudentId } from "@/lib/constants";
import { resolveStudentEmail } from "@/lib/student/api";
import { isStudentOnboardingComplete } from "@/lib/student/onboarding";
import { isStudentTermsAccepted } from "@/lib/student/terms";
import { createClient } from "@/lib/supabase/client";
import {
  StudentAccountDecisionDialog,
  type StudentAccountDecision,
} from "@/components/student/StudentAccountDecisionDialog";

export default function StudentLoginPage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountDecision, setAccountDecision] = useState<StudentAccountDecision | null>(null);
  const [openingRegister, setOpeningRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSuspendedSession() {
      if (new URLSearchParams(window.location.search).get("resubmitted") === "1") {
        // The review status is pending again; applicant can sign in after approval.
        setSuccess("Your updated registration was submitted for review.");
      }

      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError) {
        setError("Could not verify your account status. Please try again.");
        return;
      }

      if (session) {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (authError) {
          setError("Could not verify your account status. Please try again.");
          return;
        }

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("role, status, account_status_reason")
            .eq("id", user.id)
            .maybeSingle();
          if (cancelled) return;
          if (profileError) {
            setError("Your account profile could not be loaded. Contact an administrator.");
            return;
          }
          if (profile?.role === "student" && profile.status === "suspended") {
            setAccountDecision({
              status: profile.status,
              reason: profile.account_status_reason,
            });
            const { error: signOutError } = await supabase.auth.signOut();
            if (!cancelled && signOutError) {
              setError("Could not sign out automatically. Please close this message and try again.");
            }
            return;
          }
        }
      }

      if (!isStudentOnboardingComplete()) {
        router.replace("/student/onboarding");
        return;
      }
      if (!isStudentTermsAccepted()) router.replace("/student/terms");
    }

    void checkSuspendedSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function goToRegister() {
    if (openingRegister) return;
    setOpeningRegister(true);
    setError(null);
    try {
      await createClient().auth.signOut();
      router.push("/student/register");
    } catch {
      setError("Could not open registration. Please try again.");
    } finally {
      setOpeningRegister(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizeStudentId(studentId) ?? (isValidStudentId(studentId.trim()) ? studentId.trim() : null);
    if (!normalized) {
      setError("Enter a valid Student ID (0XXX-XXXX).");
      return;
    }

    showLoader("Signing in…");
    try {
      const email = await resolveStudentEmail(normalized);
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed") || signInError.message.toLowerCase().includes("not confirmed")) {
          router.push(`/student/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(signInError.message);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Sign-in failed.");
        return;
      }
      const { data: profile } = await supabase.from("users").select("role, status, account_status_reason").eq("id", user.id).single();
      if (profile?.role === "student" && profile.status === "needs_reregistration") {
        setAccountDecision({
          status: "needs_reregistration",
          reason: profile.account_status_reason,
        });
        return;
      }
      if (profile?.status !== "active") {
        await supabase.auth.signOut();
        if (profile?.role === "student" && profile?.status === "suspended") {
          setAccountDecision({ status: "suspended", reason: profile.account_status_reason });
          return;
        }
        const reason = profile?.account_status_reason ? ` Reason: ${profile.account_status_reason}` : "";
        setError(profile?.status === "pending"
          ? "Your account is still under review. Contact your program's organization to settle your account status."
          : profile?.status === "suspended"
            ? `Your account is banned. Contact an administrator to request a ban review.${reason}`
            : `Your account is suspended. Contact your program's organization to settle your account status.${reason}`);
        return;
      }
      if (profile?.role !== "student") {
        router.push("/dashboard");
        return;
      }

      await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
      router.push("/student");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      hideLoader();
    }
  }

  return (
    <main className="auth-theme min-h-dvh bg-[var(--background)] text-[var(--foreground)] lg:grid lg:grid-cols-[minmax(390px,43%)_1fr]">
      <StudentAccountDecisionDialog decision={accountDecision} onClose={() => setAccountDecision(null)} />
      <section className="relative hidden overflow-hidden bg-[var(--action-background)] px-10 py-10 text-[var(--action-foreground)] lg:flex lg:flex-col xl:px-16">
        <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3"><BrandMark size={42} className="rounded-lg bg-white p-1" /><span className="text-lg font-semibold tracking-tight">CheckedIn</span></div>
        <div className="relative my-auto max-w-md py-16">
          <p className="inline-flex items-center gap-2 border border-[color-mix(in_srgb,var(--action-foreground)_20%,transparent)] bg-[color-mix(in_srgb,var(--action-foreground)_6%,transparent)] px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-[var(--action-foreground)]/85"><ShieldCheck size={15} aria-hidden="true" />STUDENT PORTAL</p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Your campus life, checked in.</h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-[var(--action-foreground)]/75">Discover events, record attendance, and make every campus experience count.</p>
          <div className="mt-12 border-l border-[var(--accent)] pl-5"><p className="text-sm font-semibold">Made for participation</p><p className="mt-1 text-sm leading-6 text-[var(--action-foreground)]/75">Check-ins can help build your event history, points, and Bingo progress.</p></div>
        </div>
        <p className="relative text-xs text-[var(--action-foreground)]/70">A secure university attendance platform</p>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-5 py-9 sm:px-8 lg:px-12">
        <div className="w-full max-w-[410px]">
          <div className="mb-8 text-center lg:hidden"><BrandMark size={76} className="mx-auto rounded-xl bg-[var(--primary-soft)] p-2" /><p className="mt-3 text-sm font-semibold tracking-tight text-[var(--primary)]">CheckedIn</p></div>
          {success && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)]">STUDENT PORTAL</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">Welcome back</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Sign in with your Student ID to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="student-id" className="mb-2 block text-sm font-semibold text-[var(--text-strong)]">Student ID</label>
              <input id="student-id" inputMode="numeric" autoComplete="username" required value={studentId} onChange={(e) => setStudentId(formatStudentIdInput(e.target.value))} placeholder={formPlaceholders.studentId} className="min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent)]/25" />
              <p className="mt-2 text-xs text-[var(--muted)]">Use the ID printed on your university record.</p>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-4"><label htmlFor="student-password" className="text-sm font-semibold text-[var(--text-strong)]">Password</label><Link href="/student/forgot-password" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-strong)] hover:underline">Forgot password?</Link></div>
              <div className="relative"><KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" /><input id="student-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={formPlaceholders.password} className="min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-12 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent)]/25" /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>
            </div>
            {error && <StudentErrorBanner message={error} />}
            <button type="submit" className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--action-background)] px-4 py-3 text-sm font-semibold text-[var(--action-foreground)] shadow-sm hover:brightness-95">Sign in <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></button>
          </form>

          <div className="mt-7 border-y border-[var(--border)] py-5 text-center"><p className="text-sm text-[var(--muted)]">New to CheckedIn?</p><button type="button" disabled={openingRegister} onClick={() => void goToRegister()} className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 text-sm font-semibold text-[var(--primary)] hover:border-[var(--primary)] disabled:opacity-60">{openingRegister ? "Opening registration…" : "Create student account"}</button></div>
          <Link href="/login" className="mt-6 block text-center text-xs font-medium text-[var(--muted)] hover:text-[var(--primary)] hover:underline">Staff member? Open the staff portal</Link>
        </div>
      </section>
    </main>
  );
}
