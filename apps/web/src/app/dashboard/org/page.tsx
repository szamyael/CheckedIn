import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, CalendarPlus, LayoutGrid, Radio, Trophy } from "lucide-react";
import { DashboardPageHeader, DashboardSection, DashboardStat } from "@/components/DashboardUi";
import { format } from "date-fns";

export default async function OrgDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "org_member" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: staffProfile } = await supabase
    .from("staff_profiles")
    .select("organization_id, organizations(name)")
    .eq("id", user!.id)
    .maybeSingle();
  const organizationId = staffProfile?.organization_id;
  const organization = Array.isArray(staffProfile?.organizations)
    ? staffProfile?.organizations[0]
    : staffProfile?.organizations;
  const now = new Date().toISOString();
  const eventQuery = supabase.from("events").select("id, title, venue_name, starts_at, ends_at, status");
  const scopedEvents = organizationId ? eventQuery.eq("organization_id", organizationId) : eventQuery;
  const { data: events } = await scopedEvents.order("starts_at", { ascending: true });
  const ownEvents = events ?? [];
  const publishedEvents = ownEvents.filter((event) => event.status === "published");
  const upcomingEvents = publishedEvents.filter((event) => event.ends_at >= now);
  const { count: badgeCount } = organizationId
    ? await supabase.from("org_badges").select("*", { count: "exact", head: true }).eq("organization_id", organizationId)
    : { count: 0 };

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        eyebrow="ORGANIZATION OPERATIONS"
        title={organization?.name ? `${organization.name} workspace` : "Organization overview"}
        description="Create trustworthy event experiences, manage QR attendance, and recognize student participation."
        actions={<Link href="/dashboard/events" className="inline-flex min-h-10 items-center gap-2 bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-strong)]"><CalendarPlus className="h-4 w-4" /> Create event</Link>}
      />

      <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        <DashboardStat label="All events" value={ownEvents.length} detail="Created for this organization" />
        <DashboardStat label="Upcoming" value={upcomingEvents.length} detail="Published attendance windows" />
        <DashboardStat label="Badge definitions" value={badgeCount ?? 0} detail="Recognition rules available" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/events"
          className="flex items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--primary)]"
        >
          <Calendar className="h-7 w-7 text-[var(--primary)]" />
          <div>
            <p className="font-semibold">Manage Events</p>
            <p className="text-sm text-slate-700">
              Create calendar events with QR codes
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/org/bingo"
          className="flex items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--primary)]"
        >
          <LayoutGrid className="h-7 w-7 text-[var(--primary)]" />
          <div>
            <p className="font-semibold">Bingo &amp; Badges</p>
            <p className="text-sm text-slate-700">
              3×3 card, line &amp; streak rewards
            </p>
          </div>
        </Link>
      </div>

      <DashboardSection title="Upcoming events" description="Open a live monitor once the attendance window begins.">
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {upcomingEvents.slice(0, 4).map((event) => (
            <div key={event.id} className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[var(--primary-strong)]">{event.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{event.venue_name} &middot; {format(new Date(event.starts_at), "EEE, MMM d · h:mm a")}</p>
              </div>
              <Link href={`/dashboard/monitor?event=${event.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 border border-[var(--primary)] px-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-soft)]"><Radio className="h-4 w-4" /> Monitor</Link>
            </div>
          ))}
          {upcomingEvents.length === 0 && <div className="px-5 py-8 text-sm text-[var(--muted)]">No published events are scheduled yet. Create an event to begin.</div>}
        </div>
      </DashboardSection>

      <DashboardSection title="Organization workflow" description="Plan the event, run attendance, then recognize participation.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { href: "/dashboard/events", label: "Plan events", description: "Create events and manage QR attendance.", icon: Calendar },
            { href: "/dashboard/monitor", label: "Run attendance", description: "Monitor check-in, breaks, and checkout.", icon: Radio },
            { href: "/dashboard/org/bingo", label: "Recognize participation", description: "Configure bingo cards and badges.", icon: Trophy },
          ].map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href} className="border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--primary)]">
              <Icon className="h-5 w-5 text-[var(--primary)]" />
              <p className="mt-4 font-semibold text-[var(--primary-strong)]">{label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
            </Link>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
