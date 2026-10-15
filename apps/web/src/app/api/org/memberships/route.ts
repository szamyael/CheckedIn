import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { normalizeProgram } from "@/lib/org-membership";

type MembershipAction = "activate" | "disable";

export async function POST(request: Request) {
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
  if (body.action !== "activate" && body.action !== "disable") {
    return NextResponse.json({ error: 'action must be "activate" or "disable"' }, { status: 400 });
  }
  const requestedIds = Array.isArray(body.studentIds)
    ? [...new Set(body.studentIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const organizationId = staff?.organization_id;
  if (!organizationId && profile.role !== "admin") {
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

  let studentQuery = admin
    .from("students")
    .select("id, program")
    .in("id", requestedIds.length ? requestedIds : ["00000000-0000-0000-0000-000000000000"]);
  if (requestedIds.length === 0) {
    studentQuery = admin.from("students").select("id, program");
  }
  const { data: students, error: studentError } = await studentQuery;
  if (studentError) return NextResponse.json({ error: studentError.message }, { status: 400 });
  const mappedStudentIds = (students ?? [])
    .filter((student) => mappedPrograms.has(normalizeProgram(student.program)))
    .map((student) => student.id);

  let eligibleIds = mappedStudentIds;
  if (body.action === "activate" && mappedStudentIds.length > 0) {
    const { data: paid, error: paidError } = await admin
      .from("organization_memberships")
      .select("student_id")
      .eq("organization_id", organizationId)
      .not("paid_at", "is", null)
      .in("student_id", mappedStudentIds);
    if (paidError) return NextResponse.json({ error: paidError.message }, { status: 400 });
    eligibleIds = (paid ?? []).map((membership) => membership.student_id);
  }

  if (eligibleIds.length === 0) return NextResponse.json({ success: true, updated: 0 });
  const updates = body.action === "activate"
    ? { status: "active", disabled_at: null, account_status_reason: null }
    : { status: "disabled", disabled_at: new Date().toISOString(), account_status_reason: "Membership disabled by organization" };
  const { error } = await admin.from("users").update(updates).in("id", eligibleIds).eq("role", "student");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, updated: eligibleIds.length });
}
