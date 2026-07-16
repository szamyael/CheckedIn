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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const qr_token = body.qr_token as string | undefined;
    const latitude = body.latitude as number | undefined;
    const longitude = body.longitude as number | undefined;

    if (!qr_token) {
      return new Response(JSON.stringify({ error: "Missing qr_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: event } = await supabase
      .from("events")
      .select(
        "id, title, requires_otp, venue_name, latitude, longitude, location_radius_m, attendance_starts_at, attendance_ends_at, starts_at, ends_at, status",
      )
      .eq("qr_token", qr_token)
      .eq("status", "published")
      .maybeSingle();

    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const attendanceStart = new Date(
      event.attendance_starts_at ?? event.starts_at,
    );
    const attendanceEnd = new Date(event.attendance_ends_at ?? event.ends_at);
    const windowOpen = now >= attendanceStart && now <= attendanceEnd;

    const base = {
      id: event.id,
      title: event.title,
      requires_otp: event.requires_otp === true,
      venue_name: event.venue_name,
      latitude: event.latitude,
      longitude: event.longitude,
      location_radius_m: event.location_radius_m ?? 100,
      attendance_starts_at: event.attendance_starts_at ?? event.starts_at,
      attendance_ends_at: event.attendance_ends_at ?? event.ends_at,
      window_open: windowOpen,
    };

    // Location verification gate — required before OTP / selfie.
    if (latitude != null && longitude != null) {
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        event.latitude == null ||
        event.longitude == null
      ) {
        return new Response(
          JSON.stringify({
            ...base,
            location_ok: false,
            error: "Invalid GPS coordinates or event venue",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (!windowOpen) {
        return new Response(
          JSON.stringify({
            ...base,
            location_ok: false,
            error: "Attendance window is not open for this event",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { data: distanceData, error: distanceError } = await supabase.rpc(
        "haversine_distance_m",
        {
          lat1: latitude,
          lng1: longitude,
          lat2: event.latitude,
          lng2: event.longitude,
        },
      );

      if (distanceError || distanceData == null || !Number.isFinite(distanceData)) {
        return new Response(
          JSON.stringify({
            ...base,
            location_ok: false,
            error: "Location verification failed",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const distanceM = distanceData as number;
      const allowedRadius = event.location_radius_m ?? 100;

      if (distanceM > allowedRadius) {
        return new Response(
          JSON.stringify({
            ...base,
            location_ok: false,
            distance_m: Math.round(distanceM),
            allowed_radius_m: allowedRadius,
            error: `You are outside the event location (${Math.round(distanceM)}m away; allowed ${allowedRadius}m)`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          ...base,
          location_ok: true,
          distance_m: Math.round(distanceM),
          allowed_radius_m: allowedRadius,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(base), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
