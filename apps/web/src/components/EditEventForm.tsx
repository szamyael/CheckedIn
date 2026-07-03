"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/types";
import {
  EventLocationPicker,
  type EventLocation,
} from "@/components/EventLocationPicker";

export function EditEventForm({ event }: { event: Event }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<EventLocation>({
    venueName: event.venue_name,
    latitude: event.latitude,
    longitude: event.longitude,
  });

  function toLocalInput(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!location.venueName.trim()) {
      setError("Venue name is required.");
      setLoading(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("events")
      .update({
        title: form.get("title") as string,
        description: (form.get("description") as string) || null,
        venue_name: location.venueName.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        location_radius_m: parseInt(form.get("location_radius_m") as string, 10),
        starts_at: new Date(form.get("starts_at") as string).toISOString(),
        ends_at: new Date(form.get("ends_at") as string).toISOString(),
        attendance_starts_at: new Date(form.get("attendance_starts_at") as string).toISOString(),
        attendance_ends_at: new Date(form.get("attendance_ends_at") as string).toISOString(),
        qr_expires_at: new Date(form.get("attendance_ends_at") as string).toISOString(),
        status: form.get("status") as string,
      })
      .eq("id", event.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setOpen(false);
    router.refresh();
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
      <input name="title" defaultValue={event.title} required className="w-full rounded border px-2 py-1 text-sm" placeholder="Title" />
      <textarea name="description" defaultValue={event.description ?? ""} rows={2} className="w-full rounded border px-2 py-1 text-sm" placeholder="Description" />
      <EventLocationPicker value={location} onChange={setLocation} compact />
      <input name="location_radius_m" type="number" defaultValue={event.location_radius_m} min={10} max={5000} className="w-full rounded border px-2 py-1 text-sm" placeholder="Radius (m)" />
      <input name="starts_at" type="datetime-local" defaultValue={toLocalInput(event.starts_at)} required className="w-full rounded border px-2 py-1 text-sm" />
      <input name="ends_at" type="datetime-local" defaultValue={toLocalInput(event.ends_at)} required className="w-full rounded border px-2 py-1 text-sm" />
      <input name="attendance_starts_at" type="datetime-local" defaultValue={toLocalInput(event.attendance_starts_at ?? event.starts_at)} required className="w-full rounded border px-2 py-1 text-sm" />
      <input name="attendance_ends_at" type="datetime-local" defaultValue={toLocalInput(event.attendance_ends_at ?? event.ends_at)} required className="w-full rounded border px-2 py-1 text-sm" />
      <select name="status" defaultValue={event.status} className="w-full rounded border px-2 py-1 text-sm">
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
          {loading ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-1 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
