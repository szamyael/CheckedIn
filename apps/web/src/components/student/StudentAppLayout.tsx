"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isStudentOnboardingComplete } from "@/lib/student/onboarding";
import { isStudentTermsAccepted } from "@/lib/student/terms";
import { StudentShell } from "@/components/student/StudentShell";
import { playNotificationSound } from "@/lib/notification-sound";
import type { NotificationPopupItem } from "@/components/NotificationPopup";

/** Authenticated student chrome with bottom nav (Home / Events / Profile). */
export function StudentAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<NotificationPopupItem | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function boot() {
      if (!isStudentOnboardingComplete()) {
        router.replace("/student/onboarding");
        return;
      }
      if (!isStudentTermsAccepted()) {
        router.replace("/student/terms");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/student/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, status, account_status_reason")
        .eq("id", user.id)
        .single();
      if (cancelled) return;

      if (profile?.role !== "student") {
        router.replace("/dashboard");
        return;
      }

      if (profile.status !== "active") {
        const reason = profile.account_status_reason ? ` Reason: ${profile.account_status_reason}` : "";
        setError(profile.status === "pending"
          ? "Your account is still under review. Contact your program's organization to settle your account status."
          : `Your account is suspended. Contact your program's organization to settle your account status.${reason}`);
        await supabase.auth.signOut();
        if (cancelled) return;
        router.replace("/student/login");
        return;
      }

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (cancelled) return;

      setUnread(count ?? 0);
      setReady(true);

      const nextChannel = supabase
        .channel(`student-notif-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const notification = payload.new as NotificationPopupItem;
            setUnread((n) => n + 1);
            setPopup(notification);
            playNotificationSound();
          },
        )
        .subscribe();

      if (cancelled) {
        await supabase.removeChannel(nextChannel);
        return;
      }
      channel = nextChannel;
    }

    void boot();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/student/login");
  }

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-teal-500/30 border-t-teal-500" />
      </div>
    );
  }

  return (
    <StudentShell
      notificationCount={unread}
      notificationPopup={popup}
      onDismissNotification={() => setPopup(null)}
      onSignOut={() => void signOut()}
    >
      {children}
    </StudentShell>
  );
}
