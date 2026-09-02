import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

async function ensureAdmin(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: user.id };
}

export async function POST(request: Request) {
  const auth = await ensureAdmin(request);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const organization_id = body?.organization_id;
  const program = String(body?.program ?? "").trim();

  if (!organization_id || !program) {
    return NextResponse.json({ error: "Organization and program are required" }, { status: 400 });
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

  const { data, error } = await admin
    .from("organization_programs")
    .upsert({ organization_id, program }, { onConflict: "organization_id,program" })
    .select("id, organization_id, program")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, mapping: data });
}

export async function PATCH(request: Request) {
  const auth = await ensureAdmin(request);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const id = body?.id;
  const program = String(body?.program ?? "").trim();

  if (!id || !program) {
    return NextResponse.json({ error: "Mapping ID and program are required" }, { status: 400 });
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

  const { data, error } = await admin
    .from("organization_programs")
    .update({ program })
    .eq("id", id)
    .select("id, organization_id, program")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, mapping: data });
}

export async function DELETE(request: Request) {
  const auth = await ensureAdmin(request);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const id = body?.id;

  if (!id) {
    return NextResponse.json({ error: "Mapping ID is required" }, { status: 400 });
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

  const { error } = await admin.from("organization_programs").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
