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
    <main className="min-h-dvh bg-[#f6f7f5] px-4 py-4 text-[#202428] sm:grid sm:place-items-center sm:p-8" onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => handleSwipeEnd(event.changedTouches[0]?.clientX ?? 0)}>
      <section className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-[#e2e5e7] bg-white shadow-[0_18px_48px_rgba(12,34,56,0.08)] sm:min-h-[680px]">
        <header className="flex items-center justify-between border-b border-[#e2e5e7] px-5 py-4"><div className="flex items-center gap-3"><BrandMark size={34} /><span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17324d]">CheckedIn</span></div><span className="rounded-full border border-[#e2e5e7] px-2.5 py-1 text-xs font-medium text-[#697178]">{String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}</span></header>
        <div className="h-1 bg-[#edf0f1]" aria-hidden="true"><div className="h-full bg-[#17324d] transition-[width] duration-300 ease-out" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>
        <div className="flex flex-1 flex-col px-5 pb-5 pt-6">
          <div key={step} className={`flex flex-1 flex-col ${direction === "next" ? "animate-[onboarding-next_280ms_ease-out]" : "animate-[onboarding-previous_280ms_ease-out]"}`}>
            {page && <WalkthroughPage page={page} />}
            {onPermissionsStep && <div className="flex flex-1 flex-col"><OnboardingVisual kind="permissions" icon="✓" /><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f766e]">Ready when you are</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0c2238]">Set up device access</h1><p className="mt-3 text-sm leading-6 text-[#697178]">Allow access now for a smoother registration and event check-in. You can change these in browser settings later.</p><div className="mt-6 space-y-3"><PermissionCard title="Camera" description={permissionCopy("camera").body} granted={cameraGranted} onAllow={() => void requestCamera()} /><PermissionCard title="Location" description={permissionCopy("location").body} granted={locationGranted} onAllow={() => void requestLocation()} /></div></div>}
            {onTermsStep && <div className="flex min-h-0 flex-1 flex-col"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f766e]">One last thing</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0c2238]">Terms & privacy</h1><p className="mt-2 text-sm leading-6 text-[#697178]">Please review how CheckedIn handles attendance and account information.</p><StudentTermsBody className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-lg border border-[#e2e5e7] p-4" /><label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-5 text-[#3f484f]"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#17324d]" />I have read and accept the Terms &amp; Privacy Notice.</label></div>}
          </div>
          <div className="mt-6"><div className="mb-5 flex items-center justify-center gap-1.5" aria-label={`Step ${step + 1} of ${totalSteps}`}>{Array.from({ length: totalSteps }).map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index === step ? "w-7 bg-[#17324d]" : "w-1.5 bg-[#d9dee1]"}`} />)}</div><button type="button" disabled={onTermsStep && !termsAccepted} onClick={() => onTermsStep ? finish() : move(step + 1)} className="min-h-12 w-full rounded-lg bg-[#17324d] px-4 text-sm font-semibold text-white transition hover:bg-[#0c2238] focus:outline-none focus:ring-2 focus:ring-[#17324d] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45">{onTermsStep ? "I accept and continue" : step === 0 ? "Start registration" : "Continue"}</button><div className="mt-3 flex min-h-8 items-center justify-center">{onPermissionsStep ? <button type="button" onClick={() => move(step + 1)} className="text-sm font-medium text-[#697178] underline-offset-4 hover:underline">Skip permissions for now</button> : step > 0 && !onTermsStep ? <button type="button" onClick={() => move(step - 1)} className="text-sm font-medium text-[#697178] underline-offset-4 hover:underline">Back</button> : <span className="text-xs text-[#8a949b]">Swipe to explore</span>}</div></div>
        </div>
      </section>
      <style jsx global>{`@keyframes onboarding-next { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } } @keyframes onboarding-previous { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } } @media (prefers-reduced-motion: reduce) { .animate-\\[onboarding-next_280ms_ease-out\\], .animate-\\[onboarding-previous_280ms_ease-out\\] { animation: none; } }`}</style>
    </main>
  );
}

function WalkthroughPage({ page }: { page: (typeof walkthrough)[number] }) { return <div className="flex flex-1 flex-col"><OnboardingVisual kind={page.visual} icon={page.icon} /><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f766e]">{page.eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0c2238]">{page.title}</h1><p className="mt-3 text-sm leading-6 text-[#697178]">{page.body}</p><ul className="mt-6 space-y-3">{page.bullets.map((item) => <li key={item} className="flex gap-3 text-sm leading-5 text-[#3f484f]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e8f4f1] text-xs font-bold text-[#0f766e]">✓</span>{item}</li>)}</ul></div>; }
function OnboardingVisual({ kind, icon }: { kind: string; icon: string }) { return <div className="relative grid h-48 place-items-center overflow-hidden rounded-xl border border-[#d9e2e9] bg-[#edf4f7]"><div className="absolute -right-9 -top-9 h-32 w-32 rounded-full border-[18px] border-[#d8e8ee]" /><div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[#d8eee9]" /><div className="relative grid h-24 w-24 place-items-center rounded-xl border border-white/80 bg-white text-2xl font-bold tracking-tight text-[#17324d] shadow-[0_10px_24px_rgba(23,50,77,0.12)]">{kind === "qr" ? <span className="grid grid-cols-3 gap-1">{Array.from({ length: 9 }).map((_, i) => <i key={i} className={`h-3 w-3 ${[0, 2, 4, 6, 8].includes(i) ? "bg-[#17324d]" : "bg-[#5f8497]"}`} />)}</span> : icon}</div><span className="absolute bottom-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#587080]">{kind === "pass" ? "Campus event pass" : kind === "id" ? "Verified student identity" : kind === "permissions" ? "Your control, your choice" : "QR attendance flow"}</span></div>; }
function PermissionCard({ title, description, granted, onAllow }: { title: string; description: string; granted: boolean; onAllow: () => void }) { return <div className="rounded-lg border border-[#e2e5e7] p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-[#202428]">{title}</h2><p className="mt-1 text-sm leading-5 text-[#697178]">{description}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${granted ? "bg-[#e8f4f1] text-[#0f766e]" : "bg-[#f1f3f3] text-[#697178]"}`}>{granted ? "Allowed" : "Optional"}</span></div><button type="button" disabled={granted} onClick={onAllow} className="mt-4 min-h-11 w-full rounded-lg border border-[#cbd5da] px-3 text-sm font-semibold text-[#17324d] transition hover:bg-[#f6f7f5] disabled:opacity-50">{granted ? "Camera allowed" : `Allow ${title.toLowerCase()}`}</button></div>; }
