import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    status,
    account_status_reason,
    first_name,
    last_name,
    department,
    organization_id,
  } = body;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );

  if (status) {
    if (!["active", "disabled", "suspended", "needs_reregistration"].includes(status)) {
      return NextResponse.json({ error: "Invalid account status" }, { status: 400 });
    }
    const { data: target, error: targetError } = await admin
      .from("users")
      .select("role, status")
      .eq("id", id)
      .single();
    if (targetError || !target) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (status === "needs_reregistration" && target.role !== "student") {
      return NextResponse.json({ error: "Re-registration decisions are only valid for student accounts" }, { status: 400 });
    }
    const reason = String(account_status_reason ?? "").trim();
    if (
      target.role === "student" &&
      ["suspended", "needs_reregistration"].includes(status) &&
      !reason
    ) {
      return NextResponse.json({ error: "A reason is required for this student-account decision" }, { status: 400 });
    }
    if (
      target.role === "student" &&
      status === "needs_reregistration" &&
      target.status !== "pending"
    ) {
      return NextResponse.json({ error: "Only applicants awaiting review can be asked to register again" }, { status: 400 });
    }
    const updates: Record<string, unknown> = { status };
    if (status === "disabled" || status === "suspended" || status === "needs_reregistration") {
      updates.disabled_at = new Date().toISOString();
    }
    if (status === "active") {
      updates.disabled_at = null;
      if (target.role === "student") updates.account_status_reason = null;
    }
    if (status === "suspended" || status === "needs_reregistration") {
      updates.account_status_reason = reason;
    }

    const { error } = await admin.from("users").update(updates).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (first_name || last_name || department !== undefined || organization_id !== undefined) {
    const staffUpdates: Record<string, unknown> = {};
    if (first_name) staffUpdates.first_name = first_name;
    if (last_name) staffUpdates.last_name = last_name;
    if (department !== undefined) staffUpdates.department = department;
    if (organization_id !== undefined) staffUpdates.organization_id = organization_id;

    const { error } = await admin
      .from("staff_profiles")
      .update(staffUpdates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
