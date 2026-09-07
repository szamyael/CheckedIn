"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, Radio } from "lucide-react";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { StudentEvent } from "@/lib/student/api";
import { StudentEmptyState } from "@/components/student/StudentUi";

export default function StudentEventsPage() {
  const [events, setEvents] = useState<StudentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await createClient().from("events").select("id,title,description,venue_name,starts_at,ends_at,attendance_starts_at,attendance_ends_at,latitude,longitude,location_radius_m,requires_otp,status").eq("status", "published").gte("ends_at", new Date().toISOString()).order("starts_at", { ascending: true });
      setEvents((data as StudentEvent[]) ?? []);
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) return <p className="text-sm text-[#697178]">Loading your events…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header><p className="text-xs font-semibold tracking-[0.14em] text-[#697178]">CAMPUS CALENDAR</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0c2238]">Events</h1><p className="mt-2 text-sm leading-6 text-[#697178]">Find an event, check the details, and scan the organizer&apos;s QR when attendance opens.</p></header>
      {events.length === 0 ? <StudentEmptyState message="No upcoming published events." /> : <>
        <EventSection title="Upcoming events">{events.map((event) => <EventRow key={event.id} event={event} />)}</EventSection>
      </>}
    </div>
  );
}

function EventSection({ title, children, live = false }: { title: string; children: React.ReactNode; live?: boolean }) {
  return <section><div className="mb-3 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${live ? "bg-[#237a57]" : "bg-[#c18a2e]"}`} /><h2 className="text-xs font-semibold tracking-[0.12em] text-[#697178]">{title.toUpperCase()}</h2></div><div className="space-y-3">{children}</div></section>;
}

function EventRow({ event }: { event: StudentEvent }) {
  const opensAt = event.attendance_starts_at ?? event.starts_at;
  const closesAt = event.attendance_ends_at ?? event.ends_at;
  const open = false;
  return <Link href={`/student/events/${event.id}`} className="group block border border-[#e2e5e7] bg-white p-5 hover:border-[#17324d]"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-[#0c2238]">{event.title}</h3>{open && <span className="inline-flex items-center gap-1 border border-[#bcd9cc] bg-[#eef7f2] px-2 py-1 text-[10px] font-bold tracking-wide text-[#237a57]"><Radio size={11} />LIVE</span>}</div><p className="mt-2 text-sm text-[#697178]">{event.description || "Campus event"}</p></div><ChevronRight size={20} className="mt-1 shrink-0 text-[#697178] transition-transform group-hover:translate-x-0.5" /></div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e2e5e7] pt-4 text-xs font-medium text-[#3f484f]"><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} className="text-[#17324d]" />{format(parseISO(event.starts_at), "MMM d · h:mm a")}</span><span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-[#17324d]" />{event.venue_name || "Venue TBA"}</span></div><p className={`mt-3 text-xs font-semibold ${open ? "text-[#237a57]" : "text-[#697178]"}`}>{open ? "Attendance is open" : `Check-in opens ${format(parseISO(opensAt), "MMM d · h:mm a")}`}</p></Link>;
}
