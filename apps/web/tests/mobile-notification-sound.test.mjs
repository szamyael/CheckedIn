import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

test("push sound payload follows the selected system or CheckedIn preference", async () => {
  const moduleUrl = new URL("../../../backend/supabase/functions/send-push-notification/sound-preference.mjs", import.meta.url);
  assert.ok(existsSync(fileURLToPath(moduleUrl)), "push sound mapping should exist");
  const {
    getSoundPayload,
    resolvePushSoundPreference,
    resolveSoundPreference,
  } = await import(moduleUrl);

  assert.equal(resolveSoundPreference("checkedInMp3"), "checkedin_mp3");
  assert.equal(resolveSoundPreference("system"), "system");
  assert.equal(
    resolvePushSoundPreference("checkedin_mp3", "system"),
    "checkedin_mp3",
  );
  assert.equal(
    resolvePushSoundPreference(null, "checkedin.mp3.mp3"),
    "checkedin_mp3",
  );
  assert.deepEqual(getSoundPayload("checkedin_mp3"), {
    ios_sound: "checkdin.mp3.mp3",
    android_sound: "checkedin_notification",
    android_channel_id: "checkedin_custom_sound",
  });
  assert.deepEqual(getSoundPayload("system"), {
    ios_sound: "default",
    android_sound: "default",
  });
});

test("push sender reads the recipient preference and foreground handling avoids OS sound duplication", () => {
  const pushFunction = read("../../../backend/supabase/functions/send-push-notification/index.ts");
  const pushService = read("../../mobile/lib/services/push_notification_service.dart");

  assert.match(pushFunction, /users\/by\/external_id/);
  assert.match(pushFunction, /getSoundPayload\(soundPreference\)/);
  assert.match(pushService, /addTagWithKey\(\s*'notification_sound_preference'/);
  assert.match(pushService, /addForegroundWillDisplayListener/);
  assert.match(pushService, /event\.preventDefault\(\)/);
});

test("CheckedIn Android notification channel bundles the supplied sound file", () => {
  const mobileSound = readFileSync(fileURLToPath(new URL("../../mobile/assets/audio/checkdin.mp3.mp3", import.meta.url)));
  const androidSoundPath = fileURLToPath(new URL("../../mobile/android/app/src/main/res/raw/checkedin_notification.mp3", import.meta.url));
  const mainActivity = read("../../mobile/android/app/src/main/kotlin/com/example/checkedin_mobile/MainActivity.kt");

  assert.ok(existsSync(androidSoundPath), "Android notification sound resource should exist");
  assert.deepEqual(readFileSync(androidSoundPath), mobileSound);
  assert.match(mainActivity, /checkedin_custom_sound/);
  assert.match(mainActivity, /createNotificationChannel/);
});
