"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CorrectionRow {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  event_id: string;
  student_id: string;
  events: { title: string } | { title: string }[] | null;
  students:
    | { student_id: string; first_name: string; last_name: string }
    | { student_id: string; first_name: string; last_name: string }[]
    | null;
  users: { email: string } | { email: string }[] | null;
}

export function AttendanceCorrectionPanel({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<CorrectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const query = supabase
      .from("attendance_correction_requests")
      .select(
        "id, reason, status, created_at, event_id, student_id, events(title), students(student_id, first_name, last_name), users!attendance_correction_requests_requested_by_fkey(email)",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    const { data } = await query;

    setRows((data ?? []) as CorrectionRow[]);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, approve: boolean) {
    setBusy(id);
    const supabase = createClient();
    const { error } = await supabase.rpc("review_attendance_correction", {
      p_request_id: id,
      p_approve: approve,
      p_new_status: "excused",
    });
    setBusy(null);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading correction requests…</p>;
  }

  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Student</th>
            <th className="px-4 py-2 font-medium">Event</th>
            <th className="px-4 py-2 font-medium">Reason</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Requested</th>
            {isAdmin && <th className="px-4 py-2 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const student = Array.isArray(row.students) ? row.students[0] : row.students;
            const event = Array.isArray(row.events) ? row.events[0] : row.events;
            return (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-4 py-2">
                  {student
                    ? `${student.first_name} ${student.last_name} (${student.student_id})`
                    : "—"}
                </td>
                <td className="px-4 py-2">{event?.title ?? "—"}</td>
                <td className="max-w-xs truncate px-4 py-2" title={row.reason}>
                  {row.reason}
                </td>
                <td className="px-4 py-2 capitalize">{row.status}</td>
                <td className="px-4 py-2">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2">
                    {row.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy === row.id}
                          onClick={() => review(row.id, true)}
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy === row.id}
                          onClick={() => review(row.id, false)}
                          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} className="px-4 py-6 text-center text-slate-600">
                No correction requests.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
