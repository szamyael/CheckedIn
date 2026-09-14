import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const organizationId = String(body?.organization_id ?? "");
  const status = body?.moderation_status;
  const note = String(body?.moderation_note ?? "").trim() || null;
  if (!organizationId || !["active", "suspended"].includes(status)) {
    return NextResponse.json({ error: "A valid organization and moderation status are required" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { error } = await admin.from("organizations").update({
    moderation_status: status,
    moderation_note: note,
    moderated_at: new Date().toISOString(),
    moderated_by: user.id,
  }).eq("id", organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
