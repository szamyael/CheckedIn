"use client";

import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/lib/useAsyncAction";

export function PendingStudentsBatchActions({ pendingIds }: { pendingIds: string[] }) {
  const router = useRouter();
  const run = useAsyncAction();
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
      alert(err instanceof Error ? err.message : "Batch update failed");
    }
  }

  return <div className="mb-3 flex flex-wrap items-center gap-2">
    <button type="button" onClick={() => void approveAll()} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500">Approve all ({pendingIds.length})</button>
    <p className="text-xs text-slate-600">Deny accounts individually so a review reason is recorded.</p>
  </div>;
}
