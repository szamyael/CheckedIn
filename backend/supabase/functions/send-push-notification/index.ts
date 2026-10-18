const corsHeaders = { "Content-Type": "application/json" };

function resolveSoundPreference(value) {
  if (!value) return "system";
  const normalized = String(value).toLowerCase().trim();
  if (["checkedin_mp3", "checkedinmp3", "checkedin.mp3", "checkedin.mp3.mp3", "custom"].includes(normalized)) {
    return "checkedin_mp3";
  }
  return "system";
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

  const soundPreference = resolveSoundPreference(
    notification.sound ??
      notification.notification_sound ??
      notification.user_sound_preference ??
      notification.metadata?.sound ??
      notification.metadata?.notification_sound,
  );

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      include_aliases: { external_id: [notification.user_id] },
      headings: { en: notification.title },
      contents: { en: notification.body },
      ios_sound: soundPreference === "checkedin_mp3" ? "checkdin.mp3.mp3" : "default",
      android_sound: "default",
      data: notification.metadata ?? {},
    }),
  });
  const result = await response.json();
  return new Response(JSON.stringify(result), { status: response.ok ? 200 : 502, headers: corsHeaders });
});
