"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

type ReviewStatus = "checked_in" | "late";

interface Submission {
  id: string;
  action: "check_in" | "check_out";
  captured_at: string;
  synced_at: string;
  selfie_url: string;
  otp_verified_at_capture: boolean;
  students: {
    student_id: string;
    first_name: string;
    last_name: string;
    program: string | null;
  } | null;
}

interface ViewSubmission extends Submission {
  selfieSignedUrl?: string;
}

export function OfflineAttendanceReviewPanel({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<ViewSubmission[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("offline_attendance_submissions")
      .select("id, action, captured_at, synced_at, selfie_url, otp_verified_at_capture, students(student_id, first_name, last_name, program)")
      .eq("event_id", eventId)
      .eq("review_status", "pending")
      .order("captured_at", { ascending: true });
    if (error) {
      setMessage(error.message);
      return;
    }
    const signed = await Promise.all((data ?? []).map(async (row) => {
      const { data: url } = await supabase.storage.from("selfies").createSignedUrl(
        row.selfie_url as string,
        60 * 20,
      );
      const student = Array.isArray(row.students) ? row.students[0] : row.students;
      return { ...row, students: student ?? null, selfieSignedUrl: url?.signedUrl } as ViewSubmission;
    }));
    setItems(signed);
  }, [eventId]);

  useEffect(() => {
    // Defer the first read until after the effect commits; the load function
    // updates local state when the Supabase request resolves.
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function review(item: Submission, approve: boolean) {
    const note = window.prompt(
      approve
        ? "Optional staff review note:"
        : "Reason for disapproving this offline attendance:",
      "",
    );
    if (!approve && note === null) return;
    const status: ReviewStatus = item.action === "check_in" &&
      window.confirm("Mark this approved time-in as late?\nChoose Cancel for Present.")
      ? "late"
      : "checked_in";

    setBusyId(item.id);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("review_offline_attendance_submission", {
      p_submission_id: item.id,
      p_approve: approve,
      p_note: note?.trim() || null,
      p_check_in_status: status,
    });
    setBusyId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(approve ? "Offline attendance approved." : "Offline attendance disapproved.");
    await load();
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">Offline attendance review</h3>
          <p className="mt-1 text-sm text-slate-700">
            Review the recorded QR scan time and live selfie. Offline submissions never use geofencing.
          </p>
        </div>
        <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-950">
          {items.length} pending
        </span>
      </div>

      {message && <p className="mt-3 text-sm text-slate-700" role="status">{message}</p>}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No offline attendance is awaiting review.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.id} className="grid gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:grid-cols-[96px_1fr_auto]">
              <a href={item.selfieSignedUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md bg-slate-100">
                {item.selfieSignedUrl ? (
                  // A review image is deliberately available only through a short-lived signed URL.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.selfieSignedUrl} alt="Offline attendance selfie" className="h-24 w-24 object-cover" />
                ) : <div className="grid h-24 w-24 place-items-center text-xs text-slate-500">Selfie unavailable</div>}
              </a>
              <div className="min-w-0">
                <p className="font-medium text-slate-900">
                  {item.students?.first_name} {item.students?.last_name}
                  <span className="ml-2 font-mono text-xs text-slate-500">{item.students?.student_id}</span>
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Offline {item.action === "check_in" ? "time in" : "time out"} · scanned {format(new Date(item.captured_at), "MMM d, yyyy h:mm:ss a")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Synced {format(new Date(item.synced_at), "MMM d, h:mm a")} · OTP {item.otp_verified_at_capture ? "matched at scan time" : "could not be confirmed"}
                </p>
              </div>
              <div className="flex self-center gap-2 sm:flex-col">
                <button type="button" disabled={busyId === item.id} onClick={() => review(item, true)} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
                  Approve
                </button>
                <button type="button" disabled={busyId === item.id} onClick={() => review(item, false)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-50 disabled:opacity-50">
                  Disapprove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
