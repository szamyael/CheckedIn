import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Could not verify API monitor access", profileError.message);
    return NextResponse.json({ error: "Could not verify access" }, { status: 500 });
  }
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "API monitor is not configured", heartbeat: { status: "offline" }, logs: [] },
      { status: 503 },
    );
  }

  const admin = createAdminClient(url, serviceKey);
  const startedAt = Date.now();
  const { error: heartbeatError } = await admin
    .from("system_settings")
    .select("id")
    .limit(1);
  const latencyMs = Date.now() - startedAt;
  const checkedAt = new Date().toISOString();

  if (heartbeatError) {
    console.error("API monitor database heartbeat failed", heartbeatError.message);
    return NextResponse.json(
      {
        error: "API monitor could not reach the database",
        heartbeat: { status: "offline", checkedAt, latencyMs },
        logs: [],
      },
      { status: 503 },
    );
  }

  const { data: logs, error: logsError } = await admin
    .from("api_request_logs")
    .select("id, method, path, status_code, duration_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (logsError) {
    console.error("API monitor could not load request logs", logsError.message);
    return NextResponse.json(
      {
        error: "API request log storage is unavailable. Apply the API monitor migration.",
        heartbeat: { status: "online", checkedAt, latencyMs },
        logs: [],
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      heartbeat: { status: "online", checkedAt, latencyMs },
      logs: logs ?? [],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
