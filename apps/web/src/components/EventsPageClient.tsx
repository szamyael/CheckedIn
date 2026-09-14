"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isBefore, isWithinInterval } from "date-fns";
import { CalendarDays, CalendarRange, ChevronRight, Clock3, List, MapPin, Radio, Search, ShieldCheck } from "lucide-react";
import { CreateEventForm } from "@/components/CreateEventForm";
import { EditEventForm } from "@/components/EditEventForm";
import { EventsCalendar } from "@/components/EventsCalendar";
import { DashboardPageHeader, DashboardSection } from "@/components/DashboardUi";
import { EventStreamModal } from "@/components/EventStreamModal";
import type { Event } from "@/lib/types";

type ListCategory = "upcoming" | "ended";
type ViewMode = "list" | "calendar";
type EventMoment = "Upcoming" | "Ongoing" | "Ended";

function eventMoment(event: Event, now: Date): EventMoment {
  const start = new Date(event.starts_at); const end = new Date(event.ends_at);
  if (isBefore(end, now)) return "Ended";
  if (isWithinInterval(now, { start, end })) return "Ongoing";
  return "Upcoming";
}

function statusClass(moment: EventMoment) {
  if (moment === "Ongoing") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (moment === "Upcoming") return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function EventsPageClient({ events, canCreate = false, organizationId = null }: { events: Event[]; canCreate?: boolean; organizationId?: string | null }) {
  const [view, setView] = useState<ViewMode>("list");
  const [category, setCategory] = useState<ListCategory>("upcoming");
  const [query, setQuery] = useState("");
  const now = useMemo(() => new Date(), []);
  const { upcomingEvents, endedEvents } = useMemo(() => {
    const upcoming: Event[] = []; const ended: Event[] = [];
    events.forEach((event) => eventMoment(event, now) === "Ended" ? ended.push(event) : upcoming.push(event));
    upcoming.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    ended.sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());
    return { upcomingEvents: upcoming, endedEvents: ended };
  }, [events, now]);
  const listedEvents = category === "upcoming" ? upcomingEvents : endedEvents;
  const matchingEvents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return listedEvents;
    return listedEvents.filter((event) => [event.title, event.venue_name, event.venue_address, event.status].filter(Boolean).some((value) => value!.toLowerCase().includes(term)));
  }, [listedEvents, query]);
  const publishedUpcoming = upcomingEvents.filter((event) => event.status === "published");

  return <div className="space-y-8">
    <DashboardPageHeader eyebrow="EVENT OPERATIONS" title="Events" description={canCreate ? "Plan events, open attendance, and keep every event operation in one focused workspace." : "Review event schedules, follow attendance activity, and access the live monitor when an event is underway."} />
    {canCreate && <CreateEventForm initialOrganizationId={organizationId} />}
    {!canCreate && <p className="border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted)]">Event creation is limited to Organization accounts. Use reports and the live monitor for attendance oversight.</p>}
    {publishedUpcoming.length > 0 && <DashboardSection title="Ready to display" description="Published QR credentials available for scheduled and ongoing events."><div className="grid gap-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 md:grid-cols-[auto_1fr] md:items-center"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white"><Radio size={20} /></div><p className="text-sm leading-6 text-slate-600">Open an event stream when you are ready to display its large QR code and shared attendance OTP to students.</p></div></DashboardSection>}
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)]">EVENT DIRECTORY</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--primary-strong)]">All events</h2></div><label className="relative block w-full lg:w-80"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, venue, or status" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" /></label></div>
        <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div role="tablist" aria-label="Event timing" className="inline-flex w-fit rounded-xl bg-slate-100 p-1"><button role="tab" aria-selected={category === "upcoming"} type="button" onClick={() => setCategory("upcoming")} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${category === "upcoming" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Upcoming <span className="ml-1.5 text-xs tabular-nums text-slate-400">{upcomingEvents.length}</span></button><button role="tab" aria-selected={category === "ended"} type="button" onClick={() => setCategory("ended")} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${category === "ended" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Ended <span className="ml-1.5 text-xs tabular-nums text-slate-400">{endedEvents.length}</span></button></div><div className="inline-flex w-fit rounded-xl border border-slate-200 p-1"><button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} className={`rounded-lg p-2 transition ${view === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}><List size={17} /></button><button type="button" aria-label="Calendar view" aria-pressed={view === "calendar"} onClick={() => setView("calendar")} className={`rounded-lg p-2 transition ${view === "calendar" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}><CalendarRange size={17} /></button></div></div>
      </div>
      {matchingEvents.length === 0 ? <EmptyEvents category={category} hasQuery={Boolean(query.trim())} /> : view === "calendar" ? <div className="p-5 sm:p-6"><EventsCalendar events={matchingEvents} /></div> : <div className="divide-y divide-slate-100">{matchingEvents.map((event) => <EventRow key={event.id} event={event} now={now} />)}</div>}
    </section>
  </div>;
}

function EmptyEvents({ category, hasQuery }: { category: ListCategory; hasQuery: boolean }) {
  const title = hasQuery ? "No matching events" : category === "upcoming" ? "No upcoming events" : "No ended events yet";
  const detail = hasQuery ? "Try a different title, venue, or status." : category === "upcoming" ? "Newly scheduled and live events will appear here." : "Completed events will remain here for review and reporting.";
  return <div className="grid place-items-center px-5 py-16 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><CalendarDays size={22} /></div><h3 className="mt-4 font-semibold text-slate-900">{title}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{detail}</p></div>;
}

function EventRow({ event, now }: { event: Event; now: Date }) {
  const [streaming, setStreaming] = useState(false);
  const moment = eventMoment(event, now); const canOperate = event.status === "published" && moment !== "Ended";
  const start = new Date(event.starts_at); const end = new Date(event.ends_at);
  return <article className="group px-5 py-5 transition hover:bg-slate-50 sm:px-6"><div className="flex flex-col gap-5 xl:flex-row xl:items-center"><div className="flex shrink-0 items-start gap-3 xl:w-40"><div className="grid min-w-14 rounded-xl border border-slate-200 bg-white py-2 text-center shadow-sm"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{format(start, "MMM")}</span><span className="text-xl font-bold leading-6 text-slate-900">{format(start, "d")}</span></div><div className="pt-1 xl:hidden"><p className="text-sm font-semibold text-slate-900">{format(start, "EEE, MMM d")}</p><p className="mt-0.5 text-xs text-slate-500">{format(start, "h:mm a")} – {format(end, "h:mm a")}</p></div></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-semibold text-slate-900">{event.title}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClass(moment)}`}>{moment}</span>{event.requires_otp && <span title="OTP required" className="grid h-6 w-6 place-items-center rounded-full bg-amber-50 text-amber-700"><ShieldCheck size={14} /></span>}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{format(start, "h:mm a")} – {format(end, "h:mm a")}</span><span className="inline-flex items-center gap-1.5"><MapPin size={15} />{event.venue_name}</span></div>{event.description && <p className="mt-2 line-clamp-1 text-sm text-slate-500">{event.description}</p>}</div><div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end"><span className="mr-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium capitalize text-slate-600">{event.status}</span>{canOperate && <><Link href={`/dashboard/monitor?event=${event.id}`} className="rounded-lg px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50">Monitor</Link><button type="button" onClick={() => setStreaming(true)} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">Open stream <ChevronRight size={15} /></button></>}<EditEventForm event={event} /></div></div>{streaming && <EventStreamModal event={event} onClose={() => setStreaming(false)} />}</article>;
}
