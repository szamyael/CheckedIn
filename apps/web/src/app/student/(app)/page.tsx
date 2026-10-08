"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CalendarDays, ChevronRight, Megaphone, QrCode, Sparkles, TicketCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type StudentSummary = {
  name: string;
  studentId: string;
  program: string;
  yearLevel: number | null;
  attended: number;
  points: number;
  badges: number;
};

type BulletinItem = { id: string; title: string; body: string; created_at: string };

export default function StudentHomePage() {
  const [summary, setSummary] = useState<StudentSummary>({
    name: "Student", studentId: "—", program: "Program not set", yearLevel: null, attended: 0, points: 0, badges: 0,
  });
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: student }, { count: attended }, { count: badges }, { data: announcements }] = await Promise.all([
        supabase.from("students").select("first_name, student_id, program, year_level, reward_points").eq("id", user.id).single(),
        supabase.from("attendance_records").select("*", { count: "exact", head: true }).eq("student_id", user.id).in("status", ["checked_in", "late", "excused", "checked_out"]),
        supabase.from("student_achievements").select("*", { count: "exact", head: true }).eq("student_id", user.id),
        supabase.from("notifications").select("id, title, body, created_at").eq("user_id", user.id).eq("notification_type", "general").order("created_at", { ascending: false }).limit(3),
      ]);
      setSummary({
        name: student?.first_name ?? "Student",
        studentId: student?.student_id ?? "—",
        program: student?.program ?? "Program not set",
        yearLevel: student?.year_level ?? null,
        attended: attended ?? 0,
        points: student?.reward_points ?? 0,
        badges: badges ?? 0,
      });
      setBulletins((announcements ?? []) as BulletinItem[]);
    }
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex items-end justify-between gap-4">
        <div><p className="text-sm text-[var(--muted)]">Good morning,</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">{summary.name}.</h1></div>
        <Link href="/student/events" className="hidden min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-[var(--primary-strong)] transition hover:bg-[var(--primary-soft)] sm:inline-flex">View events <ChevronRight size={16} aria-hidden="true" /></Link>
      </header>

      <section className="student-campus-pass relative overflow-hidden rounded-[1.75rem] border border-[var(--primary-strong)] bg-[var(--primary-strong)] p-6 text-white shadow-[0_18px_42px_rgba(12,34,56,0.16)] sm:p-8">
        <div className="absolute -right-12 -top-14 h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 right-20 h-40 w-40 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-slate-300">YOUR CAMPUS PASS</p>
            <h2 className="mt-8 text-2xl font-semibold tracking-tight sm:text-3xl">{summary.name}</h2>
            <p className="mt-2 text-sm text-slate-300">{summary.program}{summary.yearLevel ? ` · ${summary.yearLevel}${summary.yearLevel === 1 ? "st" : summary.yearLevel === 2 ? "nd" : summary.yearLevel === 3 ? "rd" : "th"} Year` : ""}</p>
            <p className="mt-5 font-mono text-xs tracking-[0.12em] text-slate-300">STUDENT ID · {summary.studentId}</p>
          </div>
          <Link href="/student/attendance/scan" className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 text-center text-sm font-bold text-[var(--primary-strong)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--primary-strong)] sm:min-h-28 sm:w-36 sm:flex-col sm:gap-1 sm:px-4">
            <QrCode size={26} strokeWidth={1.8} aria-hidden="true" className="sm:h-10 sm:w-10" />
            <span>Scan to check in</span>
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Events attended", value: summary.attended, icon: TicketCheck },
          { label: "Reward points", value: summary.points, icon: Sparkles },
          { label: "Achievements", value: summary.badges, icon: Award },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]"><Icon size={18} className="text-[var(--primary)]" aria-hidden="true" /><p className="mt-5 text-2xl font-semibold tracking-tight text-[var(--text-strong)]">{value}</p><p className="mt-1 text-xs font-medium text-[var(--muted)]">{label}</p></div>)}
      </section>

      <section className="grid gap-4 sm:grid-cols-[1.15fr_.85fr]">
        <Link href="/student/attendance/scan" className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)]"><QrCode size={21} aria-hidden="true" /></div><ChevronRight size={19} className="text-[var(--muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></div>
          <p className="mt-7 text-xs font-semibold tracking-[0.12em] text-[var(--muted)]">ATTENDANCE</p><h2 className="mt-2 text-lg font-semibold text-[var(--text-strong)]">Scan event QR</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Check in to an event with a secure QR scan and transparent verification.</p>
        </Link>
        <Link href="/student/bingo" className="group rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800"><Sparkles size={20} aria-hidden="true" /></div><ChevronRight size={19} className="text-[var(--muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></div>
          <p className="mt-7 text-xs font-semibold tracking-[0.12em] text-[var(--muted)]">ENGAGEMENT</p><h2 className="mt-2 text-lg font-semibold text-[var(--text-strong)]">Your Bingo progress</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Check your published cards and see what participation can unlock next.</p>
        </Link>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
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

      <Link href="/student/events" className="flex min-h-14 items-center justify-between rounded-xl border-t border-[var(--border)] px-2 py-4 text-sm transition hover:bg-[var(--primary-soft)]"><span className="flex items-center gap-2 font-semibold text-[var(--primary-strong)]"><CalendarDays size={18} aria-hidden="true" />Find your next event</span><ChevronRight size={18} className="text-[var(--muted)]" aria-hidden="true" /></Link>
    </div>
  );
}
