import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  analyzeSelfieImage,
  validateCaptureIntegrity,
} from "./screenshot_detection.ts";

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
  otp_code?: string;
  capture_integrity?: {
    screenshot_events?: number;
    screen_recording?: boolean;
    captured_at_ms?: number;
    live_camera_capture?: boolean;
    analysis_issues?: string[];
  };
}

const OFFLINE_SYNC_GRACE_MS = 24 * 60 * 60 * 1000;
const SELFIE_MAX_AGE_MS = 15 * 60 * 1000;

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
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
        JSON.stringify({
          error: account?.status === "pending"
            ? "Your account is pending admin approval"
            : "Your account is not active",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (account.role !== "student") {
      return new Response(
        JSON.stringify({ error: "Only student accounts can check in to events" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as CheckInRequest;
    const {
      qr_token,
      latitude,
      longitude,
      selfie_path,
      client_checked_in_at,
      otp_code,
      capture_integrity,
    } = body;

    if (!qr_token || !selfie_path) {
      return new Response(
        JSON.stringify({ error: "Missing required check-in fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!isValidCoordinate(latitude, longitude)) {
      return new Response(
        JSON.stringify({ error: "Invalid GPS coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const expectedSelfiePrefix = `${userId}/`;
    if (!selfie_path.startsWith(expectedSelfiePrefix)) {
      return new Response(
        JSON.stringify({ error: "Invalid selfie reference" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: selfieBlob, error: selfieError } = await supabase.storage
      .from("selfies")
      .download(selfie_path);

    if (selfieError || !selfieBlob || selfieBlob.size < 1024) {
      return new Response(
        JSON.stringify({ error: "Selfie verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const selfieBytes = new Uint8Array(await selfieBlob.arrayBuffer());
    const integrityCheck = validateCaptureIntegrity(capture_integrity);
    const imageAnalysis = analyzeSelfieImage(selfieBytes);

    if (integrityCheck.block) {
      return new Response(
        JSON.stringify({
          error:
            "Check-in blocked: screenshot or screen recording detected during attendance.",
          fraud_reasons: integrityCheck.reasons,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (imageAnalysis.block) {
      return new Response(
        JSON.stringify({
          error:
            "Selfie appears to be a screenshot, not a live camera capture. Take a new photo.",
          fraud_reasons: imageAnalysis.reasons,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const selfieFileName = selfie_path.slice(expectedSelfiePrefix.length);
    const { data: selfieMeta } = await supabase.storage
      .from("selfies")
      .list(userId, { search: selfieFileName, limit: 1 });

    const uploadedAt = selfieMeta?.[0]?.created_at ?? selfieMeta?.[0]?.updated_at;
    if (uploadedAt) {
      const ageMs = Date.now() - new Date(uploadedAt).getTime();
      if (ageMs > SELFIE_MAX_AGE_MS) {
        return new Response(
          JSON.stringify({ error: "Selfie expired. Take a new live photo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

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

    if (event.latitude == null || event.longitude == null) {
      return new Response(
        JSON.stringify({ error: "Event venue location is not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: settings } = await supabase
      .from("system_settings")
      .select("late_grace_minutes")
      .eq("id", 1)
      .single();

    const lateGraceMinutes = settings?.late_grace_minutes ?? 15;
    let otpVerified = false;

    if (event.requires_otp) {
      if (!otp_code?.trim()) {
        return new Response(
          JSON.stringify({ error: "Attendance OTP is required for this event" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: otpRow } = await supabase
        .from("event_otp_codes")
        .select("id, code, expires_at")
        .eq("event_id", event.id)
        .eq("code", otp_code.trim())
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!otpRow) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired attendance OTP" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      otpVerified = true;
    }

    const now = new Date();
    let checkInTime = now;
    const isOfflineSync = Boolean(client_checked_in_at);

    if (isOfflineSync) {
      const clientTime = new Date(client_checked_in_at!);
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

    if (isOfflineSync && now.getTime() > attendanceEnd.getTime() + OFFLINE_SYNC_GRACE_MS) {
      return new Response(
        JSON.stringify({ error: "Offline check-in sync period has ended" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        JSON.stringify({ error: "Location verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const distanceM = distanceData as number;
    const allowedRadius = event.location_radius_m ?? 100;

    if (distanceM > allowedRadius) {
      return new Response(
        JSON.stringify({
          error: "You are outside the event location",
          distance_m: Math.round(distanceM),
          allowed_radius_m: allowedRadius,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("event_id", event.id)
      .eq("student_id", userId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Already checked in to this event" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lateThreshold = new Date(
      attendanceStart.getTime() + lateGraceMinutes * 60 * 1000,
    );
    const attendanceStatus = checkInTime > lateThreshold ? "late" : "checked_in";
    const fraudFlag =
      imageAnalysis.suspected ||
      integrityCheck.reasons.length > 0 ||
      (capture_integrity?.analysis_issues?.includes("screen_resolution_match") ??
        false);

    const { data: record, error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        event_id: event.id,
        student_id: userId,
        latitude,
        longitude,
        selfie_url: selfie_path,
        distance_from_venue_m: distanceM,
        checked_in_at: checkInTime.toISOString(),
        status: attendanceStatus,
        otp_verified: otpVerified,
        fraud_flag: fraudFlag,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pointsAwarded = attendanceStatus === "late" ? 5 : 10;
    await supabase.rpc("increment_student_points", {
      p_student_id: userId,
      p_points: pointsAwarded,
    });

    const { data: newBadges } = await supabase.rpc("award_check_in_achievements", {
      p_student_id: userId,
      p_event_id: event.id,
      p_event_title: event.title,
    });

    return new Response(
      JSON.stringify({
        success: true,
        attendance: record,
        event: { id: event.id, title: event.title },
        badges: newBadges ?? [],
        points_awarded: pointsAwarded,
        status: attendanceStatus,
        fraud_flag: fraudFlag,
        fraud_reasons: [...integrityCheck.reasons, ...imageAnalysis.reasons],
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
