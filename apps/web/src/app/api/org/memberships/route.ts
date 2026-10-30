import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  membershipActionChanges,
  normalizeProgram,
  type MembershipAction,
} from "@/lib/org-membership";
import { withApiLogging } from "@/lib/api-monitor";

async function updateMemberships(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "org_member" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as { action?: MembershipAction; studentIds?: unknown };
  const actions: MembershipAction[] = ["mark_paid", "mark_unpaid", "activate", "disable"];
  if (!body.action || !actions.includes(body.action)) {
    return NextResponse.json({ error: "Choose a valid membership action" }, { status: 400 });
  }
  const requestedIds = Array.isArray(body.studentIds)
    ? [...new Set(body.studentIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];
  if (requestedIds.length === 0) {
    return NextResponse.json({ error: "Select at least one student" }, { status: 400 });
  }
  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const organizationId = staff?.organization_id;
  if (!organizationId) {
    return NextResponse.json({ error: "Your account is not assigned to an organization" }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data: mappings, error: mappingError } = await admin
    .from("organization_programs")
    .select("program")
    .eq("organization_id", organizationId);
  if (mappingError) return NextResponse.json({ error: mappingError.message }, { status: 400 });
  const mappedPrograms = new Set((mappings ?? []).map((mapping) => normalizeProgram(mapping.program)));

  const studentQuery = admin
    .from("students")
    .select("id, program")
    .in("id", requestedIds);
  const { data: students, error: studentError } = await studentQuery;
  if (studentError) return NextResponse.json({ error: studentError.message }, { status: 400 });
  const mappedStudentIds = (students ?? [])
    .filter((student) => mappedPrograms.has(normalizeProgram(student.program)))
    .map((student) => student.id);
  if (mappedStudentIds.length !== requestedIds.length) {
    return NextResponse.json({ error: "One or more students are not mapped to your organization" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const changes = membershipActionChanges(body.action, now);
  if (body.action === "mark_paid" || body.action === "mark_unpaid") {
    const { data: updated, error } = await admin.rpc("record_organization_students_payment", {
      p_organization_id: organizationId,
      p_student_ids: mappedStudentIds,
      p_paid: body.action === "mark_paid",
      p_updated_by: user.id,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, updated });
  }

  let eligibleIds = mappedStudentIds;
  if (body.action === "activate") {
    const { data: paid, error: paidError } = await admin
      .from("organization_memberships")
      .select("student_id")
      .eq("organization_id", organizationId)
      .not("paid_at", "is", null)
      .in("student_id", mappedStudentIds);
    if (paidError) return NextResponse.json({ error: paidError.message }, { status: 400 });
    eligibleIds = (paid ?? []).map((membership) => membership.student_id);
    if (eligibleIds.length === 0) {
      return NextResponse.json({ error: "Mark the student as paid before activating the account" }, { status: 400 });
    }
  }

  const { data: updatedUsers, error } = await admin
    .from("users")
    .update(changes.userUpdate!)
    .in("id", eligibleIds)
    .eq("role", "student")
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!updatedUsers?.length) {
    return NextResponse.json({ error: "No student accounts were updated" }, { status: 404 });
  }

  return NextResponse.json({ success: true, updated: updatedUsers.length });
}

export const POST = withApiLogging(
  "POST",
  "/api/org/memberships",
  updateMemberships,
);
