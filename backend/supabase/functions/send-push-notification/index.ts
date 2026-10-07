const corsHeaders = { "Content-Type": "application/json" };

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

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      include_aliases: { external_id: [notification.user_id] },
      headings: { en: notification.title },
      contents: { en: notification.body },
      data: notification.metadata ?? {},
    }),
  });
  const result = await response.json();
  return new Response(JSON.stringify(result), { status: response.ok ? 200 : 502, headers: corsHeaders });
});
