"use client";

import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/lib/useAsyncAction";

interface StaffRow {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

export function StaffActions({ staff }: { staff: StaffRow }) {
  const router = useRouter();
  const run = useAsyncAction();

  async function setStatus(status: string) {
    await run("Updating staff…", () =>
      fetch(`/api/admin/users/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    );
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remove ${staff.first_name} ${staff.last_name}?`)) return;
    await run("Removing staff…", () =>
      fetch(`/api/admin/users/${staff.id}`, { method: "DELETE" }),
    );
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {staff.status === "active" ? (
        <button
          type="button"
          onClick={() => void setStatus("disabled")}
          className="text-xs text-amber-600 hover:underline"
        >
          Suspend
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void setStatus("active")}
          className="text-xs text-green-600 hover:underline"
        >
          Activate
        </button>
      )}
      <button
        type="button"
        onClick={() => void remove()}
        className="text-xs text-red-600 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
