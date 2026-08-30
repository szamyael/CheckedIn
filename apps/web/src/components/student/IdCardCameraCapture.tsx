"use client";

import { useEffect, useRef, useState } from "react";
import { PermissionBlockedCard } from "@/components/student/PermissionBlockedCard";

/** Portrait ID card frame (width : height). */
const PORTRAIT_RATIO = 3 / 4;

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
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1080 },
            height: { ideal: 1440 },
          },
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
    const { sx, sy, sw, sh } = portraitCropRegion(
      video.videoWidth,
      video.videoHeight,
    );

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        streamRef.current?.getTracks().forEach((track) => track.stop());
        onCapture(new File([blob], "student-id.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl bg-black">
        {!cameraBlocked ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-[3/4] w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
              <div className="h-[78%] w-[88%] rounded-xl border-2 border-dashed border-white/85" />
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
        Hold your phone upright. Fit the ID inside the frame with your name
        above the yellow course/program line.
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

function portraitCropRegion(videoWidth: number, videoHeight: number) {
  const vw = videoWidth || 720;
  const vh = videoHeight || 960;
  const currentRatio = vw / vh;

  if (currentRatio > PORTRAIT_RATIO) {
    const sw = Math.round(vh * PORTRAIT_RATIO);
    return {
      sx: Math.round((vw - sw) / 2),
      sy: 0,
      sw,
      sh: vh,
    };
  }

  const sh = Math.round(vw / PORTRAIT_RATIO);
  return {
    sx: 0,
    sy: Math.round((vh - sh) / 2),
    sw: vw,
    sh,
  };
}
