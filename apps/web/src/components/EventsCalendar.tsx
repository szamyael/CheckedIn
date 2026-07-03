"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Event } from "@/lib/types";
import { EventQrCode } from "@/components/EventQrCode";
import { EditEventForm } from "@/components/EditEventForm";
import Link from "next/link";

export function EventsCalendar({ events }: { events: Event[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Event | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of events) {
      const key = format(new Date(event.starts_at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-700">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={key}
                className={`min-h-20 rounded-lg border p-1 text-left ${
                  inMonth
                    ? "border-slate-200 bg-white"
                    : "border-transparent bg-slate-50 text-slate-600"
                } ${isToday ? "ring-2 ring-blue-500" : ""}`}
              >
                <div className="text-xs font-medium">{format(day, "d")}</div>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      title={ev.title}
                      onClick={() => setSelected(ev)}
                      className="block w-full truncate rounded bg-blue-100 px-1 text-left text-[10px] text-blue-800 hover:bg-blue-200"
                    >
                      {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-slate-700">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selected.title}
                </h3>
                <p className="text-sm text-slate-700">{selected.venue_name}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {format(new Date(selected.starts_at), "MMM d, yyyy h:mm a")}
                </p>
                <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                  {selected.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <EditEventForm event={selected} />
            </div>

            {selected.status === "published" ? (
              <div className="mt-6 flex flex-col items-center">
                <EventQrCode
                  qrToken={selected.qr_token}
                  eventTitle={selected.title}
                  venueName={selected.venue_name}
                  startsAt={selected.starts_at}
                />
                <Link
                  href={`/dashboard/monitor?event=${selected.id}`}
                  className="mt-4 text-sm text-blue-600 hover:underline"
                >
                  Open live monitor →
                </Link>
              </div>
            ) : (
              <p className="mt-6 text-sm text-amber-800">
                Publish this event to generate a scannable QR code.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
