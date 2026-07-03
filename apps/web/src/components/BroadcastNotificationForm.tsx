"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function BroadcastNotificationForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all_students" | "all_staff">("all_students");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const roles = target === "all_students" ? ["student"] : ["faculty", "org_member", "admin"];

    const { data: users } = await supabase
      .from("users")
      .select("id")
      .in("role", roles)
      .eq("status", "active");

    if (!users?.length) {
      setMessage("No recipients found.");
      setLoading(false);
      return;
    }

    const rows = users.map((u) => ({
      user_id: u.id,
      title,
      body,
      notification_type: "general" as const,
    }));

    const { error } = await supabase.from("notifications").insert(rows);
    if (error) {
      setMessage(error.message);
    } else {
      await supabase.rpc("log_audit", {
        p_action: "broadcast_notification",
        p_details: { target, count: rows.length, title },
      });
      setMessage(`Sent to ${rows.length} users.`);
      setTitle("");
      setBody("");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={send} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Broadcast notification</h2>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value as typeof target)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      >
        <option value="all_students">All active students</option>
        <option value="all_staff">All staff</option>
      </select>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      <textarea
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message"
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      {message && <p className="text-sm text-slate-700">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send announcement"}
      </button>
    </form>
  );
}
