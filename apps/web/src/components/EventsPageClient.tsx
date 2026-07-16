"use client";

import { useMemo, useState } from "react";
import { CreateEventForm } from "@/components/CreateEventForm";
import { EditEventForm } from "@/components/EditEventForm";
import { EventQrCode } from "@/components/EventQrCode";
import { EventSecurityControls } from "@/components/EventSecurityControls";
import { EventsCalendar } from "@/components/EventsCalendar";
import { format, isAfter, isBefore, isWithinInterval } from "date-fns";
import type { Event } from "@/lib/types";
import Link from "next/link";

type ListCategory = "upcoming" | "ended";
type ViewMode = "list" | "calendar";

function isEnded(event: Event, now: Date) {
  return isBefore(new Date(event.ends_at), now);
}

function isUpcomingOrOngoing(event: Event, now: Date) {
  return !isEnded(event, now);
}

function statusLabel(event: Event, now: Date) {
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);
  if (isBefore(end, now)) return "Ended";
  if (isWithinInterval(now, { start, end })) return "Ongoing";
  if (isAfter(start, now)) return "Upcoming";
  return event.status;
}

export function EventsPageClient({ events }: { events: Event[] }) {
  const [view, setView] = useState<ViewMode>("list");
  const [category, setCategory] = useState<ListCategory>("upcoming");
  const now = useMemo(() => new Date(), []);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => isUpcomingOrOngoing(e, now))
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
    [events, now],
  );

  const endedEvents = useMemo(
    () =>
      events
        .filter((e) => isEnded(e, now))
        .sort(
          (a, b) =>
            new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime(),
        ),
    [events, now],
  );

  const listedEvents = category === "upcoming" ? upcomingEvents : endedEvents;
  const publishedUpcoming = upcomingEvents.filter(
    (e) => e.status === "published",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Events Calendar</h1>
        <p className="mt-1 text-sm text-slate-700">
          Create events and share QR codes for student attendance.
        </p>
      </div>

      <CreateEventForm />

      {publishedUpcoming.length > 0 && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Active event QR codes
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Upcoming and ongoing published events. Display these for students to
            scan in the mobile app.
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {publishedUpcoming.map((event) => (
              <EventQrCode
                key={event.id}
                qrToken={event.qr_token}
                eventTitle={event.title}
                venueName={event.venue_name}
                startsAt={event.starts_at}
              />
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">All Events</h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-slate-200 p-1 text-sm">
            <button
              type="button"
              onClick={() => setCategory("upcoming")}
              className={`rounded-md px-3 py-1 ${
                category === "upcoming" ? "bg-teal-600 text-white" : ""
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setCategory("ended")}
              className={`rounded-md px-3 py-1 ${
                category === "ended" ? "bg-teal-600 text-white" : ""
              }`}
            >
              Ended ({endedEvents.length})
            </button>
          </div>
          <div className="flex rounded-lg border border-slate-200 p-1 text-sm">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-md px-3 py-1 ${
                view === "list" ? "bg-blue-600 text-white" : ""
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={`rounded-md px-3 py-1 ${
                view === "calendar" ? "bg-blue-600 text-white" : ""
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        {category === "upcoming"
          ? "Showing upcoming and ongoing events."
          : "Showing events that have already ended."}
      </p>

      {listedEvents.length === 0 ? (
        <p className="text-sm text-slate-700">
          {category === "upcoming"
            ? "No upcoming or ongoing events."
            : "No ended events yet."}
        </p>
      ) : view === "calendar" ? (
        <EventsCalendar events={listedEvents} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {listedEvents.map((event) => (
            <EventCard key={event.id} event={event} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, now }: { event: Event; now: Date }) {
  const label = statusLabel(event, now);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{event.title}</h3>
          <p className="mt-1 text-sm text-slate-700">{event.venue_name}</p>
          <p className="mt-2 text-xs text-slate-600">
            {format(new Date(event.starts_at), "MMM d, yyyy h:mm a")}
            {" — "}
            {format(new Date(event.ends_at), "h:mm a")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
              {event.status}
            </span>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                label === "Ongoing"
                  ? "bg-green-100 text-green-800"
                  : label === "Upcoming"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-200 text-slate-700"
              }`}
            >
              {label}
            </span>
          </div>
          <div className="mt-2">
            <EditEventForm event={event} />
          </div>
          {event.status === "published" && label !== "Ended" && (
            <Link
              href={`/dashboard/monitor?event=${event.id}`}
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Live monitor →
            </Link>
          )}
          <EventSecurityControls event={event} />
        </div>
        {event.status === "published" && label !== "Ended" && (
          <EventQrCode
            qrToken={event.qr_token}
            eventTitle={event.title}
            venueName={event.venue_name}
            startsAt={event.starts_at}
            compact
          />
        )}
      </div>
    </div>
  );
}
