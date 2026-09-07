import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LiveAttendanceMonitor } from "@/components/LiveAttendanceMonitor";
import { MonitorTools } from "@/components/MonitorTools";
import { EventSelector } from "@/components/EventSelector";
import { DashboardPageHeader, DashboardSection } from "@/components/DashboardUi";

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
      <DashboardPageHeader eyebrow="REAL-TIME OPERATIONS" title="Live attendance monitor" description="Watch verified check-ins arrive as they happen. Select an event to begin monitoring." />

      <DashboardSection title="Select an event" description="Only published events are available for live attendance monitoring.">
        <label className="mb-1 block text-sm font-medium">Event</label>
        <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />}>
          <EventSelector events={events ?? []} basePath="/dashboard/monitor" />
        </Suspense>
      </DashboardSection>

      {eventId && selected && (
        <div className="space-y-6">
          <DashboardSection title={selected.title} description="Live attendance records update automatically.">
            <LiveAttendanceMonitor eventId={eventId} />
          </DashboardSection>
          <MonitorTools eventId={eventId} />
        </div>
      )}
    </div>
  );
}
