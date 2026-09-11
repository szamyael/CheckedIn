"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from "@/lib/notification-sound";

export function NotificationSoundToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(isNotificationSoundEnabled());
    sync();
    window.addEventListener("notification-sound-change", sync);
    return () => window.removeEventListener("notification-sound-change", sync);
  }, []);

  function toggle() {
    setNotificationSoundEnabled(!enabled);
    setEnabled(!enabled);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
      aria-label={enabled ? "Mute notification sounds" : "Enable notification sounds"}
      title={enabled ? "Mute notification sounds" : "Enable notification sounds"}
    >
      {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
    </button>
  );
}
