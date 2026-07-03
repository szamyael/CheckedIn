"use client";

import { useState } from "react";
import { CreateEventForm } from "@/components/CreateEventForm";
import { EditEventForm } from "@/components/EditEventForm";
import { EventQrCode } from "@/components/EventQrCode";
import { EventSecurityControls } from "@/components/EventSecurityControls";
import { EventsCalendar } from "@/components/EventsCalendar";
import { format } from "date-fns";
import type { Event } from "@/lib/types";
import Link from "next/link";

export function EventsPageClient({ events }: { events: Event[] }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const publishedEvents = events.filter((e) => e.status === "published");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Events Calendar</h1>
        <p className="mt-1 text-sm text-slate-700">
          Create events and share QR codes for student attendance.
        </p>
      </div>

      <CreateEventForm />

      {publishedEvents.length > 0 && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Published event QR codes
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Display or download these for students to scan in the mobile app. Open
            List view for full event details.
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {publishedEvents.map((event) => (
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

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">All Events</h2>
        <div className="flex rounded-lg border border-slate-200 p-1 text-sm">
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`rounded-md px-3 py-1 ${view === "calendar" ? "bg-blue-600 text-white" : ""}`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-md px-3 py-1 ${view === "list" ? "bg-blue-600 text-white" : ""}`}
          >
            List
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-slate-700">No events yet.</p>
      ) : view === "calendar" ? (
        <EventsCalendar events={events} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
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
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
            {event.status}
          </span>
          <div className="mt-2">
            <EditEventForm event={event} />
          </div>
          {event.status === "published" && (
            <Link
              href={`/dashboard/monitor?event=${event.id}`}
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Live monitor →
            </Link>
          )}
          <EventSecurityControls event={event} />
        </div>
        {event.status === "published" && (
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
