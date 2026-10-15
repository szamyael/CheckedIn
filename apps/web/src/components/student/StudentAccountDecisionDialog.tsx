"use client";

import { useRouter } from "next/navigation";

export type StudentAccountDecision = { status: string; reason: string | null };

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
  const statusLabel = decision.status.replaceAll("_", " ");
  const title = needsReregistration
    ? "Registration needs changes"
    : `Account ${statusLabel.charAt(0).toUpperCase()}${statusLabel.slice(1)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-decision-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4"
    >
      <section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--foreground)] shadow-2xl">
        <p className={`text-xs font-semibold tracking-[0.14em] ${needsReregistration ? "text-[var(--warning)]" : "text-[var(--error)]"}`}>
          ACCOUNT STATUS
        </p>
        <h2 id="account-decision-title" className="mt-2 text-xl font-semibold text-[var(--primary-strong)]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
          {needsReregistration
            ? "An administrator has asked you to register again. Review the reason and submit your application again."
            : `Your account is currently ${statusLabel}, so you cannot sign in.`}
        </p>
        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Account status details</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">
            {decision.reason?.trim() || "No reason was provided."}
          </p>
        </div>
        <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--foreground)]">
          If you have concerns, please visit your Department&apos;s Organization Office to address your account status.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          {needsReregistration ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => router.push("/student/register?resubmit=1")}
                className="min-h-11 rounded-lg bg-[var(--action-background)] px-4 py-2.5 text-sm font-semibold text-[var(--action-foreground)] hover:brightness-95"
              >
                Register again
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-lg bg-[var(--action-background)] px-4 py-2.5 text-sm font-semibold text-[var(--action-foreground)] hover:brightness-95"
            >
              Close
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
