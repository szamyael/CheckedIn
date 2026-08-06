"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function StudentHomePage() {
  const [stats, setStats] = useState({
    attended: 0,
    points: 0,
    badges: 0,
  });
  const [name, setName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from("students")
        .select("first_name, reward_points")
        .eq("id", user.id)
        .single();

      const { count: attended } = await supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user.id)
        .in("status", ["checked_in", "late", "excused", "checked_out"]);

      const { count: badges } = await supabase
        .from("student_achievements")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user.id);

      setName(student?.first_name ?? "Student");
      setStats({
        attended: attended ?? 0,
        points: student?.reward_points ?? 0,
        badges: badges ?? 0,
      });
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Welcome back</p>
        <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Attended", value: stats.attended },
          { label: "Points", value: stats.points },
          { label: "Badges", value: stats.badges },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm"
          >
            <p className="text-xl font-bold text-teal-600">{s.value}</p>
            <p className="text-[11px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/student/attendance/scan"
        className="flex items-center justify-center gap-3 rounded-2xl bg-teal-600 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-500"
      >
        <QrCode className="h-6 w-6" />
        Scan Event QR
      </Link>

      <p className="text-center text-xs text-slate-500">
        Scan once to check in (location → OTP → selfie). Scan again after
        check-in to check out — no OTP or selfie needed.
      </p>
    </div>
  );
}
