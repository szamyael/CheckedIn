"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { StudentEvent } from "@/lib/student/api";
import {
  StudentEmptyState,
  StudentPageTitle,
} from "@/components/student/StudentUi";

export default function StudentEventsPage() {
  const [events, setEvents] = useState<StudentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const now = new Date().toISOString();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: student } = await supabase
        .from("students")
        .select("program")
        .eq("id", user.id)
        .single();

      const program = student?.program?.trim();
      let orgIds: string[] = [];

      if (program) {
        const { data: programMatches } = await supabase
          .from("organization_programs")
          .select("organization_id")
          .eq("program", program);

        orgIds = [...new Set((programMatches ?? []).map((row) => row.organization_id as string))];
      }

      if (orgIds.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("events")
        .select(
          "id,title,description,venue_name,starts_at,ends_at,attendance_starts_at,attendance_ends_at,latitude,longitude,location_radius_m,requires_otp,status",
        )
        .eq("status", "published")
        .gte("ends_at", now)
        .in("organization_id", orgIds)
        .order("starts_at", { ascending: true });

      setEvents((data as StudentEvent[]) ?? []);
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading events…</p>;
  }

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <StudentPageTitle title="Events" />
        <StudentEmptyState message="No upcoming published events." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StudentPageTitle title="Events" />
      <ul className="space-y-3">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/student/events/${event.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300"
            >
              <p className="font-semibold text-slate-900">{event.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {event.venue_name ?? "Venue TBA"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {format(parseISO(event.starts_at), "MMM d, yyyy • h:mm a")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
