import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  analyzeSelfieImage,
  validateCaptureIntegrity,
} from "../check-in/screenshot_detection.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OFFLINE_SYNC_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

interface OfflineAttendanceRequest {
  client_submission_id: string;
  qr_token: string;
  action: "check_in" | "check_out";
  selfie_path: string;
  captured_at: string;
  otp_code?: string;
  event_id?: string;
  capture_integrity?: {
    screenshot_events?: number;
    screen_recording?: boolean;
    captured_at_ms?: number;
    live_camera_capture?: boolean;
    analysis_issues?: string[];
  };
}

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return response({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);
    if (userError || !userData.user)
      return response({ error: "Invalid session" }, 401);
    const userId = userData.user.id;

    const { data: account } = await supabase
      .from("users")
      .select("status, role")
      .eq("id", userId)
      .maybeSingle();
    if (!account || account.status !== "active" || account.role !== "student") {
      return response(
        { error: "Only active student accounts can submit offline attendance" },
        403,
      );
    }

    const body = (await req.json()) as OfflineAttendanceRequest;
    if (
      !body.client_submission_id ||
      !body.qr_token ||
      !body.selfie_path ||
      !body.captured_at ||
      !["check_in", "check_out"].includes(body.action)
    ) {
      return response(
        { error: "Missing required offline attendance fields" },
        400,
      );
    }
    if (!body.otp_code?.trim()) {
      return response(
        { error: "Attendance OTP is required for offline attendance" },
        400,
      );
    }

    // Idempotency makes reconnect retries safe when a device loses service
    // immediately after the server accepted a submission.
    const { data: existing } = await supabase
      .from("offline_attendance_submissions")
      .select("id, review_status, events(id, title)")
      .eq("client_submission_id", body.client_submission_id)
      .eq("student_id", userId)
      .maybeSingle();
    if (existing)
      return response({ success: true, submission: existing, duplicate: true });

    const capturedAt = new Date(body.captured_at);
    const now = new Date();
    if (
      Number.isNaN(capturedAt.getTime()) ||
      capturedAt > now ||
      now.getTime() - capturedAt.getTime() > OFFLINE_SYNC_GRACE_MS
    ) {
      return response(
        { error: "Offline attendance is too old or has an invalid scan time" },
        400,
      );
    }

    let event: Record<string, unknown> | null = null;
    const { data: byToken } = await supabase
      .from("events")
      .select(
        "id, title, status, requires_otp, attendance_starts_at, attendance_ends_at, starts_at, ends_at",
      )
      .eq("qr_token", body.qr_token)
      .eq("status", "published")
      .maybeSingle();
    event = byToken;
    if (!event && body.event_id) {
      const { data: byId } = await supabase
        .from("events")
        .select(
          "id, title, status, requires_otp, attendance_starts_at, attendance_ends_at, starts_at, ends_at",
        )
        .eq("id", body.event_id)
        .eq("status", "published")
        .maybeSingle();
      event = byId;
    }
    if (!event) return response({ error: "Invalid or expired QR code" }, 404);

    const start = new Date(
      (event.attendance_starts_at as string | null) ??
        (event.starts_at as string),
    );
    const end = new Date(
      (event.attendance_ends_at as string | null) ?? (event.ends_at as string),
    );
    if (capturedAt < start || capturedAt > end) {
      return response(
        { error: "The QR was scanned outside the event attendance window" },
        400,
      );
    }

    const selfiePrefix = `${userId}/`;
    if (!body.selfie_path.startsWith(selfiePrefix)) {
      return response({ error: "Invalid selfie reference" }, 403);
    }
    const { data: selfieBlob, error: selfieError } = await supabase.storage
      .from("selfies")
      .download(body.selfie_path);
    if (selfieError || !selfieBlob || selfieBlob.size < 1024) {
      return response({ error: "Selfie verification failed" }, 400);
    }
    const integrity = validateCaptureIntegrity(body.capture_integrity);
    const image = analyzeSelfieImage(
      new Uint8Array(await selfieBlob.arrayBuffer()),
    );
    if (integrity.block || image.block) {
      return response(
        {
          error: integrity.block
            ? "Offline attendance blocked: screen capture detected"
            : "Selfie appears to be a screenshot, not a live camera capture",
        },
        400,
      );
    }

    // OTP evidence is checked against the code valid at scan time. It is not
    // persisted in the review table; staff see only whether it could be
    // confirmed, plus the timestamp and selfie they need to decide.
    let otpVerifiedAtCapture = false;
    if (body.otp_code?.trim()) {
      const { data: otp } = await supabase
        .from("event_otp_codes")
        .select("id")
        .eq("event_id", event.id as string)
        .eq("code", body.otp_code.trim())
        .lte("created_at", capturedAt.toISOString())
        .gt("expires_at", capturedAt.toISOString())
        .maybeSingle();
      otpVerifiedAtCapture = Boolean(otp);
    }

    const { data: submission, error: insertError } = await supabase
      .from("offline_attendance_submissions")
      .insert({
        client_submission_id: body.client_submission_id,
        event_id: event.id,
        student_id: userId,
        action: body.action,
        qr_token: body.qr_token,
        captured_at: capturedAt.toISOString(),
        selfie_url: body.selfie_path,
        otp_verified_at_capture: otpVerifiedAtCapture,
        capture_integrity: body.capture_integrity ?? null,
      })
      .select("id, review_status, captured_at, events(id, title)")
      .single();
    if (insertError) return response({ error: insertError.message }, 500);

    // No latitude/longitude is accepted or evaluated in this function.
    return response(
      { success: true, submission, message: "Submitted for staff review" },
      201,
    );
  } catch (err) {
    return response({ error: String(err) }, 500);
  }
});
