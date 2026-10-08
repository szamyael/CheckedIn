"use client";

import { useRouter } from "next/navigation";

export type StudentAccountDecision =
  | { status: "needs_reregistration"; reason: string | null }
  | { status: "suspended"; reason: string | null };

export function StudentAccountDecisionDialog({
  decision,
  onClose,
}: {
  decision: StudentAccountDecision | null;
  onClose: () => void;
}) {
  const router = useRouter();
  if (!decision) return null;

  const needsReregistration = decision.status === "needs_reregistration";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-decision-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4"
    >
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className={`text-xs font-semibold tracking-[0.14em] ${needsReregistration ? "text-amber-700" : "text-red-700"}`}>
          ACCOUNT STATUS
        </p>
        <h2 id="account-decision-title" className="mt-2 text-xl font-semibold text-slate-950">
          {needsReregistration ? "Registration needs changes" : "Account banned"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {needsReregistration
            ? "An administrator has asked you to register again. Review the reason and submit your application again."
            : "An administrator has banned this account. Contact the administration if you believe this decision was made in error."}
        </p>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin reason</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
            {decision.reason?.trim() || "No reason was provided."}
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          {needsReregistration ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => router.push("/student/register?resubmit=1")}
                className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Register again
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
            >
              Close
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
