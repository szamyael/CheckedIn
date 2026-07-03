import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Server misconfigured: missing service role key");
  }

  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );
}

export async function GET() {
  try {
    const admin = getAdmin();
    const { count, error } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ needsBootstrap: (count ?? 0) === 0 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = getAdmin();

    const { count } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "An admin account already exists" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, password, first_name, last_name } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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
      role: "admin",
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
    });

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: userId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
