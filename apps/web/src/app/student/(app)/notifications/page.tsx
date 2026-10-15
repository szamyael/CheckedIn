"use client";

import { useContext, useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  getUpdatedNotificationIds,
  requireNotificationUpdated,
} from "@/lib/notification-read";
import { StudentNotificationsReadContext } from "@/components/student/StudentAppLayout";
import { NotificationSender } from "@/components/NotificationSender";
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
  sender_name: string | null;
  sender_role: string | null;
  sender_organization_name: string | null;
  sender_avatar_path: string | null;
};

export default function StudentNotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [readError, setReadError] = useState<string | null>(null);
  const reportNotificationsRead = useContext(StudentNotificationsReadContext);

  async function load(): Promise<Notif[]> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, read_at, created_at, notification_type, sender_name, sender_role, sender_organization_name, sender_avatar_path")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data as Notif[]) ?? [];
  }

  useEffect(() => {
    let cancelled = false;
    void load().then((notifications) => {
      if (!cancelled) setItems(notifications);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function markRead(id: string) {
    if (!items.some((n) => n.id === id && !n.read_at)) return;
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Sign in to update notifications.");
      const { data, error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
        .is("read_at", null)
        .select("id");
      const updatedIds = new Set(requireNotificationUpdated({ data, error }, id));
      const readAt = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => updatedIds.has(n.id) ? { ...n, read_at: readAt } : n),
      );
      reportNotificationsRead?.(updatedIds.size);
      setReadError(null);
    } catch (error) {
      setReadError(error instanceof Error ? error.message : "Unable to mark notification as read.");
    }
  }

  async function markAll() {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Sign in to update notifications.");
      const { data, error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null)
        .select("id");
      const updatedIds = new Set(getUpdatedNotificationIds({ data, error }));
      const readAt = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => updatedIds.has(n.id) ? { ...n, read_at: readAt } : n),
      );
      reportNotificationsRead?.(updatedIds.size);
      setReadError(null);
    } catch (error) {
      setReadError(error instanceof Error ? error.message : "Unable to mark notifications as read.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <StudentPageTitle title="Notifications" />
        <button
          type="button"
          onClick={() => void markAll()}
          className="text-xs font-medium text-[var(--primary)]"
        >
          Mark all read
        </button>
      </div>
      {readError && (
        <p role="alert" className="text-sm text-[var(--error)]">
          {readError}
        </p>
      )}
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
                    ? "border-[var(--border)] bg-[var(--surface)]"
                    : "border-[color-mix(in_srgb,var(--primary)_38%,var(--border))] bg-[var(--primary-soft)]"
                }`}
              >
                <NotificationSender
                  name={n.sender_name}
                  role={n.sender_role}
                  organizationName={n.sender_organization_name}
                  avatarPath={n.sender_avatar_path}
                />
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
