"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  EventLocationPicker,
  type EventLocation,
} from "@/components/EventLocationPicker";
import { DEFAULT_MAP_CENTER } from "@/lib/campus-locations";

export function CreateEventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [location, setLocation] = useState<EventLocation>({
    venueName: "",
    latitude: DEFAULT_MAP_CENTER.lat,
    longitude: DEFAULT_MAP_CENTER.lng,
  });

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role ?? null);

      if (profile?.role !== "org_member") return;

      const { data: staff } = await supabase
        .from("staff_profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      setOrganizationId(staff?.organization_id ?? null);
    }

    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!location.venueName.trim()) {
      setError("Venue name is required.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const form = new FormData(e.currentTarget);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const startsAt = new Date(form.get("starts_at") as string).toISOString();
    const endsAt = new Date(form.get("ends_at") as string).toISOString();
    const attendanceStarts = new Date(
      form.get("attendance_starts_at") as string,
    ).toISOString();
    const attendanceEnds = new Date(
      form.get("attendance_ends_at") as string,
    ).toISOString();

    const { data: settings } = await supabase
      .from("system_settings")
      .select("default_requires_otp")
      .eq("id", 1)
      .maybeSingle();

    const statusInput = form.get("status") as string;
    const status =
      userRole === "org_member" && statusInput === "published"
        ? "pending_approval"
        : statusInput;

    const { error: insertError } = await supabase.from("events").insert({
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      venue_name: location.venueName.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      location_radius_m: parseInt(form.get("location_radius_m") as string, 10),
      starts_at: startsAt,
      ends_at: endsAt,
      attendance_starts_at: attendanceStarts,
      attendance_ends_at: attendanceEnds,
      qr_expires_at: attendanceEnds,
      status,
      requires_otp: settings?.default_requires_otp ?? false,
      created_by: user.id,
      organization_id: organizationId,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.refresh();
    (e.target as HTMLFormElement).reset();
    setLocation({
      venueName: "",
      latitude: DEFAULT_MAP_CENTER.lat,
      longitude: DEFAULT_MAP_CENTER.lng,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">Create Event</h2>

      {organizationId && (
        <p className="text-xs text-slate-700">
          This event will be linked to your organization. Publishing submits it for admin approval.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-800">Title</label>
          <input name="title" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea name="description" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div className="sm:col-span-2">
          <EventLocationPicker value={location} onChange={setLocation} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Check-in radius (meters)</label>
          <input name="location_radius_m" type="number" defaultValue={100} min={10} max={5000} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-slate-700">
            Students must be within this distance of the pin to check in.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select name="status" defaultValue="published" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="draft">Draft</option>
            <option value="published">{userRole === "org_member" ? "Submit for approval" : "Published"}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Event Starts</label>
          <input name="starts_at" type="datetime-local" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Event Ends</label>
          <input name="ends_at" type="datetime-local" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Attendance Opens</label>
          <input name="attendance_starts_at" type="datetime-local" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Attendance Closes (QR expires)</label>
          <input name="attendance_ends_at" type="datetime-local" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Creating…" : "Create Event"}
      </button>
    </form>
  );
}
