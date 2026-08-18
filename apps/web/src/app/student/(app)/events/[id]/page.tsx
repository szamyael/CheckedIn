"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { StudentEvent } from "@/lib/student/api";
import {
  StudentCard,
  StudentPageTitle,
  studentPrimaryButtonClass,
} from "@/components/student/StudentUi";

export default function StudentEventDetailPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<StudentEvent | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("events")
        .select(
          "id,title,description,venue_name,starts_at,ends_at,attendance_starts_at,attendance_ends_at,latitude,longitude,location_radius_m,requires_otp,status",
        )
        .eq("id", params.id)
        .single();
      setEvent(data as StudentEvent | null);
    }
    void load();
  }, [params.id]);

  if (!event) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const openStart = parseISO(
    event.attendance_starts_at ?? event.starts_at,
  ).getTime();
  const openEnd = parseISO(event.attendance_ends_at ?? event.ends_at).getTime();
  const now = Date.now();
  const isOpen = now >= openStart && now <= openEnd;

  return (
    <div className="space-y-4">
      <Link href="/student/events" className="text-sm text-teal-600">
        ← Events
      </Link>
      <StudentPageTitle
        title={event.title}
        subtitle={event.venue_name ?? "Venue TBA"}
      />
      {event.description && (
        <StudentCard>
          <p className="text-sm text-slate-600">{event.description}</p>
        </StudentCard>
      )}
      <StudentCard>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-28 text-slate-500">Starts</dt>
            <dd>{format(parseISO(event.starts_at), "MMM d, yyyy • h:mm a")}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 text-slate-500">Ends</dt>
            <dd>{format(parseISO(event.ends_at), "MMM d, yyyy • h:mm a")}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 text-slate-500">Check-in</dt>
            <dd>
              {format(new Date(openStart), "MMM d • h:mm a")} –{" "}
              {format(new Date(openEnd), "h:mm a")}
            </dd>
          </div>
        </dl>
      </StudentCard>
      <Link
        href="/student/attendance/scan"
        className={`${studentPrimaryButtonClass} ${
          isOpen ? "" : "pointer-events-none bg-slate-300 hover:bg-slate-300"
        }`}
      >
        {isOpen ? "Scan QR to check in or out" : "Check-in not open yet"}
      </Link>
    </div>
  );
}
