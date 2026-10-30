"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, CalendarDays, ChevronRight, Megaphone, QrCode, Sparkles, TicketCheck } from "@/lib/icons";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { UserErrorDialog } from "@/components/UserErrorDialog";

type StudentSummary = {
  name: string;
  firstName: string;
  studentId: string;
  program: string;
  yearLevel: number | null;
  section: string | null;
  avatarUrl: string | null;
  campusPassToken: string | null;
  attended: number;
  points: number;
  badges: number;
};

type BulletinItem = { id: string; title: string; body: string; created_at: string };

export default function StudentHomePage() {
  const [summary, setSummary] = useState<StudentSummary>({
    name: "Student", firstName: "Student", studentId: "—", program: "Program not set", yearLevel: null, section: null, avatarUrl: null, campusPassToken: null, attended: 0, points: 0, badges: 0,
  });
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [campusPassError, setCampusPassError] = useState<string | null>(null);
  const [passFlipped, setPassFlipped] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [qrExpanded, setQrExpanded] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(motionPreference.matches);
    updateMotionPreference();
    motionPreference.addEventListener("change", updateMotionPreference);
    return () => motionPreference.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (!qrExpanded) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQrExpanded(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [qrExpanded]);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: student }, { count: attended }, { count: badges }, { data: announcements }, { data: campusPassToken, error: campusPassTokenError }] = await Promise.all([
        supabase.from("students").select("first_name, middle_name, last_name, student_id, program, year_level, section, reward_points, profile_photo_url").eq("id", user.id).single(),
        supabase.from("attendance_records").select("*", { count: "exact", head: true }).eq("student_id", user.id).in("status", ["checked_in", "late", "excused", "checked_out"]),
        supabase.from("student_achievements").select("*", { count: "exact", head: true }).eq("student_id", user.id),
        supabase.from("notifications").select("id, title, body, created_at").eq("user_id", user.id).eq("notification_type", "general").order("created_at", { ascending: false }).limit(3),
        supabase.rpc("get_my_campus_pass_token"),
      ]);
      if (campusPassTokenError) setCampusPassError("Campus pass QR could not be loaded. Please try again later.");
      let avatarUrl: string | null = null;
      if (student?.profile_photo_url) {
        const { data: signedAvatar } = await supabase.storage.from("student-ids").createSignedUrl(student.profile_photo_url, 3600);
        avatarUrl = signedAvatar?.signedUrl ?? null;
      }
      const firstName = student?.first_name ?? "Student";
      setSummary({
        name: [student?.first_name, student?.middle_name, student?.last_name].filter(Boolean).join(" ") || "Student",
        firstName,
        studentId: student?.student_id ?? "—",
        program: student?.program ?? "Program not set",
        yearLevel: student?.year_level ?? null,
        section: student?.section ?? null,
        avatarUrl,
        campusPassToken: campusPassTokenError ? null : campusPassToken,
        attended: attended ?? 0,
        points: student?.reward_points ?? 0,
        badges: badges ?? 0,
      });
      setBulletins((announcements ?? []) as BulletinItem[]);
    }
    void load();
  }, []);

  return (
    <div className="student-dashboard mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
      <UserErrorDialog message={campusPassError} />
      <header className="col-span-full flex items-end justify-between gap-4">
        <div><p className="text-sm text-[var(--muted)]">Good morning,</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">{summary.name}.</h1></div>
        <Link href="/student/events" className="hidden min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-[var(--primary-strong)] transition hover:bg-[var(--primary-soft)] sm:inline-flex">View events <ChevronRight size={16} aria-hidden="true" /></Link>
      </header>

      <section className="space-y-3 lg:col-span-2">
        <div className="relative h-[300px] w-full [perspective:1000px] sm:h-[320px]">
          <div
            className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:transition-none"
            style={{ transform: passFlipped && !reducedMotion ? "rotateY(180deg)" : undefined }}
          >
            <button
              type="button"
              aria-pressed={passFlipped}
              aria-label="Show student identification"
              aria-hidden={passFlipped}
              disabled={passFlipped}
              onClick={() => setPassFlipped(true)}
              className={`absolute inset-0 flex w-full flex-col justify-between overflow-hidden rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-pink)] p-6 text-left text-[var(--foreground)] [backface-visibility:hidden] sm:p-8 ${reducedMotion && passFlipped ? "pointer-events-none opacity-0" : ""}`}
            >
              <span className="relative max-w-[calc(100%-7rem)] sm:max-w-[calc(100%-9rem)]">
                <span className="block font-mono text-xs font-semibold tracking-[0.14em] text-[var(--muted)]">YOUR CAMPUS PASS</span>
                <span className="mt-2 block text-2xl font-semibold tracking-tight sm:text-3xl">{summary.name}</span>
                <span className="mt-2 block font-mono text-xs font-semibold tracking-[0.1em] text-[var(--muted)]">STUDENT ID</span>
                <span className="mt-1 block font-mono text-xl font-bold tracking-[0.06em] text-[var(--foreground)] sm:text-2xl">{summary.studentId}</span>
              </span>
              <span className="relative flex flex-col gap-2 pr-28 text-sm text-[var(--muted)] sm:pr-36">
                <span>
                  <span className="block">{summary.program}{summary.yearLevel ? ` · ${summary.yearLevel}${summary.yearLevel === 1 ? "st" : summary.yearLevel === 2 ? "nd" : summary.yearLevel === 3 ? "rd" : "th"} Year` : ""}</span>
                  {summary.section && <span className="mt-1 block">Section · {summary.section}</span>}
                  <span className="mt-3 block font-mono text-xs font-semibold tracking-wide text-[var(--foreground)]">TAP CARD TO VIEW STUDENT ID</span>
                </span>
              </span>
            </button>
            <div
              aria-hidden={!passFlipped}
              className={`absolute inset-0 overflow-hidden rounded-[3px] border border-[var(--retro-border)] bg-[var(--surface)] p-5 text-[var(--foreground)] ${reducedMotion ? "transform-none" : "[transform:rotateY(180deg)]"} [backface-visibility:hidden] transition-opacity duration-150 motion-reduce:transition-none sm:p-8 ${reducedMotion && !passFlipped ? "pointer-events-none opacity-0" : ""}`}
            >
              <button type="button" aria-label="Show campus pass front" disabled={!passFlipped} onClick={() => setPassFlipped(false)} className="absolute inset-0 z-0 cursor-pointer rounded-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-[var(--primary)]" />
              <div aria-hidden="true" className="pointer-events-none absolute right-5 top-5 z-[1] text-[var(--primary)]/10 sm:right-8 sm:top-7">
                <QrCode size={100} strokeWidth={1} />
              </div>
              <span className="pointer-events-none absolute inset-y-0 left-5 right-36 z-[1] flex flex-col justify-center sm:left-8 sm:right-44">
                <span className="block border-b border-[var(--border)] pb-2 text-xs font-semibold tracking-[0.14em] text-[var(--muted)]">STUDENT IDENTIFICATION</span>
                <span className="mt-4 flex items-center gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)] font-semibold text-[var(--primary-strong)]">
                    {summary.avatarUrl ? <Image src={summary.avatarUrl} alt="" width={56} height={56} unoptimized className="h-full w-full object-cover" /> : summary.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-semibold">{summary.name}</span>
                  </span>
                </span>
                <span className="mt-3 block text-xs font-semibold tracking-[0.14em] text-[var(--muted)]">STUDENT ID</span>
                <span className="mt-1 block truncate font-mono text-xl font-bold tracking-[0.1em] text-[var(--primary-strong)]">{summary.studentId}</span>
                <span className="mt-5 block text-sm leading-6 text-[var(--muted)]">{summary.program}{summary.yearLevel ? ` · Year ${summary.yearLevel}` : ""}{summary.section ? ` · ${summary.section}` : ""}</span>
                <span className="mt-4 block text-xs font-medium text-[var(--primary)]">TAP CARD TO RETURN TO CAMPUS PASS</span>
              </span>
              <button
                type="button"
                aria-label="Enlarge student QR code"
                disabled={!passFlipped || !summary.campusPassToken}
                onClick={() => setQrExpanded(true)}
                className="absolute right-5 top-1/2 z-10 grid h-28 w-28 -translate-y-1/2 place-items-center rounded-[3px] border border-[var(--retro-border)] bg-white p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-default sm:right-8 sm:h-32 sm:w-32"
              >
                {summary.campusPassToken
                  ? <QRCodeSVG value={summary.campusPassToken} size={112} level="M" aria-label={`Student QR code for ${summary.name}`} className="h-full w-full" />
                  : <span className="px-2 text-center text-xs text-[var(--muted)]">Student QR is not available.</span>}
              </button>
            </div>
            {!passFlipped && (
              <Link href="/student/attendance/scan" aria-label="Scan event QR" className="absolute right-5 top-1/2 z-10 grid h-28 w-28 -translate-y-1/2 place-items-center rounded-[3px] border border-[var(--retro-border)] bg-white p-3 text-center text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:right-8 sm:h-32 sm:w-32">
                <span className="flex flex-col items-center gap-2"><QrCode size={40} aria-hidden="true" /><span>Scan event QR</span></span>
              </Link>
            )}
          </div>
        </div>
        {qrExpanded && summary.campusPassToken && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6" role="dialog" aria-modal="true" aria-label={`Student QR code for ${summary.name}`} onClick={() => setQrExpanded(false)}>
            <button type="button" aria-label="Close full-screen QR code" onClick={() => setQrExpanded(false)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-3xl leading-none text-white hover:bg-white/25">×</button>
            <div className="w-full max-w-md border border-[var(--retro-border)] bg-white p-5" onClick={(event) => event.stopPropagation()}>
              <QRCodeSVG value={summary.campusPassToken} size={360} level="M" aria-hidden="true" className="h-auto w-full" />
              <p className="mt-3 text-center text-sm font-medium text-slate-700">{summary.name} · {summary.studentId}</p>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:col-span-1">
        {[
          { label: "Events attended", value: summary.attended, icon: TicketCheck },
          { label: "Reward points", value: summary.points, icon: Sparkles },
          { label: "Achievements", value: summary.badges, icon: Award },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="student-card student-stat-card border p-4">
            <Icon size={18} className="text-[var(--primary)]" aria-hidden="true" />
            <p className="mt-5 text-2xl font-semibold tracking-tight text-[var(--text-strong)]">{value}</p>
            <p className="mt-1 text-xs font-medium text-[var(--muted)]">{label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-[1.15fr_.85fr] lg:col-span-2">
        <Link href="/student/attendance/scan" className="student-card student-action-card group border p-5 transition hover:shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)]"><QrCode size={21} aria-hidden="true" /></div><ChevronRight size={19} className="text-[var(--muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></div>
          <p className="mt-7 text-xs font-semibold tracking-[0.12em] text-[var(--muted)]">ATTENDANCE</p><h2 className="mt-2 text-lg font-semibold text-[var(--text-strong)]">Scan event QR</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Check in to an event with a secure QR scan and transparent verification.</p>
        </Link>
        <Link href="/student/bingo" className="student-card student-action-card group border bg-[var(--retro-lavender)] p-5 transition hover:shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--warning)_16%,var(--surface))] text-[var(--warning)]"><Sparkles size={20} aria-hidden="true" /></div><ChevronRight size={19} className="text-[var(--muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></div>
          <p className="mt-7 text-xs font-semibold tracking-[0.12em] text-[var(--muted)]">ENGAGEMENT</p><h2 className="mt-2 text-lg font-semibold text-[var(--text-strong)]">Your Bingo progress</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Check your published cards and see what participation can unlock next.</p>
        </Link>
      </section>

      <section className="student-card student-bulletin-card overflow-hidden border lg:col-span-1">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2 text-[var(--text-strong)]"><Megaphone size={19} className="text-[var(--primary)]" aria-hidden="true" /><h2 className="font-semibold">Bulletin board</h2></div>
          <Link href="/student/notifications" className="min-h-11 rounded-lg px-3 py-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-soft)]">View all</Link>
        </div>
        {bulletins.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[var(--muted)]">No announcements right now. Check back soon.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {bulletins.map((item) => (
              <Link key={item.id} href="/student/notifications" className="block px-5 py-4 hover:bg-[var(--primary-soft)]">
                <div className="flex items-start justify-between gap-4"><h3 className="font-semibold text-[var(--text-strong)]">{item.title}</h3><time className="shrink-0 text-xs text-[var(--muted)]">{new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></div>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Link href="/student/events" className="flex min-h-14 items-center justify-between border border-[var(--retro-border)] bg-[var(--retro-mint)] px-4 py-4 text-sm transition hover:shadow-[var(--shadow-card)] lg:col-span-3"><span className="flex items-center gap-2 font-semibold text-[var(--foreground)]"><CalendarDays size={18} aria-hidden="true" />Find your next event</span><ChevronRight size={18} className="text-[var(--muted)]" aria-hidden="true" /></Link>
    </div>
  );
}
