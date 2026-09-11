export const NOTIFICATION_SOUND_KEY = "checkedin-notification-sound-enabled";

export function isNotificationSoundEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(NOTIFICATION_SOUND_KEY) === "true";
}

export function setNotificationSoundEnabled(enabled: boolean) {
  window.localStorage.setItem(NOTIFICATION_SOUND_KEY, String(enabled));
  window.dispatchEvent(new Event("notification-sound-change"));
}

export function playNotificationSound() {
  if (!isNotificationSoundEnabled()) return;
  const audio = new Audio("/checkdin.mp3.mp3");
  audio.volume = 0.75;
  void audio.play().catch(() => undefined);
}
