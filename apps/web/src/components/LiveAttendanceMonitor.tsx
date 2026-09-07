"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

interface MonitorRow {
  id: string;
  checked_in_at: string;
  break_out_at: string | null;
  break_in_at: string | null;
  checked_out_at: string | null;
  status: string;
  fraud_flag: boolean;
  is_manual_override: boolean;
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
          "id, status, checked_in_at, break_out_at, break_in_at, checked_out_at, fraud_flag, is_manual_override, students(student_id, first_name, last_name, program)",
        )
        .eq("event_id", eventId)
        .order("checked_in_at", { ascending: false });

      const mapped = (data ?? []).map((row) => {
        const student = Array.isArray(row.students) ? row.students[0] : row.students;
        return {
          id: row.id as string,
          checked_in_at: row.checked_in_at as string,
          break_out_at: row.break_out_at as string | null,
          break_in_at: row.break_in_at as string | null,
          checked_out_at: row.checked_out_at as string | null,
          status: row.status as string,
          fraud_flag: Boolean(row.fraud_flag),
          is_manual_override: Boolean(row.is_manual_override),
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
          event: "*",
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
          Live attendance: <span className="text-[var(--primary)]">{count}</span> records
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
              <th className="px-4 py-2 font-medium">Break out</th>
              <th className="px-4 py-2 font-medium">Break in</th>
              <th className="px-4 py-2 font-medium">Check out</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Flags</th>
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
                <td className="px-4 py-2">{row.break_out_at ? format(new Date(row.break_out_at), "h:mm:ss a") : "—"}</td>
                <td className="px-4 py-2">{row.break_in_at ? format(new Date(row.break_in_at), "h:mm:ss a") : "—"}</td>
                <td className="px-4 py-2">{row.checked_out_at ? format(new Date(row.checked_out_at), "h:mm:ss a") : "—"}</td>
                <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.status === "on_break" ? "bg-amber-100 text-amber-900" : row.status === "checked_out" ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"}`}>{row.status === "on_break" ? "On break" : row.status === "checked_out" ? "Checked out" : "Present"}</span></td>
                <td className="px-4 py-2">
                  {row.fraud_flag && (
                    <span className="mr-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      Screenshot suspected
                    </span>
                  )}
                  {row.is_manual_override && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      Manual
                    </span>
                  )}
                  {!row.fraud_flag && !row.is_manual_override && "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
