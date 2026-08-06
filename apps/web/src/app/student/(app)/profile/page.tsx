"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";

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
    last_name: string;
    program: string;
    year_level: number;
    section: string | null;
    reward_points: number;
  } | null>(null);
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
          "student_id, first_name, last_name, program, year_level, section, reward_points",
        )
        .eq("id", user.id)
        .single();
      setProfile(student);

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            {profile.first_name} {profile.last_name}
          </h1>
          <p className="text-sm text-slate-500">{profile.student_id}</p>
          <p className="mt-1 text-sm text-slate-600">
            {profile.program} · Year {profile.year_level}
            {profile.section ? ` · ${profile.section}` : ""}
          </p>
          <p className="mt-2 text-sm font-medium text-teal-600">
            {profile.reward_points} reward points
          </p>
        </div>
        <Link
          href="/student/profile/edit"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium"
        >
          Edit
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Badges</h2>
        {badges.length === 0 ? (
          <p className="text-sm text-slate-400">No badges yet.</p>
        ) : (
          <ul className="space-y-2">
            {badges.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {b.badge_name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Attendance history
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No attendance records yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <p className="font-medium">
                  {h.events?.title ?? "Event"}
                </p>
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
