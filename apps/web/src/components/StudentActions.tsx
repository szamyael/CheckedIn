"use client";

import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/lib/useAsyncAction";

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

  async function setStatus(status: "active" | "suspended", account_status_reason?: string) {
    await run("Updating student…", () => fetch(`/api/admin/users/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, account_status_reason }),
    }));
    router.refresh();
  }

  function deny() {
    const reason = prompt(
      `Why is ${student.first_name} ${student.last_name}'s account being denied?`,
      student.account_status_reason ?? "",
    )?.trim();
    if (!reason) return;
    void setStatus("suspended", reason);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {student.status === "pending" && <>
        <button type="button" onClick={() => void setStatus("active")} className="text-xs font-medium text-teal-600 hover:underline">Approve</button>
        <button type="button" onClick={deny} className="text-xs font-medium text-red-600 hover:underline">Deny</button>
      </>}
      {student.status === "active" && <button type="button" onClick={deny} className="text-xs font-medium text-amber-600 hover:underline">Deny</button>}
      {(student.status === "suspended" || student.status === "disabled") && <button type="button" onClick={() => void setStatus("active")} className="text-xs font-medium text-teal-600 hover:underline">Approve again</button>}
    </div>
  );
}
