"use client";

import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { useState } from "react";
import { UserErrorDialog } from "@/components/UserErrorDialog";

export function PendingStudentsBatchActions({ pendingIds }: { pendingIds: string[] }) {
  const router = useRouter();
  const run = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  if (pendingIds.length === 0) return null;

  async function approveAll() {
    if (!confirm(`Approve all ${pendingIds.length} pending student${pendingIds.length === 1 ? "" : "s"}?`)) return;
    try {
      const res = await run("Approving students…", () => fetch("/api/admin/users/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", ids: pendingIds }),
      }));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve students. Try again.");
    }
  }

  return <>
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void approveAll()} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500">Approve all ({pendingIds.length})</button>
      <p className="text-xs text-slate-600">Re-register or ban applicants individually so a decision reason is recorded.</p>
    </div>
    <UserErrorDialog message={error} onClose={() => setError(null)} />
  </>;
}
