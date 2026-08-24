"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isStudentOnboardingComplete } from "@/lib/student/onboarding";
import { isStudentTermsAccepted } from "@/lib/student/terms";
import { StudentShell } from "@/components/student/StudentShell";

/** Authenticated student chrome with bottom nav (Home / Events / Profile). */
export function StudentAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

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
      if (!user) {
        router.replace("/student/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, status")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "student") {
        router.replace("/dashboard");
        return;
      }

      if (profile.status === "pending") setPending(true);
      if (profile.status === "disabled") {
        setError("This account has been disabled.");
        await supabase.auth.signOut();
        router.replace("/student/login");
        return;
      }

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);

      setUnread(count ?? 0);
      setReady(true);

      channel = supabase
        .channel(`student-notif-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => setUnread((n) => n + 1),
        )
        .subscribe();
    }

    void boot();
    return () => {
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
    <StudentShell notificationCount={unread} onSignOut={() => void signOut()}>
      {pending && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Your account is pending admin approval. You can browse, but check-in
          may be limited until approved.
        </div>
      )}
      {children}
    </StudentShell>
  );
}
