import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, CalendarPlus, LayoutGrid, Radio, Trophy } from "@/lib/icons";
import { DashboardPageHeader, DashboardSection, DashboardStat } from "@/components/DashboardUi";
import { OrganizationMembershipPanel } from "@/components/OrganizationMembershipPanel";
import { BroadcastNotificationForm } from "@/components/BroadcastNotificationForm";
import { format } from "date-fns";
import { normalizeProgram } from "@/lib/org-membership";

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
  const { data: mappedPrograms, error: mappedProgramsError } = organizationId
    ? await supabase.from("organization_programs").select("program").eq("organization_id", organizationId)
    : { data: [], error: null };
  if (mappedProgramsError) console.error("Failed to load organization program mappings", mappedProgramsError);
  const mappedProgramKeys = new Set((mappedPrograms ?? []).map((mapping) => normalizeProgram(mapping.program)));
  const { data: studentRows, error: studentsError } = organizationId && mappedProgramKeys.size > 0 && !mappedProgramsError
    ? await supabase
      .from("students")
      .select("id, student_id, first_name, last_name, program, year_level, section, users!inner(status)")
      .order("last_name")
    : { data: [], error: null };
  if (studentsError) console.error("Failed to load mapped organization students", studentsError);
  const studentIds = (studentRows ?? []).map((student) => student.id);
  const { data: membershipRows, error: membershipsError } = organizationId && studentIds.length > 0
    ? await supabase
      .from("organization_memberships")
      .select("student_id, paid_at")
      .eq("organization_id", organizationId)
      .in("student_id", studentIds)
    : { data: [], error: null };
  if (membershipsError) console.error("Failed to load organization membership payment records", membershipsError);
  const paidByStudentId = new Map((membershipRows ?? []).map((membership) => [membership.student_id, membership.paid_at]));
  const membershipStudents = (studentRows ?? []).filter((student) =>
    mappedProgramKeys.has(normalizeProgram(student.program)),
  ).map((student) => {
    const userRow = Array.isArray(student.users) ? student.users[0] : student.users;
    return { ...student, status: userRow?.status ?? "unknown", paid_at: paidByStudentId.get(student.id) ?? null };
  });
  const membershipError = mappedProgramsError || studentsError || membershipsError
    ? "Student membership data could not be loaded. Please refresh and try again."
    : null;

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        eyebrow="ORGANIZATION OPERATIONS"
        title={organization?.name ? `${organization.name} workspace` : "Organization overview"}
        description="Create trustworthy event experiences, manage QR attendance, and recognize student participation."
        actions={<Link href="/dashboard/events" className="inline-flex min-h-10 items-center gap-2 bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--action-background)]"><CalendarPlus className="h-4 w-4" /> Create event</Link>}
      />

      <div className="grid grid-cols-2 gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
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

      {organizationId && <OrganizationMembershipPanel students={membershipStudents} loadError={membershipError} />}

      {profile?.role === "org_member" && (
        <DashboardSection
          title="Broadcast to mapped students"
          description="Announcements are delivered only to active students whose program is mapped to your organization."
        >
          <BroadcastNotificationForm audience="organization" />
        </DashboardSection>
      )}

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
