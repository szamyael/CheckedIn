"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserErrorDialog } from "@/components/UserErrorDialog";

interface StudentOption {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
}

export function ManualAttendancePanel({
  eventId,
  absentStudents,
}: {
  eventId: string;
  absentStudents: StudentOption[];
}) {
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<"checked_in" | "late" | "excused">("checked_in");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markPresent() {
    if (!studentId || !reason.trim()) {
      setError("Select a student and enter a reason before saving.");
      return;
    }
    setBusy(true);
    setMessage(null);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("staff_manual_mark_attendance", {
      p_event_id: eventId,
      p_student_id: studentId,
      p_status: status,
      p_reason: reason.trim(),
    });
    setBusy(false);
    if (error) {
      setError("We couldn't record attendance. Check your connection and try again.");
      return;
    }
    setMessage("Attendance recorded.");
    setReason("");
    setStudentId("");
  }

  async function requestCorrection(student: StudentOption) {
    const correctionReason = prompt(
      `Correction reason for ${student.first_name} ${student.last_name}:`,
    );
    if (!correctionReason?.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Your session ended. Sign in again, then retry.");
      return;
    }

    const { error } = await supabase.from("attendance_correction_requests").insert({
      event_id: eventId,
      student_id: student.id,
      requested_by: user.id,
      reason: correctionReason.trim(),
    });

    if (error) setError("We couldn't submit the correction request. Try again.");
    else setMessage("Correction request submitted for admin review.");
  }

  if (!eventId) return null;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <UserErrorDialog message={error} onClose={() => setError(null)} />
      <h3 className="font-semibold text-slate-900">Manual attendance</h3>
      <p className="text-sm text-slate-600">
        Mark absent students present or submit a correction request for admin approval.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select student…</option>
            {absentStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.student_id} — {s.first_name} {s.last_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "checked_in" | "late" | "excused")
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="checked_in">Present</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Reason</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Device issue, verified in person"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={markPresent}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Mark attendance"}
      </button>

      {message && <p className="text-sm text-slate-700">{message}</p>}

      {absentStudents.length > 0 && (
        <div className="border-t border-slate-200 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-600">
            Or request admin correction:
          </p>
          <div className="flex flex-wrap gap-2">
            {absentStudents.slice(0, 8).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => requestCorrection(s)}
                className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              >
                {s.student_id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
