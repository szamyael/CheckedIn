"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "@/lib/icons";
import { BootstrapGate } from "@/components/BootstrapGate";
import { BrandLogo, BrandMark } from "@/components/BrandLogo";
import { PhoneStudentRedirect } from "@/components/student/PhoneStudentRedirect";
import { formPlaceholders } from "@/lib/form-placeholders";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { createClient } from "@/lib/supabase/client";
import { UserErrorDialog } from "@/components/UserErrorDialog";
import {
  StudentAccountDecisionDialog,
  type StudentAccountDecision,
} from "@/components/student/StudentAccountDecisionDialog";

export default function LoginPage() {
  const router = useRouter();
  const run = useAsyncAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [accountDecision, setAccountDecision] = useState<StudentAccountDecision | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await run("Signing in…", async () => {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) return setError(signInError.message);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return setError("Your session could not be created. Please try again.");

        const { data: profile, error: profileError } = await supabase
          .from("users").select("status, role, account_status_reason").eq("id", user.id).single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          return setError("Your account profile could not be loaded. Contact an administrator.");
        }
        if (profile.role === "student" && profile.status === "needs_reregistration") {
          setAccountDecision({
            status: "needs_reregistration",
            reason: profile.account_status_reason,
          });
          return;
        }
        if (profile.role === "student" && profile.status !== "active") {
          await supabase.auth.signOut();
          setAccountDecision({
            status: profile.status,
            reason: profile.account_status_reason,
          });
          return;
        }
        if (profile.status !== "active") {
          await supabase.auth.signOut();
          const reason = profile.account_status_reason ? ` Reason: ${profile.account_status_reason}` : "";
          return setError(profile.status === "pending"
            ? "Your account is still under review. Contact your program's organization to settle your account status."
            : profile.status === "suspended"
              ? `Your account is banned. Contact an administrator to request a ban review.${reason}`
              : `Your account is suspended. Contact your program's organization to settle your account status.${reason}`);
        }

        router.push(profile.role === "student" ? "/student" : "/dashboard");
        router.refresh();
      });
    } catch {
      setError("Sign in failed. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] lg:grid lg:grid-cols-[minmax(420px,44%)_1fr]">
      <StudentAccountDecisionDialog decision={accountDecision} onClose={() => setAccountDecision(null)} />
      <PhoneStudentRedirect />

      <section className="staff-login-hero relative hidden overflow-hidden bg-[var(--action-background)] px-10 py-10 text-[var(--action-foreground)] lg:flex lg:flex-col xl:px-16">
        <div className="absolute -bottom-28 -right-28 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute bottom-16 right-16 h-36 w-36 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <BrandMark size={42} className="rounded-lg bg-white p-1.5" />
          <div><p className="text-lg font-semibold tracking-tight">CheckedIn</p><p className="text-xs text-[var(--action-foreground)]/75">Campus attendance platform</p></div>
        </div>
        <div className="relative my-auto max-w-md pb-12 pt-24">
          <p className="mb-5 inline-flex items-center gap-2 border border-[color-mix(in_srgb,var(--action-foreground)_20%,transparent)] bg-[color-mix(in_srgb,var(--action-foreground)_6%,transparent)] px-3 py-1.5 text-xs font-medium tracking-wide text-[var(--action-foreground)]/85"><ShieldCheck size={15} aria-hidden="true" /> STAFF OPERATIONS PORTAL</p>
          <h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Attendance, clearly in hand.</h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-[var(--action-foreground)]/75">Manage events, monitor check-ins, and keep campus participation moving.</p>
          <div className="mt-12 border-l border-[var(--accent)] pl-5"><p className="text-sm font-medium text-[var(--action-foreground)]">Built for campus operations</p><p className="mt-1 text-sm leading-6 text-[var(--action-foreground)]/75">One secure workspace for administrators, faculty, and organization teams.</p></div>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-[var(--action-foreground)]/70"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />Secure staff access</div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[420px]">
          <Link
            href="/"
            className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-[var(--primary)] transition hover:text-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to home
          </Link>
          <div className="mb-10 lg:hidden"><BrandLogo className="h-12 w-auto max-w-[215px]" priority /></div>
          <div className="mb-8">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] lg:hidden"><Building2 size={21} aria-hidden="true" /></div>
            <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[var(--muted)]">STAFF PORTAL</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-strong)]">Welcome back</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Sign in to continue to the CheckedIn staff workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="staff-email" className="mb-2 block text-sm font-semibold">Work email</label>
              <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                <input id="staff-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent)]/25" placeholder={formPlaceholders.email} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-4"><label htmlFor="staff-password" className="text-sm font-semibold">Password</label><Link href="/forgot-password" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-strong)] hover:underline">Forgot password?</Link></div>
              <div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                <input id="staff-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-12 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent)]/25" placeholder={formPlaceholders.password} />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
              </div>
            </div>
            <UserErrorDialog message={error} />
            <button type="submit" className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--action-background)] px-4 py-3 text-sm font-semibold text-[var(--action-foreground)] shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60">Sign in to staff portal <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></button>
          </form>

          <div className="mt-8 border-t border-[var(--border)] pt-6 text-center"><p className="text-sm text-[var(--muted)]">Looking for the student portal? <Link href="/student/login" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-strong)] hover:underline">Sign in as a student</Link></p></div>
          <p className="mt-8 text-center text-xs leading-5 text-[var(--muted)]">Authorized staff only. Your access is protected and monitored.</p>
          <BootstrapGate />
        </div>
      </section>
    </main>
  );
}
