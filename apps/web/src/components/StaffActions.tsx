"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StaffRow {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

export function StaffActions({ staff }: { staff: StaffRow }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: string) {
    setLoading(true);
    await fetch(`/api/admin/users/${staff.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remove ${staff.first_name} ${staff.last_name}?`)) return;
    setLoading(true);
    await fetch(`/api/admin/users/${staff.id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {staff.status === "active" ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("disabled")}
          className="text-xs text-amber-600 hover:underline"
        >
          Suspend
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("active")}
          className="text-xs text-green-600 hover:underline"
        >
          Activate
        </button>
      )}
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
