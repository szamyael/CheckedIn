"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/lib/useAsyncAction";
import type { Event } from "@/lib/types";

export function EventApprovalPanel({ events }: { events: Event[] }) {
  const router = useRouter();
  const run = useAsyncAction();
  const pending = events.filter((e) => e.status === "pending_approval");

  if (pending.length === 0) return null;

  async function review(eventId: string, approve: boolean) {
    await run(approve ? "Approving event…" : "Rejecting event…", async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("events")
        .update({ status: approve ? "published" : "cancelled" })
        .eq("id", eventId);

      if (!error) {
        await supabase.rpc("log_audit", {
          p_action: approve ? "approve_event" : "reject_event",
          p_entity_type: "event",
          p_entity_id: eventId,
        });
      }
    });
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Events pending approval</h2>
      <p className="mt-1 text-sm text-slate-700">
        Organization-submitted events require admin approval before publishing.
      </p>
      <ul className="mt-4 space-y-3">
        {pending.map((event) => (
          <li
            key={event.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-100 bg-white p-4"
          >
            <div>
              <p className="font-medium text-slate-900">{event.title}</p>
              <p className="text-sm text-slate-600">{event.venue_name}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void review(event.id, true)}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void review(event.id, false)}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
