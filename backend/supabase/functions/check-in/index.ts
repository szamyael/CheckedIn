import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckInRequest {
  qr_token: string;
  latitude: number;
  longitude: number;
  selfie_path: string;
  client_checked_in_at?: string;
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

    const { data: account } = await supabase
      .from("users")
      .select("status, role")
      .eq("id", userData.user.id)
      .single();

    if (!account || account.status !== "active") {
      return new Response(
        JSON.stringify({
          error: account?.status === "pending"
            ? "Your account is pending admin approval"
            : "Your account is not active",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as CheckInRequest;
    const { qr_token, latitude, longitude, selfie_path, client_checked_in_at } =
      body;

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("qr_token", qr_token)
      .eq("status", "published")
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired QR code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const now = new Date();
    let checkInTime = now;

    if (client_checked_in_at) {
      const clientTime = new Date(client_checked_in_at);
      if (Number.isNaN(clientTime.getTime())) {
        return new Response(
          JSON.stringify({ error: "Invalid client check-in time" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (clientTime > now) {
        return new Response(
          JSON.stringify({ error: "Check-in time cannot be in the future" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
      if (now.getTime() - clientTime.getTime() > maxAgeMs) {
        return new Response(
          JSON.stringify({ error: "Offline check-in is too old to sync" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      checkInTime = clientTime;
    }

    const attendanceStart = new Date(
      event.attendance_starts_at ?? event.starts_at,
    );
    const attendanceEnd = new Date(
      event.attendance_ends_at ?? event.ends_at,
    );
    const qrExpires = event.qr_expires_at
      ? new Date(event.qr_expires_at)
      : attendanceEnd;

    if (checkInTime < attendanceStart || checkInTime > attendanceEnd) {
      return new Response(
        JSON.stringify({ error: "Attendance window is not open" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (checkInTime > qrExpires) {
      return new Response(
        JSON.stringify({ error: "QR code has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: distanceData } = await supabase.rpc("haversine_distance_m", {
      lat1: latitude,
      lng1: longitude,
      lat2: event.latitude,
      lng2: event.longitude,
    });

    const distanceM = distanceData as number;

    if (distanceM > event.location_radius_m) {
      return new Response(
        JSON.stringify({
          error: "You are outside the event location",
          distance_m: distanceM,
          allowed_radius_m: event.location_radius_m,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("event_id", event.id)
      .eq("student_id", userData.user.id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Already checked in to this event" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: record, error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        event_id: event.id,
        student_id: userData.user.id,
        latitude,
        longitude,
        selfie_url: selfie_path,
        distance_from_venue_m: distanceM,
        checked_in_at: checkInTime.toISOString(),
        status: "checked_in",
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: newBadges } = await supabase.rpc("award_check_in_achievements", {
      p_student_id: userData.user.id,
      p_event_id: event.id,
      p_event_title: event.title,
    });

    return new Response(
      JSON.stringify({
        success: true,
        attendance: record,
        event: { id: event.id, title: event.title },
        badges: newBadges ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
