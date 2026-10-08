"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/lib/useAsyncAction";

type DecisionStatus = "suspended" | "needs_reregistration";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  account_status_reason: string | null;
}

export function StudentActions({ student }: { student: StudentRow }) {
  const router = useRouter();
  const run = useAsyncAction();
  const [decision, setDecision] = useState<DecisionStatus | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function setStatus(
    status: "active" | "suspended" | "needs_reregistration",
    account_status_reason?: string,
  ): Promise<boolean> {
    setError(null);
    try {
      await run("Updating student…", async () => {
        const response = await fetch(`/api/admin/users/${student.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, account_status_reason }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not update student account.");
      });
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update student account.");
      return false;
    }
  }

  async function submitDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (!decision || !trimmedReason) {
      setError("A reason is required for this decision.");
      return;
    }
    if (await setStatus(decision, trimmedReason)) {
      setDecision(null);
      setReason("");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void setStatus("active")}
        disabled={student.status === "active"}
        className="text-xs font-medium text-teal-700 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setReason(student.account_status_reason ?? "");
          setDecision("needs_reregistration");
        }}
        disabled={student.status !== "pending"}
        className="text-xs font-medium text-amber-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
      >
        Re-register
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setReason(student.account_status_reason ?? "");
          setDecision("suspended");
        }}
        disabled={student.status === "suspended"}
        className="text-xs font-medium text-red-700 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline"
      >
        Banned
      </button>
      {error && !decision && <p role="alert" className="basis-full text-xs text-red-700">{error}</p>}
      {decision && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`student-decision-title-${student.id}`}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDecision(null);
          }}
        >
          <form
            onSubmit={(event) => void submitDecision(event)}
            className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow-xl"
          >
            <div>
              <h2 id={`student-decision-title-${student.id}`} className="text-lg font-semibold text-slate-900">
                {decision === "suspended" ? "Ban student account" : "Request re-registration"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {student.first_name} {student.last_name}
              </p>
            </div>
            <label className="block text-sm font-medium text-slate-800">
              Admin reason <span aria-hidden="true" className="text-red-600">*</span>
              <textarea
                autoFocus
                required
                minLength={1}
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain this decision to the applicant."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason.trim()}
                className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  decision === "suspended" ? "bg-red-700 hover:bg-red-800" : "bg-amber-700 hover:bg-amber-800"
                }`}
              >
                {decision === "suspended" ? "Confirm ban" : "Request re-registration"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
