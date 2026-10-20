export type BrowserPermission = "camera" | "location";

export function permissionCopy(type: BrowserPermission) {
  if (type === "camera") {
    return {
      title: "Camera access needed",
      body: "CheckedIn uses your camera to scan your student ID, read event QR codes, and capture attendance selfies.",
      settingsHint:
        "In your browser, open site settings for this page and allow Camera access, then reload.",
    };
  }
  return {
    title: "Location access needed",
    body: "CheckedIn uses your location to confirm you are at the event venue before check-in.",
    settingsHint:
      "In your browser, open site settings for this page and allow Location access, then reload.",
  };
}

export async function requestCameraAccess(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export async function requestLocationAccess(): Promise<boolean> {
  if (!navigator.geolocation) return false;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export function isLocationPermissionDenied(error: unknown): boolean {
  return getGeolocationErrorCode(error) === 1;
}

export function locationErrorMessage(error: unknown): string {
  switch (getGeolocationErrorCode(error)) {
    case 1:
      return "Location permission was denied. Allow Location access in your browser settings, then try again.";
    case 2:
      return "Your device could not determine your location. Check that location services are on and try again.";
    case 3:
      return "Location request timed out. Move to an area with a clear GPS signal and try again.";
    default:
      return error instanceof Error
        ? error.message
        : "Location verification failed. Check your device location settings and try again.";
  }
}

function getGeolocationErrorCode(error: unknown): number | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    typeof error.code !== "number"
  ) {
    return null;
  }
  return error.code;
}

export async function ensureBrowserPermission(
  type: BrowserPermission,
): Promise<boolean> {
  return type === "camera"
    ? requestCameraAccess()
    : requestLocationAccess();
}

export function isPermissionErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("permission") ||
    lower.includes("denied") ||
    lower.includes("not allowed")
  );
}
