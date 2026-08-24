"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { PermissionBlockedCard } from "@/components/student/PermissionBlockedCard";
import { useLoader } from "@/components/LoaderProvider";
import type { CheckInMeta } from "@/lib/student/api";
import { loadFlow, saveFlow } from "@/lib/student/attendance-flow";
import {
  ensureBrowserPermission,
  isPermissionErrorMessage,
} from "@/lib/student/browser-permissions";
import { createClient } from "@/lib/supabase/client";

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 0,
    });
  });
}

export default function AttendanceLocationPage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [locationBlocked, setLocationBlocked] = useState(false);

  async function verify() {
    setError(null);
    setHint(null);
    setLocationBlocked(false);
    const flow = loadFlow();
    if (!flow?.qrToken) {
      router.replace("/student/attendance/scan");
      return;
    }

    const granted = await ensureBrowserPermission("location");
    if (!granted) {
      setLocationBlocked(true);
      setError("Location is required to verify you are at the event venue.");
      return;
    }

    showLoader("Verifying location…");
    try {
      const pos = await getPosition();
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "event-check-in-meta",
        {
          body: {
            qr_token: flow.qrToken,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
        },
      );
      if (fnError) throw new Error(fnError.message);
      const meta = data as CheckInMeta;
      if (meta.location_ok !== true) {
        setError(meta.error || "You are outside the event location.");
        if (meta.distance_m != null && meta.allowed_radius_m != null) {
          setHint(
            `Distance: ${meta.distance_m}m (allowed: ${meta.allowed_radius_m}m)`,
          );
        }
        return;
      }

      saveFlow({
        ...flow,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        requiresOtp: meta.requires_otp === true,
        eventId: meta.id ?? flow.eventId,
        eventTitle: meta.title ?? flow.eventTitle,
        locationVerified: true,
      });
      router.push("/student/attendance/otp");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Location verification failed. Allow location access and try again.";
      setError(message);
      if (isPermissionErrorMessage(message)) setLocationBlocked(true);
    } finally {
      hideLoader();
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <MapPin className="mx-auto h-16 w-16 text-teal-600" />
      <h1 className="mt-4 text-center text-xl font-bold">
        Step 1 of 3 — Location
      </h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        You must be inside the event geofence before OTP or selfie.
      </p>
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {hint && <p className="mt-2 text-center text-xs text-red-500">{hint}</p>}
      {locationBlocked && (
        <div className="mt-4">
          <PermissionBlockedCard permission="location" onRetry={() => void verify()} />
        </div>
      )}
      <button
        type="button"
        onClick={() => void verify()}
        className="mt-auto rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
      >
        Verify My Location
      </button>
    </div>
  );
}
