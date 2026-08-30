"use client";

import { useEffect, useRef, useState } from "react";
import { PermissionBlockedCard } from "@/components/student/PermissionBlockedCard";

export function IdCardCameraCapture({
  onCapture,
  disabled,
}: {
  onCapture: (file: File) => void;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraBlocked(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraBlocked(false);
        setReady(true);
      } catch {
        setCameraBlocked(true);
        setReady(false);
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraKey]);

  function capture() {
    if (!videoRef.current || disabled || !ready) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        streamRef.current?.getTracks().forEach((track) => track.stop());
        onCapture(
          new File([blob], "student-id.jpg", { type: "image/jpeg" }),
        );
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        {!cameraBlocked ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-[3/2] w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5">
              <div className="h-[62%] w-full max-w-sm rounded-xl border-2 border-dashed border-white/85" />
            </div>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
                Starting camera…
              </div>
            )}
          </>
        ) : (
          <div className="p-4">
            <PermissionBlockedCard
              permission="camera"
              onRetry={() => {
                setCameraBlocked(false);
                setCameraKey((key) => key + 1);
              }}
            />
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        Fit your student ID inside the frame. Keep the card flat and avoid glare.
      </p>

      <button
        type="button"
        disabled={disabled || cameraBlocked || !ready}
        onClick={capture}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        Capture ID
      </button>
    </div>
  );
}
