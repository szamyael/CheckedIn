"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DataCategory =
  | "events"
  | "posted_events"
  | "organizations"
  | "student_accounts"
  | "notifications";

type FlushCounts = Record<DataCategory, number>;

const CATEGORIES: {
  id: DataCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "events",
    label: "Unpublished events",
    description: "Draft, cancelled, and completed events with their linked event records.",
  },
  {
    id: "posted_events",
    label: "Posted events",
    description: "Published events with their linked attendance and event records.",
  },
  {
    id: "organizations",
    label: "Organizations",
    description: "Organization profiles, program mappings, badges, and bingo cards. Staff login accounts are kept and unlinked.",
  },
  {
    id: "student_accounts",
    label: "Student accounts",
    description: "Student login accounts and all linked student profiles, attendance, rewards, and notifications.",
  },
  {
    id: "notifications",
    label: "Sent notifications",
    description: "All in-app notification records.",
  },
];

export function AdminDataFlushPanel() {
  const router = useRouter();
  const [selected, setSelected] = useState<DataCategory[]>([]);
  const [preview, setPreview] = useState<FlushCounts | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function flush(confirm: string | null) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error: rpcError } = await createClient().rpc("admin_flush_data", {
        p_categories: selected,
        p_confirmation: confirm,
      });
      if (rpcError) throw rpcError;

      const result = data as { counts: FlushCounts };
      if (confirm === null) {
        setPreview(result.counts);
      } else {
        const total = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
        setMessage(`Flush complete. ${total} selected records were removed.`);
        setSelected([]);
        setPreview(null);
        setConfirmation("");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : "Could not flush selected data.",
      );
    } finally {
      setBusy(false);
    }
  }

  function toggleCategory(category: DataCategory) {
    setSelected((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
    setPreview(null);
    setConfirmation("");
    setMessage(null);
  }

  return (
    <section className="rounded-xl border border-red-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-700">
          <AlertTriangle size={20} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Flush existing data</h2>
          <p className="mt-1 text-sm text-slate-600">
            Permanently remove selected records. This cannot be undone. Select only the data you intend to clear.
          </p>
        </div>
      </div>

      <fieldset className="mt-5 space-y-3">
        <legend className="mb-2 text-sm font-semibold text-slate-800">Choose data to remove</legend>
        {CATEGORIES.map((category) => (
          <label key={category.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={selected.includes(category.id)}
              disabled={busy}
              onChange={() => toggleCategory(category.id)}
              className="mt-1 h-4 w-4 accent-red-600"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">{category.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-600">{category.description}</span>
            </span>
            {preview && selected.includes(category.id) && (
              <span className="ml-auto whitespace-nowrap text-sm font-semibold text-red-700">
                {preview[category.id]} records
              </span>
            )}
          </label>
        ))}
      </fieldset>

      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mt-4 text-sm font-medium text-green-700">{message}</p>}

      {!preview ? (
        <button
          type="button"
          disabled={busy || selected.length === 0}
          onClick={() => void flush(null)}
          className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} />
          {busy ? "Checking records…" : "Review selected data"}
        </button>
      ) : (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">
            Review the counts above. Deletion is permanent and cannot be reversed.
          </p>
          <label className="mt-3 block text-sm font-medium text-red-900">
            Type FLUSH to confirm
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={busy}
              className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-slate-900"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            disabled={busy || confirmation !== "FLUSH"}
            onClick={() => void flush("FLUSH")}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} />
            {busy ? "Flushing data…" : "Permanently flush selected data"}
          </button>
        </div>
      )}
    </section>
  );
}
