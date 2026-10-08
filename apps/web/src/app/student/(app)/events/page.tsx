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
    <div className="mx-auto max-w-5xl space-y-7">
      <header><p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)]">CAMPUS CALENDAR</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">Events</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Find an event, check the details, and scan the organizer&apos;s QR when attendance opens.</p></header>
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
  const open = false;
  return <Link href={`/student/events/${event.id}`} className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-card)]"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-[var(--text-strong)]">{event.title}</h3>{open && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-800"><Radio size={11} aria-hidden="true" />LIVE</span>}</div><p className="mt-2 text-sm text-[var(--muted)]">{event.description || "Campus event"}</p></div><ChevronRight size={20} className="mt-1 shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--border)] pt-4 text-xs font-medium text-[var(--foreground)]"><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} className="text-[var(--primary)]" aria-hidden="true" />{format(parseISO(event.starts_at), "MMM d · h:mm a")}</span><span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-[var(--primary)]" aria-hidden="true" />{event.venue_name || "Venue TBA"}</span></div><p className={`mt-3 text-xs font-semibold ${open ? "text-emerald-700" : "text-[var(--muted)]"}`}>{open ? "Attendance is open" : `Check-in opens ${format(parseISO(opensAt), "MMM d · h:mm a")}`}</p></Link>;
}
