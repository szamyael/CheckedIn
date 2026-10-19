import {
  getSoundPayload,
  resolvePushSoundPreference,
  resolveSoundPreference,
} from "./sound-preference.mjs";

const corsHeaders = { "Content-Type": "application/json" };

async function getUserSoundPreference(appId: string, apiKey: string, userId: string) {
  const response = await fetch(
    `https://api.onesignal.com/apps/${appId}/users/by/external_id/${encodeURIComponent(userId)}`,
    { headers: { Authorization: `Key ${apiKey}` } },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`OneSignal user lookup failed: ${response.status}`);
  const user = await response.json();
  const preference = user.properties?.tags?.notification_sound_preference;
  return preference == null ? null : resolveSoundPreference(preference);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const webhookSecret = Deno.env.get("NOTIFICATION_WEBHOOK_SECRET");
  if (!webhookSecret || req.headers.get("x-webhook-secret") !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const payload = await req.json();
  const notification = payload.record ?? payload;
  if (!notification?.user_id || !notification?.title || !notification?.body) {
    return new Response(JSON.stringify({ error: "Invalid notification" }), { status: 400, headers: corsHeaders });
  }

  const appId = Deno.env.get("ONESIGNAL_APP_ID");
  const apiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
  if (!appId || !apiKey) return new Response(JSON.stringify({ skipped: "Push is not configured" }), { headers: corsHeaders });

  const notificationSound = notification.sound ??
    notification.notification_sound ??
    notification.user_sound_preference ??
    notification.metadata?.sound ??
    notification.metadata?.notification_sound;
  let soundPreference;
  try {
    const userPreference = await getUserSoundPreference(
      appId,
      apiKey,
      notification.user_id,
    );
    soundPreference = resolvePushSoundPreference(
      userPreference,
      notificationSound,
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 502, headers: corsHeaders });
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      include_aliases: { external_id: [notification.user_id] },
      headings: { en: notification.title },
      contents: { en: notification.body },
      ...getSoundPayload(soundPreference),
      data: notification.metadata ?? {},
    }),
  });
  const result = await response.json();
  return new Response(JSON.stringify(result), { status: response.ok ? 200 : 502, headers: corsHeaders });
});
