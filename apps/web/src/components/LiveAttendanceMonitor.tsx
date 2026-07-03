"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

interface MonitorRow {
  id: string;
  checked_in_at: string;
  students: {
    student_id: string;
    first_name: string;
    last_name: string;
    program: string;
  };
}

export function LiveAttendanceMonitor({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<MonitorRow[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("attendance_records")
        .select(
          "id, checked_in_at, students(student_id, first_name, last_name, program)",
        )
        .eq("event_id", eventId)
        .eq("status", "checked_in")
        .order("checked_in_at", { ascending: false });

      const mapped = (data ?? []).map((row) => {
        const student = Array.isArray(row.students) ? row.students[0] : row.students;
        return {
          id: row.id as string,
          checked_in_at: row.checked_in_at as string,
          students: student as MonitorRow["students"],
        };
      });

      setRows(mapped);
      setCount(mapped.length);
    }

    load();

    const channel = supabase
      .channel(`attendance-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance_records",
          filter: `event_id=eq.${eventId}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-medium">
          Live attendance: <span className="text-blue-600">{count}</span> checked in
        </p>
      </div>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Student ID</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Program</th>
              <th className="px-4 py-2 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs">{row.students.student_id}</td>
                <td className="px-4 py-2">
                  {row.students.first_name} {row.students.last_name}
                </td>
                <td className="px-4 py-2 text-slate-700">{row.students.program}</td>
                <td className="px-4 py-2">
                  {format(new Date(row.checked_in_at), "h:mm:ss a")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
