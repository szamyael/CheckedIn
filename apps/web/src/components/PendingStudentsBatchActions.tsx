"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PendingStudentsBatchActions({
  pendingIds,
}: {
  pendingIds: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);

  if (pendingIds.length === 0) return null;

  async function run(action: "approve" | "deny") {
    const verb = action === "approve" ? "approve" : "deny";
    if (
      !confirm(
        `${verb === "approve" ? "Approve" : "Deny"} all ${pendingIds.length} pending student${pendingIds.length === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }

    setLoading(action);
    try {
      const res = await fetch("/api/admin/users/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: pendingIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch update failed");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Batch update failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => void run("approve")}
        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
      >
        {loading === "approve"
          ? "Approving…"
          : `Approve all pending (${pendingIds.length})`}
      </button>
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => void run("deny")}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {loading === "deny"
          ? "Denying…"
          : `Deny all pending (${pendingIds.length})`}
      </button>
    </div>
  );
}
