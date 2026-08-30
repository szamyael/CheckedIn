"use client";

import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/lib/useAsyncAction";

interface StudentRow {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  year_level: number | null;
  status: string;
}

export function StudentActions({ student }: { student: StudentRow }) {
  const router = useRouter();
  const run = useAsyncAction();

  async function setStatus(status: string) {
    await run("Updating student…", () =>
      fetch(`/api/admin/users/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    );
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remove student ${student.first_name} ${student.last_name}?`)) {
      return;
    }
    await run("Removing student…", () =>
      fetch(`/api/admin/users/${student.id}`, { method: "DELETE" }),
    );
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {student.status === "pending" && (
        <>
          <button
            type="button"
            onClick={() => void setStatus("active")}
            className="text-xs font-medium text-teal-600 hover:underline"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                !confirm(
                  `Deny ${student.first_name} ${student.last_name}? Their account will be disabled.`,
                )
              ) {
                return;
              }
              void setStatus("disabled");
            }}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Deny
          </button>
        </>
      )}
      {student.status === "active" && (
        <button
          type="button"
          onClick={() => void setStatus("disabled")}
          className="text-xs font-medium text-amber-600 hover:underline"
        >
          Disable
        </button>
      )}
      {student.status === "disabled" && (
        <button
          type="button"
          onClick={() => void setStatus("active")}
          className="text-xs font-medium text-teal-600 hover:underline"
        >
          Re-enable
        </button>
      )}
      <button
        type="button"
        onClick={() => void remove()}
        className="text-xs font-medium text-red-600 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
