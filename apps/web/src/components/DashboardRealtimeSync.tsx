"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const realtimeTables = [
  "users",
  "students",
  "staff_profiles",
  "organizations",
  "organization_programs",
  "events",
  "attendance_records",
  "bingo_cards",
  "bingo_cells",
  "org_badges",
  "student_bingo_cells",
  "student_org_badges",
  "student_achievements",
  "notifications",
  "system_settings",
] as const;

export function DashboardRealtimeSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("dashboard-realtime");

    for (const table of realtimeTables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => router.refresh(),
      );
    }

    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}