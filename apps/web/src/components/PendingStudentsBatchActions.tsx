"use client";

import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/lib/useAsyncAction";

export function PendingStudentsBatchActions({
  pendingIds,
}: {
  pendingIds: string[];
}) {
  const router = useRouter();
  const run = useAsyncAction();

  if (pendingIds.length === 0) return null;

  async function runBatch(action: "approve" | "deny") {
    const verb = action === "approve" ? "approve" : "deny";
    if (
      !confirm(
        `${verb === "approve" ? "Approve" : "Deny"} all ${pendingIds.length} pending student${pendingIds.length === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }

    try {
      const res = await run(
        action === "approve" ? "Approving students…" : "Denying students…",
        () =>
          fetch("/api/admin/users/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, ids: pendingIds }),
          }),
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch update failed");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Batch update failed");
    }
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void runBatch("approve")}
        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
      >
        Approve all ({pendingIds.length})
      </button>
      <button
        type="button"
        onClick={() => void runBatch("deny")}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
      >
        Deny all ({pendingIds.length})
      </button>
    </div>
  );
}
