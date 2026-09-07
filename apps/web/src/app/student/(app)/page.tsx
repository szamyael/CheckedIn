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
    <div className="mx-auto max-w-3xl space-y-7">
      <header className="flex items-end justify-between gap-4">
        <div><p className="text-sm text-[#697178]">Good morning,</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0c2238]">{summary.name}.</h1></div>
        <Link href="/student/events" className="hidden items-center gap-1 text-sm font-semibold text-[#17324d] hover:underline sm:inline-flex">View events <ChevronRight size={16} /></Link>
      </header>

      <section className="relative overflow-hidden border border-[#0c2238] bg-[#17324d] p-6 text-white shadow-[0_12px_30px_rgba(12,34,56,0.12)] sm:p-7">
        <div className="absolute -right-12 -top-14 h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 right-20 h-40 w-40 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-slate-300">YOUR CAMPUS PASS</p>
            <h2 className="mt-8 text-2xl font-semibold tracking-tight sm:text-3xl">{summary.name}</h2>
            <p className="mt-2 text-sm text-slate-300">{summary.program}{summary.yearLevel ? ` · ${summary.yearLevel}${summary.yearLevel === 1 ? "st" : summary.yearLevel === 2 ? "nd" : summary.yearLevel === 3 ? "rd" : "th"} Year` : ""}</p>
            <p className="mt-5 font-mono text-xs tracking-[0.12em] text-slate-300">STUDENT ID · {summary.studentId}</p>
          </div>
          <Link href="/student/attendance/scan" className="group flex min-h-28 w-full flex-col items-center justify-center border border-white/25 bg-white/10 p-4 text-center hover:bg-white/15 sm:w-32">
            <QrCode size={42} strokeWidth={1.6} aria-hidden="true" />
            <span className="mt-2 text-xs font-semibold">Scan to check in</span>
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Events attended", value: summary.attended, icon: TicketCheck },
          { label: "Reward points", value: summary.points, icon: Sparkles },
          { label: "Achievements", value: summary.badges, icon: Award },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="border border-[#e2e5e7] bg-white p-4"><Icon size={18} className="text-[#17324d]" aria-hidden="true" /><p className="mt-5 text-2xl font-semibold tracking-tight text-[#0c2238]">{value}</p><p className="mt-1 text-xs font-medium text-[#697178]">{label}</p></div>)}
      </section>

      <section className="grid gap-4 sm:grid-cols-[1.15fr_.85fr]">
        <Link href="/student/attendance/scan" className="group border border-[#d5dcde] bg-white p-5 hover:border-[#17324d]">
          <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center bg-[#e7eef4] text-[#17324d]"><QrCode size={21} /></div><ChevronRight size={19} className="text-[#697178] transition-transform group-hover:translate-x-0.5" /></div>
          <p className="mt-7 text-xs font-semibold tracking-[0.12em] text-[#697178]">ATTENDANCE</p><h2 className="mt-2 text-lg font-semibold text-[#0c2238]">Scan event QR</h2><p className="mt-2 text-sm leading-6 text-[#697178]">Check in to an event with a secure QR scan and transparent verification.</p>
        </Link>
        <Link href="/student/bingo" className="group border border-[#d9c38d] bg-[#fffaf0] p-5 hover:border-[#a46618]">
          <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center bg-[#f7edcf] text-[#a46618]"><Sparkles size={20} /></div><ChevronRight size={19} className="text-[#a46618] transition-transform group-hover:translate-x-0.5" /></div>
          <p className="mt-7 text-xs font-semibold tracking-[0.12em] text-[#a46618]">ENGAGEMENT</p><h2 className="mt-2 text-lg font-semibold text-[#0c2238]">Your Bingo progress</h2><p className="mt-2 text-sm leading-6 text-[#697178]">Check your active card and see what participation can unlock next.</p>
        </Link>
      </section>

      <section className="border border-[#e2e5e7] bg-white">
        <div className="flex items-center justify-between border-b border-[#e2e5e7] px-5 py-4">
          <div className="flex items-center gap-2 text-[#0c2238]"><Megaphone size={19} className="text-[var(--primary)]" /><h2 className="font-semibold">Bulletin board</h2></div>
          <Link href="/student/notifications" className="text-sm font-semibold text-[var(--primary)] hover:underline">View all</Link>
        </div>
        {bulletins.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#697178]">No announcements right now. Check back soon.</p>
        ) : (
          <div className="divide-y divide-[#e2e5e7]">
            {bulletins.map((item) => (
              <Link key={item.id} href="/student/notifications" className="block px-5 py-4 hover:bg-[var(--primary-soft)]">
                <div className="flex items-start justify-between gap-4"><h3 className="font-semibold text-[#0c2238]">{item.title}</h3><time className="shrink-0 text-xs text-[#697178]">{new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></div>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#697178]">{item.body}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Link href="/student/events" className="flex items-center justify-between border-t border-[#e2e5e7] py-5 text-sm"><span className="flex items-center gap-2 font-semibold text-[#17324d]"><CalendarDays size={18} />Find your next event</span><ChevronRight size={18} className="text-[#697178]" /></Link>
    </div>
  );
}
