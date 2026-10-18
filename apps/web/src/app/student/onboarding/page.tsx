"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { StudentTermsBody } from "@/components/student/StudentTermsBody";
import { ensureBrowserPermission, permissionCopy } from "@/lib/student/browser-permissions";
import { markStudentOnboardingComplete } from "@/lib/student/onboarding";
import { markStudentTermsAccepted } from "@/lib/student/terms";

const walkthrough = [
  { eyebrow: "Your campus companion", title: "Welcome to CheckedIn", body: "Your event pass, attendance history, and campus activities—kept in one calm, secure place.", icon: "✦", visual: "pass", bullets: ["See events that matter to you", "Keep attendance in one place", "Use the same account on web and mobile"] },
  { eyebrow: "Before you begin", title: "Get ready to register", body: "A few details help us keep attendance accurate and your account secure.", icon: "ID", visual: "id", bullets: ["Your physical student ID for a clear scan", "Your Student ID in the format 0XXX-XXXX", "Your school email and a secure password"] },
  { eyebrow: "Simple verification", title: "Check in with confidence", body: "The event QR guides you through a short, transparent verification process.", icon: "QR", visual: "qr", bullets: ["Scan the event QR shown at the venue", "Confirm your location and event OTP when required", "Take a live selfie, then receive clear confirmation"] },
] as const;

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [cameraGranted, setCameraGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const touchStart = useRef<number | null>(null);
  const totalSteps = walkthrough.length + 2;
  const onPermissionsStep = step === walkthrough.length;
  const onTermsStep = step === walkthrough.length + 1;
  const page = !onPermissionsStep && !onTermsStep ? walkthrough[step] : null;

  function move(nextStep: number) {
    if (nextStep < 0 || nextStep >= totalSteps || nextStep === step) return;
    setDirection(nextStep > step ? "next" : "previous");
    setStep(nextStep);
  }
  async function requestCamera() { setCameraGranted(await ensureBrowserPermission("camera")); }
  async function requestLocation() { setLocationGranted(await ensureBrowserPermission("location")); }
  function finish() { markStudentTermsAccepted(); markStudentOnboardingComplete(); router.replace("/student/login"); }
  function handleSwipeEnd(clientX: number) {
    if (touchStart.current === null || onTermsStep) return;
    const distance = clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) >= 56) move(distance < 0 ? step + 1 : step - 1);
  }

  return (
    <main className="student-onboarding min-h-dvh bg-[var(--background)] px-4 py-4 text-[var(--foreground)] sm:grid sm:place-items-center sm:p-8" onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => handleSwipeEnd(event.changedTouches[0]?.clientX ?? 0)}>
      <section className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg sm:min-h-[680px]">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div className="flex items-center gap-3"><BrandMark size={34} className="rounded-lg bg-[var(--action-foreground)] p-1" /><span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">CheckedIn</span></div><span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">{String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}</span></header>
        <div className="h-1 bg-[var(--surface-muted)]" aria-hidden="true"><div className="h-full bg-[var(--primary)] transition-[width] duration-300 ease-out" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>
        <div className="flex flex-1 flex-col px-5 pb-5 pt-6">
          <div key={step} className={`flex flex-1 flex-col ${direction === "next" ? "animate-[onboarding-next_280ms_ease-out]" : "animate-[onboarding-previous_280ms_ease-out]"}`}>
            {page && <WalkthroughPage page={page} />}
            {onPermissionsStep && <div className="flex flex-1 flex-col"><OnboardingVisual kind="permissions" icon="✓" /><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--success)]">Ready when you are</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">Set up device access</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Allow access now for a smoother registration and event check-in. You can change these in browser settings later.</p><div className="mt-6 space-y-3"><PermissionCard title="Camera" description={permissionCopy("camera").body} granted={cameraGranted} onAllow={() => void requestCamera()} /><PermissionCard title="Location" description={permissionCopy("location").body} granted={locationGranted} onAllow={() => void requestLocation()} /></div></div>}
            {onTermsStep && <div className="flex min-h-0 flex-1 flex-col"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--success)]">One last thing</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">Terms & privacy</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Please review how CheckedIn handles attendance and account information.</p><StudentTermsBody className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-lg border border-[var(--border)] p-4" /><label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--foreground)]"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]" />I have read and accept the Terms &amp; Privacy Notice.</label></div>}
          </div>
          <div className="mt-6"><div className="mb-5 flex items-center justify-center gap-1.5" aria-label={`Step ${step + 1} of ${totalSteps}`}>{Array.from({ length: totalSteps }).map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index === step ? "w-7 bg-[var(--primary)]" : "w-1.5 bg-[var(--border)]"}`} />)}</div><button type="button" disabled={onTermsStep && !termsAccepted} onClick={() => onTermsStep ? finish() : move(step + 1)} className="min-h-12 w-full rounded-lg bg-[var(--action-background)] px-4 text-sm font-semibold text-[var(--action-foreground)] transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45">{onTermsStep ? "I accept and continue" : step === 0 ? "Start registration" : "Continue"}</button><div className="mt-3 flex min-h-8 items-center justify-center">{onPermissionsStep ? <button type="button" onClick={() => move(step + 1)} className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--primary)] hover:underline">Skip permissions for now</button> : step > 0 && !onTermsStep ? <button type="button" onClick={() => move(step - 1)} className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--primary)] hover:underline">Back</button> : <span className="text-xs text-[var(--muted)]">Swipe to explore</span>}</div></div>
        </div>
      </section>
      <style jsx global>{`@keyframes onboarding-next { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } } @keyframes onboarding-previous { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } } @media (prefers-reduced-motion: reduce) { .animate-\\[onboarding-next_280ms_ease-out\\], .animate-\\[onboarding-previous_280ms_ease-out\\] { animation: none; } }`}</style>
    </main>
  );
}

function WalkthroughPage({ page }: { page: (typeof walkthrough)[number] }) { return <div className="flex flex-1 flex-col"><OnboardingVisual kind={page.visual} icon={page.icon} /><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">{page.eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">{page.title}</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{page.body}</p><ul className="mt-6 space-y-3">{page.bullets.map((item) => <li key={item} className="flex gap-3 text-sm leading-5 text-[var(--foreground)]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--success)_12%,var(--surface))] text-xs font-bold text-[var(--success)]">✓</span>{item}</li>)}</ul></div>; }
function OnboardingVisual({ kind, icon }: { kind: string; icon: string }) { return <div className="relative grid h-48 place-items-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]"><div className="absolute -right-9 -top-9 h-32 w-32 rounded-full border-[18px] border-[color-mix(in_srgb,var(--primary)_12%,var(--surface))]" /><div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[color-mix(in_srgb,var(--success)_12%,var(--surface))]" /><div className="relative grid h-24 w-24 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-2xl font-bold tracking-tight text-[var(--primary)] shadow-lg">{kind === "qr" ? <span className="grid grid-cols-3 gap-1">{Array.from({ length: 9 }).map((_, i) => <i key={i} className={`h-3 w-3 ${[0, 2, 4, 6, 8].includes(i) ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`} />)}</span> : icon}</div><span className="absolute bottom-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{kind === "pass" ? "Campus event pass" : kind === "id" ? "Verified student identity" : kind === "permissions" ? "Your control, your choice" : "QR attendance flow"}</span></div>; }
function PermissionCard({ title, description, granted, onAllow }: { title: string; description: string; granted: boolean; onAllow: () => void }) { return <div className="rounded-lg border border-[var(--border)] p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-[var(--text-strong)]">{title}</h2><p className="mt-1 text-sm leading-5 text-[var(--muted)]">{description}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${granted ? "bg-[color-mix(in_srgb,var(--success)_12%,var(--surface))] text-[var(--success)]" : "bg-[var(--surface-muted)] text-[var(--muted)]"}`}>{granted ? "Allowed" : "Optional"}</span></div><button type="button" disabled={granted} onClick={onAllow} className="mt-4 min-h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--surface-muted)] disabled:opacity-50">{granted ? "Camera allowed" : `Allow ${title.toLowerCase()}`}</button></div>; }
