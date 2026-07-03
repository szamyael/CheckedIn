"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AbsenteeRow {
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  year_level: number | null;
  section: string | null;
}

export function AbsenteeReport({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<AbsenteeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedInCount, setCheckedInCount] = useState(0);

  useEffect(() => {
    if (!eventId) return;
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("student_id")
        .eq("event_id", eventId);

      const checkedIds = new Set((attendance ?? []).map((a) => a.student_id));
      setCheckedInCount(checkedIds.size);

      const { data: students } = await supabase
        .from("students")
        .select("id, student_id, first_name, last_name, program, year_level, section, users!inner(status)")
        .eq("users.status", "active");

      const absent = (students ?? [])
        .filter((s) => !checkedIds.has(s.id))
        .map((s) => ({
          student_id: s.student_id,
          first_name: s.first_name,
          last_name: s.last_name,
          program: s.program,
          year_level: s.year_level,
          section: s.section,
        }));

      setRows(absent);
      setLoading(false);
    }
    load();
  }, [eventId]);

  if (!eventId) {
    return (
      <p className="text-sm text-slate-600">Select an event to view absentees.</p>
    );
  }

  if (loading) return <p className="text-sm text-slate-600">Loading absentee list…</p>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="font-semibold text-slate-900">Absentee report</h3>
      <p className="mt-1 text-sm text-slate-600">
        {checkedInCount} checked in · {rows.length} absent (active students)
      </p>
      <div className="mt-4 max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-slate-600">
            <tr>
              <th className="py-2 pr-4">Student ID</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Program</th>
              <th className="py-2">Section</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student_id} className="border-b border-slate-100">
                <td className="py-2 pr-4">{r.student_id}</td>
                <td className="py-2 pr-4">{r.first_name} {r.last_name}</td>
                <td className="py-2 pr-4">{r.program}</td>
                <td className="py-2">{r.section ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-slate-600">
                  All active students checked in.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
