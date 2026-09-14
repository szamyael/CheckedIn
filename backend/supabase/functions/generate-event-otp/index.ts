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
      .select("id, title, status, created_by, organization_id")
      .eq("id", event_id)
      .single();

    if (!event || event.status !== "published") {
      return new Response(JSON.stringify({ error: "Event not found or not published" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: otpRows, error: otpError } = await supabase.rpc(
      "get_or_create_event_otp",
      { p_event_id: event_id, p_created_by: userId },
    );
    const otp = otpRows?.[0];
    if (otpError || !otp) {
      throw new Error(otpError?.message ?? "Failed to create or retrieve the shared OTP");
    }

    await supabase.from("events").update({ requires_otp: true }).eq("id", event_id);

    if (otp.generated) {
      await supabase.rpc("log_audit", {
        p_action: "generate_event_otp",
        p_entity_type: "event",
        p_entity_id: event_id,
        p_details: { expires_at: otp.expires_at },
      });
    }

    return new Response(
      JSON.stringify({
        code: otp.code,
        expires_at: otp.expires_at,
        expires_in_seconds: Math.max(1, Math.round((new Date(otp.expires_at).getTime() - Date.now()) / 1000)),
        generated: otp.generated,
        event_title: event.title,
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
