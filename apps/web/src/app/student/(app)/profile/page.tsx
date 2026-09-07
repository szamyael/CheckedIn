"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CalendarDays, ChevronRight, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatStudentDisplayName } from "@/lib/student/display-name";
import { createClient } from "@/lib/supabase/client";
import {
  StudentEmptyState,
} from "@/components/student/StudentUi";

type Achievement = { id: string; badge_name: string; earned_at: string };
type HistoryRow = {
  id: string;
  status: string;
  checked_in_at: string;
  events: { title: string } | null;
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<{
    student_id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    name_extension: string | null;
    program: string;
    year_level: number;
    section: string | null;
    reward_points: number;
    profile_photo_url: string | null;
  } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [badges, setBadges] = useState<Achievement[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from("students")
        .select(
          "student_id, first_name, middle_name, last_name, name_extension, program, year_level, section, reward_points, profile_photo_url",
        )
        .eq("id", user.id)
        .single();
      setProfile(student);

      if (student?.profile_photo_url) {
        const { data: signed } = await supabase.storage
          .from("student-ids")
          .createSignedUrl(student.profile_photo_url, 3600);
        setAvatarUrl(signed?.signedUrl ?? null);
      }

      const { data: ach } = await supabase
        .from("student_achievements")
        .select("id, badge_name, earned_at")
        .eq("student_id", user.id)
        .order("earned_at", { ascending: false });
      setBadges((ach as Achievement[]) ?? []);

      const { data: hist } = await supabase
        .from("attendance_records")
        .select("id, status, checked_in_at, events(title)")
        .eq("student_id", user.id)
        .order("checked_in_at", { ascending: false })
        .limit(20);
      setHistory((hist as unknown as HistoryRow[]) ?? []);
    }
    void load();
  }, []);

  if (!profile) {
    return <p className="text-sm text-slate-500">Loading profile…</p>;
  }

  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() ||
    "?";

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header><p className="text-xs font-semibold tracking-[0.14em] text-[#697178]">STUDENT RECORD</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0c2238]">Profile &amp; rewards</h1></header>
      <section className="border border-[#0c2238] p-6 shadow-sm" style={{ backgroundColor: "#17324D", color: "#FFFFFF" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#c18a2e]"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e7eef4] text-lg font-bold text-[#17324d]">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold" style={{ color: "#FFFFFF" }}>
                {formatStudentDisplayName(profile)}
              </h2>
              <p className="text-sm" style={{ color: "#D7E2EC" }}>{profile.student_id}</p>
              <p className="mt-1 text-sm" style={{ color: "#D7E2EC" }}>
                {profile.program} · Year {profile.year_level}
                {profile.section ? ` · ${profile.section}` : ""}
              </p>
              <p className="mt-2 text-sm font-medium" style={{ color: "#F0C46D" }}>
                {profile.reward_points} reward points
              </p>
            </div>
          </div>
          <Link
            href="/student/profile/edit"
            className="inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold hover:bg-white/10" style={{ borderColor: "rgba(255,255,255,.45)", color: "#FFFFFF" }}
          >
            <Pencil size={13} /> Edit
          </Link>
        </div>
      </section>

      <section id="rewards" className="border-t border-[#e2e5e7] pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#0c2238]"><Award size={18} className="text-[#a46618]" />Rewards &amp; recognition</h2>
          <span className="border border-[#d9c38d] bg-[#fffaf0] px-2.5 py-1 text-xs font-semibold text-[#a46618]">{profile.reward_points} points</span>
        </div>
        {badges.length === 0 ? (
          <StudentEmptyState message="No badges yet. Check in to events to earn them!" />
        ) : (
          <ul className="space-y-2">
            {(showAllBadges ? badges : badges.slice(0, 1)).map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between border border-[#e2e5e7] bg-white px-4 py-3 text-sm"
              >
                <span className="font-medium text-[#0c2238]">{b.badge_name}</span><span className="text-xs text-[#697178]">{format(parseISO(b.earned_at), "MMM d, yyyy")}</span>
              </li>
            ))}
          </ul>
        )}
        {badges.length > 1 && <button type="button" onClick={() => setShowAllBadges((current) => !current)} className="mt-3 text-sm font-semibold text-[#17324d] hover:underline">{showAllBadges ? "Show recent only" : `View all ${badges.length} awards`}</button>}
      </section>

      <section className="border-t border-[#e2e5e7] pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#0c2238]"><CalendarDays size={18} className="text-[#17324d]" />Attendance history</h2>
        {history.length === 0 ? (
          <StudentEmptyState message="No attendance records yet." />
        ) : (
          <ul className="space-y-2">
            {(showAllHistory ? history : history.slice(0, 1)).map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between border border-[#e2e5e7] bg-white px-4 py-3 text-sm"
              >
                <div><p className="font-medium text-[#0c2238]">{h.events?.title ?? "Event"}</p>
                <p className="text-xs text-slate-500">
                  {format(parseISO(h.checked_in_at), "MMM d, yyyy • h:mm a")} ·{" "}
                  {h.status.replace("_", " ")}
                </p></div><ChevronRight size={17} className="text-[#697178]" />
              </li>
            ))}
          </ul>
        )}
        {history.length > 1 && <button type="button" onClick={() => setShowAllHistory((current) => !current)} className="mt-3 text-sm font-semibold text-[#17324d] hover:underline">{showAllHistory ? "Show recent only" : `View all ${history.length} attendance records`}</button>}
      </section>
    </div>
  );
}
