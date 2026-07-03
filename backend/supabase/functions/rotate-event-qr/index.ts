import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_id } = await req.json();
    if (!event_id) {
      return new Response(JSON.stringify({ error: "event_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const userId = authData.user.id;

    const { data: account } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", userId)
      .single();

    if (!account || account.status !== "active" ||
      !["admin", "faculty", "org_member"].includes(account.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, attendance_ends_at, ends_at")
      .eq("id", event_id)
      .single();

    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newToken = crypto.randomUUID();
    const attendanceEnd = event.attendance_ends_at ?? event.ends_at;
    const now = new Date();

    const { data: settings } = await supabase
      .from("system_settings")
      .select("qr_rotation_minutes")
      .eq("id", 1)
      .single();

    const rotationMinutes = settings?.qr_rotation_minutes ?? 0;
    let qrExpiresAt = attendanceEnd;
    if (rotationMinutes > 0) {
      const rotatedExpiry = new Date(now.getTime() + rotationMinutes * 60 * 1000);
      const attendanceEndDate = new Date(attendanceEnd);
      qrExpiresAt = rotatedExpiry < attendanceEndDate
        ? rotatedExpiry.toISOString()
        : attendanceEnd;
    }

    const { error: updateError } = await supabase
      .from("events")
      .update({
        qr_token: newToken,
        qr_expires_at: qrExpiresAt,
        qr_rotated_at: now.toISOString(),
      })
      .eq("id", event_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.rpc("log_audit", {
      p_action: "rotate_event_qr",
      p_entity_type: "event",
      p_entity_id: event_id,
      p_details: { qr_expires_at: qrExpiresAt },
    });

    return new Response(
      JSON.stringify({
        qr_token: newToken,
        qr_expires_at: qrExpiresAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
