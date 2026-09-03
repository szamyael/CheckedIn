"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { formatStudentDisplayName } from "@/lib/student/display-name";
import { createClient } from "@/lib/supabase/client";
import {
  StudentCard,
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
    <div className="space-y-6">
      <StudentCard className="bg-[#0c2238] text-white">
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
              <h1 className="text-xl font-bold text-white">
                {formatStudentDisplayName(profile)}
              </h1>
              <p className="text-sm text-slate-300">{profile.student_id}</p>
              <p className="mt-1 text-sm text-slate-300">
                {profile.program} · Year {profile.year_level}
                {profile.section ? ` · ${profile.section}` : ""}
              </p>
              <p className="mt-2 text-sm font-medium text-[#f0c46d]">
                {profile.reward_points} reward points
              </p>
            </div>
          </div>
          <Link
            href="/student/profile/edit"
            className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
          >
            Edit
          </Link>
        </div>
      </StudentCard>

      <section id="rewards">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0c2238]">Rewards &amp; badges</h2>
          <span className="text-xs font-medium text-[#a46618]">{profile.reward_points} points</span>
        </div>
        {badges.length === 0 ? (
          <StudentEmptyState message="No badges yet. Check in to events to earn them!" />
        ) : (
          <ul className="space-y-2">
            {badges.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border border-[#e2e5e7] bg-white px-3 py-2 text-sm"
              >
                {b.badge_name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[#0c2238]">
          Attendance history
        </h2>
        {history.length === 0 ? (
          <StudentEmptyState message="No attendance records yet." />
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="rounded-lg border border-[#e2e5e7] bg-white px-3 py-2 text-sm"
              >
                <p className="font-medium">{h.events?.title ?? "Event"}</p>
                <p className="text-xs text-slate-500">
                  {format(parseISO(h.checked_in_at), "MMM d, yyyy • h:mm a")} ·{" "}
                  {h.status.replace("_", " ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
