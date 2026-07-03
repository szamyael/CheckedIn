import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LiveAttendanceMonitor } from "@/components/LiveAttendanceMonitor";
import { MonitorTools } from "@/components/MonitorTools";
import { EventSelector } from "@/components/EventSelector";

export default async function MonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("status", "published")
    .order("starts_at", { ascending: false });

  const selected = events?.find((e) => e.id === eventId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Attendance Monitor</h1>
        <p className="mt-1 text-sm text-slate-700">
          Watch check-ins appear in real time during an active event.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Event</label>
        <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />}>
          <EventSelector events={events ?? []} basePath="/dashboard/monitor" />
        </Suspense>
      </div>

      {eventId && selected && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">{selected.title}</h2>
            <LiveAttendanceMonitor eventId={eventId} />
          </div>
          <MonitorTools eventId={eventId} />
        </div>
      )}
    </div>
  );
}
