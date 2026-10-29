import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" || profile.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    const parsedBody: unknown = await request.json();
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    body = parsedBody as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "A valid six-digit admin PIN is required" }, { status: 400 });
  }
  const { data: validPin, error: pinError } = await supabase.rpc("verify_admin_personal_code", { p_code: pin });
  if (pinError) {
    console.error("Could not verify admin student-edit PIN", pinError.message);
    return NextResponse.json({ error: "Unable to verify your PIN. Try again later." }, { status: 500 });
  }
  if (validPin !== true) {
    return NextResponse.json({ error: "Incorrect PIN or verification is temporarily locked" }, { status: 403 });
  }

  const studentId = typeof body.student_id === "string" ? body.student_id.trim() : "";
  const firstName = typeof body.first_name === "string" ? body.first_name.trim() : "";
  const middleName = typeof body.middle_name === "string" ? body.middle_name.trim() : "";
  const lastName = typeof body.last_name === "string" ? body.last_name.trim() : "";
  const nameExtension = typeof body.name_extension === "string" ? body.name_extension.trim() : "";
  const program = typeof body.program === "string" ? body.program.trim() : "";
  const yearLevel = body.year_level === null ? null : Number(body.year_level);

  if (!/^0\d{3}-\d{4}$/.test(studentId)) {
    return NextResponse.json({ error: "Student ID must use the format 0XXX-XXXX" }, { status: 400 });
  }
  if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100) {
    return NextResponse.json({ error: "First name and last name are required and must be 100 characters or fewer" }, { status: 400 });
  }
  if (middleName.length > 100 || nameExtension.length > 20 || !program || program.length > 150) {
    return NextResponse.json({ error: "Profile fields exceed their allowed length or program is missing" }, { status: 400 });
  }
  if (yearLevel !== null && (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 4)) {
    return NextResponse.json({ error: "Year level must be between 1 and 4, or left unset" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { data, error } = await admin.from("students").update({
    student_id: studentId,
    first_name: firstName,
    middle_name: middleName || null,
    last_name: lastName,
    name_extension: nameExtension || null,
    program,
    year_level: yearLevel,
  }).eq("id", id).select("id").maybeSingle();

  if (error?.code === "23505") {
    return NextResponse.json({ error: "That student ID is already assigned to another account" }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: "Could not update student profile" }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Student account not found" }, { status: 404 });

  const { error: auditError } = await supabase.rpc("log_audit", {
    p_action: "student_profile_updated",
    p_entity_type: "student",
    p_entity_id: id,
    p_details: { fields: ["student_id", "first_name", "middle_name", "last_name", "name_extension", "program", "year_level"] },
  });
  if (auditError) console.error("Could not record student profile edit", auditError.message);

  return NextResponse.json({ success: true });
}