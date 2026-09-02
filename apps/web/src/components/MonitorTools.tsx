"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ManualAttendancePanel } from "@/components/ManualAttendancePanel";

interface StudentOption {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
}

export function MonitorTools({ eventId }: { eventId: string }) {
  const [absent, setAbsent] = useState<StudentOption[]>([]);

  useEffect(() => {
    if (!eventId) return;

    async function load() {
      const supabase = createClient();

      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("student_id")
        .eq("event_id", eventId)
        .in("status", ["checked_in", "late"]);

      const checkedIds = new Set((attendance ?? []).map((a) => a.student_id));

      const { data: students } = await supabase
        .from("students")
        .select("id, student_id, first_name, last_name, users!inner(status)")
        .eq("users.status", "active");

      setAbsent(
        (students ?? [])
          .filter((s) => !checkedIds.has(s.id))
          .map((s) => ({
            id: s.id as string,
            student_id: s.student_id as string,
            first_name: s.first_name as string,
            last_name: s.last_name as string,
          })),
      );
    }

    void load();
  }, [eventId]);

  return (
    <ManualAttendancePanel eventId={eventId} absentStudents={absent} />
  );
}
