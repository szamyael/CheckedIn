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

interface ReviewDraft {
  item: Submission;
  approve: boolean;
  note: string;
  markLate: boolean;
}

export function OfflineAttendanceReviewPanel({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<ViewSubmission[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [schemaUnavailable, setSchemaUnavailable] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [selfieToView, setSelfieToView] = useState<ViewSubmission | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("offline_attendance_submissions")
      .select("id, action, captured_at, synced_at, selfie_url, otp_verified_at_capture, students(student_id, first_name, last_name, program)")
      .eq("event_id", eventId)
      .eq("review_status", "pending")
      .order("captured_at", { ascending: true });
    if (error) {
      setLoadError(true);
      const missingTable = error.message.includes("offline_attendance_submissions") &&
        (error.message.includes("schema cache") || error.code === "PGRST205");
      setSchemaUnavailable(missingTable);
      setMessage(
        missingTable
          ? "Offline attendance review is not set up in this Supabase project. Apply migration 038_offline_attendance_review.sql, then refresh this page."
          : error.message,
      );
      return;
    }
    setLoadError(false);
    setSchemaUnavailable(false);
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

  async function submitReview() {
    if (!draft) return;
    const { item, approve, note, markLate } = draft;
    const trimmedNote = note.trim();
    if (!approve && !trimmedNote) {
      setMessage("A reason is required when disapproving offline attendance.");
      return;
    }
    const status: ReviewStatus = item.action === "check_in" && markLate ? "late" : "checked_in";

    setBusyId(item.id);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("review_offline_attendance_submission", {
      p_submission_id: item.id,
      p_approve: approve,
      p_note: trimmedNote || null,
      p_check_in_status: status,
    });
    setBusyId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(approve ? "Offline attendance approved." : "Offline attendance disapproved.");
    setDraft(null);
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

      {schemaUnavailable ? (
        <div className="mt-4 border border-amber-300 bg-white p-4 text-sm text-slate-700" role="alert">
          <p className="font-semibold text-slate-900">Offline review needs a database update</p>
          <p className="mt-1">Run <code className="font-mono text-xs">cd backend &amp;&amp; supabase db push</code> against the linked project to create the review table.</p>
        </div>
      ) : loadError ? (
        <div className="mt-4 border border-rose-200 bg-white p-4 text-sm text-slate-700" role="alert">
          <p className="font-semibold text-slate-900">Offline review could not be loaded</p>
          <p className="mt-1">Refresh the page to retry. If the issue remains, verify staff access to the offline attendance review table.</p>
        </div>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No offline attendance is awaiting review.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.id} className="grid gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:grid-cols-[96px_1fr_auto]">
              <div className="overflow-hidden rounded-md bg-slate-100">
                {item.selfieSignedUrl ? (
                  // A review image is deliberately available only through a short-lived signed URL.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.selfieSignedUrl} alt="Offline attendance selfie" className="h-24 w-24 object-cover" />
                ) : <div className="grid h-24 w-24 place-items-center text-xs text-slate-500">Selfie unavailable</div>}
              </div>
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
                <button type="button" disabled={!item.selfieSignedUrl} onClick={() => setSelfieToView(item)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                  View selfie
                </button>
                <button type="button" disabled={busyId === item.id} onClick={() => setDraft({ item, approve: true, note: "", markLate: false })} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
                  Approve
                </button>
                <button type="button" disabled={busyId === item.id} onClick={() => setDraft({ item, approve: false, note: "", markLate: false })} className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-50 disabled:opacity-50">
                  Disapprove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selfieToView?.selfieSignedUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="offline-selfie-title" onClick={() => setSelfieToView(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h4 id="offline-selfie-title" className="font-semibold text-slate-900">Offline attendance selfie</h4>
                <p className="text-sm text-slate-600">{selfieToView.students?.first_name} {selfieToView.students?.last_name}</p>
              </div>
              <button type="button" onClick={() => setSelfieToView(null)} className="rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100" aria-label="Close selfie viewer">Close</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selfieToView.selfieSignedUrl} alt={`Offline attendance selfie for ${selfieToView.students?.first_name ?? "student"}`} className="max-h-[70vh] w-full rounded-lg bg-slate-100 object-contain" />
            <a href={selfieToView.selfieSignedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-medium text-blue-700 hover:underline">Open full size</a>
          </div>
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="offline-review-title">
          <form className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onSubmit={(event) => { event.preventDefault(); void submitReview(); }}>
            <h4 id="offline-review-title" className="text-base font-semibold text-slate-900">
              {draft.approve ? "Approve offline attendance" : "Disapprove offline attendance"}
            </h4>
            <p className="mt-1 text-sm text-slate-600">
              {draft.item.students?.first_name} {draft.item.students?.last_name} &middot; Offline {draft.item.action === "check_in" ? "time in" : "time out"}
            </p>
            {draft.approve && draft.item.action === "check_in" && (
              <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={draft.markLate} onChange={(event) => setDraft({ ...draft, markLate: event.target.checked })} />
                Mark this time-in as late
              </label>
            )}
            <label className="mt-4 block text-sm font-medium text-slate-800">
              {draft.approve ? "Staff note (optional)" : "Reason for disapproval"}
              <textarea
                autoFocus
                required={!draft.approve}
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                placeholder={draft.approve ? "Add context for the attendance record" : "Explain why this submission cannot be approved"}
                className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" disabled={busyId === draft.item.id} onClick={() => setDraft(null)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={busyId === draft.item.id} className={`rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${draft.approve ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"}`}>
                {busyId === draft.item.id ? "Saving…" : draft.approve ? "Approve" : "Disapprove"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
