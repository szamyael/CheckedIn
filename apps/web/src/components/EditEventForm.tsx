"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/types";
import {
  EventLocationPicker,
  type EventLocation,
} from "@/components/EventLocationPicker";
import { EventScheduleFieldsInput } from "@/components/EventScheduleFields";
import { formPlaceholders } from "@/lib/form-placeholders";
import { useAsyncAction } from "@/lib/useAsyncAction";
import {
  scheduleFieldsToIso,
  toLocalDatetimeInputValue,
  validateEventSchedule,
  type EventScheduleFields,
} from "@/lib/event-form";

function initialSchedule(event: Event): EventScheduleFields {
  return {
    startsAt: toLocalDatetimeInputValue(event.starts_at),
    endsAt: toLocalDatetimeInputValue(event.ends_at),
    attendanceStartsAt: toLocalDatetimeInputValue(
      event.attendance_starts_at ?? event.starts_at,
    ),
    attendanceEndsAt: toLocalDatetimeInputValue(
      event.attendance_ends_at ?? event.ends_at,
    ),
  };
}

function attendanceIsCustom(event: Event): boolean {
  const schedule = initialSchedule(event);
  return (
    schedule.attendanceStartsAt !== schedule.startsAt ||
    schedule.attendanceEndsAt !== schedule.endsAt
  );
}

export function EditEventForm({ event }: { event: Event }) {
  const router = useRouter();
  const run = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [locationRadiusM, setLocationRadiusM] = useState(event.location_radius_m);
  const [eventStatus, setEventStatus] = useState(event.status);
  const [schedule, setSchedule] = useState(() => initialSchedule(event));
  const [attendanceCustomized, setAttendanceCustomized] = useState(() =>
    attendanceIsCustom(event),
  );

  const [location, setLocation] = useState<EventLocation>({
    venueName: event.venue_name,
    latitude: event.latitude,
    longitude: event.longitude,
  });

  const scheduleValidation = validateEventSchedule(schedule);
  const canSubmit =
    title.trim().length > 0 &&
    location.venueName.trim().length > 0 &&
    scheduleValidation.valid;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!location.venueName.trim()) {
      setError("Venue name is required.");
      return;
    }

    if (!scheduleValidation.valid) {
      setError(scheduleValidation.errors[0] ?? "Fix schedule errors before saving.");
      return;
    }

    try {
      await run("Saving event…", async () => {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const times = scheduleFieldsToIso(schedule);

        const { error: updateError } = await supabase
          .from("events")
          .update({
            title: title.trim(),
            description: description.trim() || null,
            venue_name: location.venueName.trim(),
            latitude: location.latitude,
            longitude: location.longitude,
            location_radius_m: locationRadiusM,
            ...times,
            status: eventStatus,
          })
          .eq("id", event.id);

        if (updateError) throw new Error(updateError.message);
      });

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Edit
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full rounded border px-2 py-1 text-sm"
        placeholder={formPlaceholders.eventTitle}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full rounded border px-2 py-1 text-sm"
        placeholder={formPlaceholders.eventDescription}
      />
      <EventLocationPicker
        value={location}
        radiusMeters={locationRadiusM}
        onChange={setLocation}
        compact
      />
      <input
        type="number"
        value={locationRadiusM}
        onChange={(e) =>
          setLocationRadiusM(
            Math.min(5000, Math.max(10, parseInt(e.target.value, 10) || 10)),
          )
        }
        min={10}
        max={5000}
        className="w-full rounded border px-2 py-1 text-sm"
        placeholder="Radius (m)"
      />
      <EventScheduleFieldsInput
        value={schedule}
        onChange={setSchedule}
        attendanceCustomized={attendanceCustomized}
        onAttendanceCustomizedChange={setAttendanceCustomized}
        compact
      />
      <select
        value={eventStatus}
        onChange={(e) => setEventStatus(e.target.value as Event["status"])}
        className="w-full rounded border px-2 py-1 text-sm"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-1 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
