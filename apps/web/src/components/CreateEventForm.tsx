"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formPlaceholders } from "@/lib/form-placeholders";
import { useAsyncAction } from "@/lib/useAsyncAction";
import {
  EventLocationPicker,
  type EventLocation,
} from "@/components/EventLocationPicker";
import { EventScheduleFieldsInput } from "@/components/EventScheduleFields";
import { DEFAULT_MAP_CENTER } from "@/lib/campus-locations";
import {
  defaultEventSchedule,
  scheduleFieldsToIso,
  validateEventSchedule,
} from "@/lib/event-form";

export function CreateEventForm({
  initialOrganizationId = null,
}: {
  initialOrganizationId?: string | null;
}) {
  const router = useRouter();
  const run = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(
    initialOrganizationId,
  );
  const [userRole, setUserRole] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationRadiusM, setLocationRadiusM] = useState(100);
  const [status, setStatus] = useState("published");
  const [schedule, setSchedule] = useState(defaultEventSchedule);
  const [attendanceCustomized, setAttendanceCustomized] = useState(false);

  const [location, setLocation] = useState<EventLocation>({
    venueName: "",
    address: "",
    latitude: DEFAULT_MAP_CENTER.lat,
    longitude: DEFAULT_MAP_CENTER.lng,
  });

  const scheduleValidation = validateEventSchedule(schedule);
  const canSubmit =
    title.trim().length > 0 &&
    location.venueName.trim().length > 0 &&
    scheduleValidation.valid;

  useEffect(() => {
    if (initialOrganizationId) {
      setOrganizationId(initialOrganizationId);
    }

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

      if (!initialOrganizationId && (profile?.role === "org_member" || profile?.role === "admin")) {
        const { data: staff } = await supabase
          .from("staff_profiles")
          .select("organization_id")
          .eq("id", user.id)
          .maybeSingle();
        setOrganizationId(staff?.organization_id ?? null);
      }
    }

    void loadProfile();
  }, [initialOrganizationId]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setLocationRadiusM(100);
    setStatus("published");
    setSchedule(defaultEventSchedule());
    setAttendanceCustomized(false);
    setLocation({
      venueName: "",
      address: "",
      latitude: DEFAULT_MAP_CENTER.lat,
      longitude: DEFAULT_MAP_CENTER.lng,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (userRole === "faculty") {
      setError(
        "Faculty accounts cannot create events. Organizations manage the event calendar.",
      );
      return;
    }

    if (userRole !== "org_member" && userRole !== "admin") {
      setError("Only organization accounts can create events.");
      return;
    }

    if (userRole === "org_member" && !organizationId) {
      setError(
        "Your account is not linked to an organization. Ask an admin to assign you before creating events.",
      );
      return;
    }

    if (!location.venueName.trim()) {
      setError("Venue name is required.");
      return;
    }

    if (!scheduleValidation.valid) {
      setError(scheduleValidation.errors[0] ?? "Fix schedule errors before saving.");
      return;
    }

    try {
      await run("Creating event…", async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Not authenticated");

        const { data: settings } = await supabase
          .from("system_settings")
          .select("default_requires_otp")
          .eq("id", 1)
          .maybeSingle();

        const times = scheduleFieldsToIso(schedule);

        const { error: insertError } = await supabase.from("events").insert({
          title: title.trim(),
          description: description.trim() || null,
          venue_name: location.venueName.trim(),
          venue_address: location.address.trim() || null,
          latitude: location.latitude,
          longitude: location.longitude,
          location_radius_m: locationRadiusM,
          ...times,
          status,
          requires_otp: settings?.default_requires_otp ?? false,
          created_by: user.id,
          organization_id: organizationId,
        });

        if (insertError) throw new Error(insertError.message);
      });

      router.refresh();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
    }
  }

  if (userRole === "faculty") {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-blue-700">EVENT SETUP</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">Create an event</h2>
        <p className="mt-1 text-sm text-slate-600">Add the essentials first, then set the attendance location and schedule.</p>
      </div>

      {organizationId && (
        <p className="text-xs text-slate-700">
          This event will be linked to your organization and published
          immediately when you choose Published.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
        <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={formPlaceholders.eventTitle}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
            </div>

            <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={formPlaceholders.eventDescription}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
            </div>

            <div>
          <label className="mb-1 block text-sm font-medium">
            Check-in radius (meters)
          </label>
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
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
            </div>

            <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">Schedule and attendance window</p>
            <EventScheduleFieldsInput
              value={schedule}
              onChange={setSchedule}
              attendanceCustomized={attendanceCustomized}
              onAttendanceCustomizedChange={setAttendanceCustomized}
            />
          </div>
        </section>

        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-4 lg:self-start">
          <EventLocationPicker
            value={location}
            radiusMeters={locationRadiusM}
            onChange={setLocation}
          />
        </aside>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">A venue name, location, and valid schedule are required.</p>
        <button type="submit" disabled={!canSubmit} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Create event</button>
      </div>
    </form>
  );
}
