"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  StudentEmptyState,
  StudentPageTitle,
} from "@/components/student/StudentUi";

type Notif = {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  notification_type: string;
};

export default function StudentNotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, read_at, created_at, notification_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as Notif[]) ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );
  }

  async function markAll() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <StudentPageTitle title="Notifications" />
        <button
          type="button"
          onClick={() => void markAll()}
          className="text-xs font-medium text-teal-600"
        >
          Mark all read
        </button>
      </div>
      {items.length === 0 ? (
        <StudentEmptyState message="No notifications." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void markRead(n.id)}
                className={`w-full rounded-2xl border px-3 py-3 text-left ${
                  n.read_at
                    ? "border-slate-200 bg-white"
                    : "border-teal-200 bg-teal-50"
                }`}
              >
                <p className="text-sm font-semibold">{n.title}</p>
                {n.body && (
                  <p className="mt-1 text-xs text-slate-600">{n.body}</p>
                )}
                <p className="mt-2 text-[11px] text-slate-400">
                  {formatDistanceToNow(parseISO(n.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
