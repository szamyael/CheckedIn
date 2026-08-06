"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoader } from "@/components/LoaderProvider";
import {
  clearFlow,
  loadFlow,
  type AttendanceFlowState,
} from "@/lib/student/attendance-flow";
import { createClient } from "@/lib/supabase/client";

export default function AttendanceSelfiePage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [flow, setFlow] = useState<AttendanceFlowState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    title: string;
    points?: number;
    eventId?: string;
  } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const current = loadFlow();
    if (!current?.qrToken || !current.locationVerified) {
      router.replace("/student/attendance/scan");
      return;
    }
    setFlow(current);

    let cancelled = false;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Camera permission denied. Allow camera access for selfie.");
      }
    }
    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [router]);

  async function submit() {
    if (!flow || !videoRef.current) return;
    setError(null);
    showLoader("Submitting check-in…");

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 960;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not capture selfie");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Selfie encode failed"))),
          "image/jpeg",
          0.85,
        );
      });

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
        });
      });

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const path = `${user.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("selfies")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;

      const body: Record<string, unknown> = {
        qr_token: flow.qrToken,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        selfie_path: path,
        capture_integrity: {
          live_camera_capture: true,
          captured_at_ms: Date.now(),
          screenshot_events: 0,
          screen_recording: false,
        },
      };
      if (flow.otpCode) body.otp_code = flow.otpCode;
      if (flow.eventId) body.event_id = flow.eventId;

      const { data, error: fnError } = await supabase.functions.invoke(
        "check-in",
        { body },
      );
      if (fnError) throw new Error(fnError.message);
      const payload = data as {
        success?: boolean;
        error?: string;
        points_awarded?: number;
        event?: { id?: string; title?: string };
      };
      if (!payload.success) {
        throw new Error(payload.error || "Check-in failed");
      }

      streamRef.current?.getTracks().forEach((t) => t.stop());
      clearFlow();
      setSuccess({
        title: payload.event?.title ?? flow.eventTitle ?? "Event",
        points: payload.points_awarded,
        eventId: payload.event?.id ?? flow.eventId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      hideLoader();
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-3xl text-teal-600">
          ✓
        </div>
        <h1 className="text-xl font-bold">Checked in</h1>
        <p className="text-sm text-slate-600">{success.title}</p>
        {success.points != null && (
          <p className="text-sm font-medium text-teal-600">
            +{success.points} points
          </p>
        )}
        {success.eventId && (
          <button
            type="button"
            onClick={() =>
              router.push(`/student/feedback/${success.eventId}`)
            }
            className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium"
          >
            Leave feedback
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/student")}
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col space-y-4">
      <h1 className="text-xl font-bold">Step 3 of 3 — Selfie</h1>
      <p className="text-sm text-slate-600">
        Take a live selfie to complete check-in
        {flow?.eventTitle ? ` for ${flow.eventTitle}` : ""}.
      </p>
      <div className="overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="aspect-[3/4] w-full object-cover"
        />
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void submit()}
        className="mt-auto rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
      >
        Capture &amp; Submit
      </button>
    </div>
  );
}
