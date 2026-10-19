export function resolveSoundPreference(value) {
  const normalized = String(value ?? "system").toLowerCase().trim();
  return ["checkedin_mp3", "checkedinmp3", "checkedin.mp3", "checkedin.mp3.mp3", "custom"].includes(normalized)
    ? "checkedin_mp3"
    : "system";
}

export function getSoundPayload(value) {
  if (resolveSoundPreference(value) === "checkedin_mp3") {
    return {
      ios_sound: "checkdin.mp3.mp3",
      android_sound: "checkedin_notification",
      android_channel_id: "checkedin_custom_sound",
    };
  }
  return { ios_sound: "default", android_sound: "default" };
}

export function resolvePushSoundPreference(userPreference, notificationPreference) {
  return resolveSoundPreference(userPreference ?? notificationPreference);
}
