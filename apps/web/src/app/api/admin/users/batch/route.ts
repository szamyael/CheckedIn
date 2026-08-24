import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type BatchAction = "approve" | "deny";

/**
 * Batch approve or deny pending student accounts.
 * - approve → status = active
 * - deny → status = disabled
 * Body: { action: "approve" | "deny", ids?: string[] }
 * If ids omitted, applies to all pending students.
 */
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
  const action = body.action as BatchAction;
  const ids = Array.isArray(body.ids)
    ? (body.ids as string[]).filter((id) => typeof id === "string")
    : null;

  if (action !== "approve" && action !== "deny") {
    return NextResponse.json(
      { error: 'action must be "approve" or "deny"' },
      { status: 400 },
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );

  let targetIds = ids;

  if (!targetIds || targetIds.length === 0) {
    const { data: pending, error: pendingError } = await admin
      .from("users")
      .select("id")
      .eq("role", "student")
      .eq("status", "pending");

    if (pendingError) {
      return NextResponse.json({ error: pendingError.message }, { status: 400 });
    }
    targetIds = (pending ?? []).map((row) => row.id as string);
  } else {
    // Only act on accounts that are still pending
    const { data: pending, error: pendingError } = await admin
      .from("users")
      .select("id")
      .eq("role", "student")
      .eq("status", "pending")
      .in("id", targetIds);

    if (pendingError) {
      return NextResponse.json({ error: pendingError.message }, { status: 400 });
    }
    targetIds = (pending ?? []).map((row) => row.id as string);
  }

  if (targetIds.length === 0) {
    return NextResponse.json({ success: true, updated: 0 });
  }

  const status = action === "approve" ? "active" : "disabled";
  const updates: Record<string, unknown> = {
    status,
    disabled_at: action === "deny" ? new Date().toISOString() : null,
  };

  const { error } = await admin
    .from("users")
    .update(updates)
    .in("id", targetIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, updated: targetIds.length });
}
