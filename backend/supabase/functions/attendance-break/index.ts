import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BreakAction = "break_out" | "break_in";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData.user) throw new Error("Invalid session");

    const { data: account } = await supabase.from("users").select("role, status").eq("id", userData.user.id).single();
    if (!account || account.role !== "student" || account.status !== "active") {
      return response({ error: "Only active student accounts can record a break" }, 403);
    }

    const body = await req.json() as { qr_token?: string; action?: BreakAction };
    const qrToken = body.qr_token?.trim();
    if (!qrToken || (body.action !== "break_out" && body.action !== "break_in")) {
      return response({ error: "A QR token and a valid break action are required" }, 400);
    }

    const { data: event } = await supabase.from("events").select("id, title, status").eq("qr_token", qrToken).eq("status", "published").maybeSingle();
    if (!event) return response({ error: "Invalid or expired QR code" }, 404);

    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("id, status, break_count")
      .eq("event_id", event.id)
      .eq("student_id", userData.user.id)
      .maybeSingle();
    if (!attendance) return response({ error: "Check in before recording a break" }, 404);

    const now = new Date().toISOString();
    const isOut = body.action === "break_out";
    if (isOut && !["checked_in", "late"].includes(attendance.status)) {
      return response({ error: "Break out is only available while you are checked in" }, 409);
    }
    if (!isOut && attendance.status !== "on_break") {
      return response({ error: "You are not currently on a break" }, 409);
    }

    const update = isOut
      ? { status: "on_break", break_out_at: now, break_count: (attendance.break_count ?? 0) + 1 }
      : { status: "checked_in", break_in_at: now };
    const { data: updated, error } = await supabase.from("attendance_records").update(update).eq("id", attendance.id).select().single();
    if (error) return response({ error: error.message }, 500);

    return response({ success: true, action: body.action, attendance: updated, event: { id: event.id, title: event.title }, recorded_at: now });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
