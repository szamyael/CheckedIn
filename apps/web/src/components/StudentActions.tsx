"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(false);

  async function setStatus(status: string) {
    setLoading(true);
    await fetch(`/api/admin/users/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remove student ${student.first_name} ${student.last_name}?`)) return;
    setLoading(true);
    await fetch(`/api/admin/users/${student.id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {student.status === "pending" && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => setStatus("active")}
            className="text-xs font-medium text-teal-600 hover:underline"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={loading}
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
            className="text-xs font-medium text-amber-700 hover:underline"
          >
            Deny
          </button>
        </>
      )}
      {student.status === "active" ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("disabled")}
          className="text-xs text-amber-600 hover:underline"
        >
          Suspend
        </button>
      ) : student.status !== "pending" ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("active")}
          className="text-xs text-green-600 hover:underline"
        >
          Activate
        </button>
      ) : null}
      <button
        type="button"
        disabled={loading}
        onClick={remove}
        className="text-xs text-red-600 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
