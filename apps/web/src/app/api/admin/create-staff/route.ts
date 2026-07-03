import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
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
  const { email, password, role, first_name, last_name, department, organization_id } =
    body;

  if (!email || !password || !role || !first_name || !last_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["faculty", "org_member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (role === "org_member" && !organization_id) {
    return NextResponse.json(
      { error: "Organization is required for org members" },
      { status: 400 },
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing service role key" },
      { status: 500 },
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );

  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create auth user" },
      { status: 400 },
    );
  }

  const userId = authUser.user.id;

  const { error: userError } = await admin.from("users").insert({
    id: userId,
    role,
    status: "active",
    email,
  });

  if (userError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  const { error: staffError } = await admin.from("staff_profiles").insert({
    id: userId,
    first_name,
    last_name,
    department: department ?? null,
    organization_id: role === "org_member" ? organization_id : null,
  });

  if (staffError) {
    return NextResponse.json({ error: staffError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id: userId });
}
