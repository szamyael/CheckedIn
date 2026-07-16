import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckOutRequest {
  qr_token: string;
}

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const { data: account } = await supabase
      .from("users")
      .select("status, role")
      .eq("id", userId)
      .single();

    if (!account || account.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Your account is not active" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (account.role !== "student") {
      return new Response(
        JSON.stringify({ error: "Only student accounts can check out" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await req.json()) as CheckOutRequest;
    const qr_token = body.qr_token?.trim();

    if (!qr_token) {
      return new Response(JSON.stringify({ error: "Missing qr_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, title, status, attendance_starts_at, attendance_ends_at, starts_at, ends_at")
      .eq("qr_token", qr_token)
      .eq("status", "published")
      .maybeSingle();

    if (!event) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired QR code" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: record } = await supabase
      .from("attendance_records")
      .select("id, status, checked_in_at, checked_out_at")
      .eq("event_id", event.id)
      .eq("student_id", userId)
      .maybeSingle();

    if (!record) {
      return new Response(
        JSON.stringify({
          error: "You have not checked in to this event yet",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (record.status === "checked_out") {
      return new Response(
        JSON.stringify({
          error: "You already checked out of this event",
          already_checked_out: true,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (record.status !== "checked_in" && record.status !== "late") {
      return new Response(
        JSON.stringify({
          error: "Check-out is only available after a successful check-in",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const checkedOutAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("attendance_records")
      .update({
        status: "checked_out",
        checked_out_at: checkedOutAt,
      })
      .eq("id", record.id)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        attendance: updated,
        event: { id: event.id, title: event.title },
        checked_out_at: checkedOutAt,
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
