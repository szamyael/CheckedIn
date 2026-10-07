# OneSignal push setup

1. Create one OneSignal app with Android, iOS, and Web Push enabled.
2. Set `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, and a random `NOTIFICATION_WEBHOOK_SECRET` as Supabase Edge Function secrets.
3. Add `ONESIGNAL_APP_ID` to `apps/mobile/.env`, then run `flutter pub get`.
4. Deploy `send-push-notification`.
5. In Supabase Dashboard, create a Database Webhook for `public.notifications` on `INSERT`:
   - URL: `https://<project-ref>.supabase.co/functions/v1/send-push-notification`
   - Header: `x-webhook-secret: <NOTIFICATION_WEBHOOK_SECRET>`

The mobile SDK signs in to OneSignal using the CheckedIn user UUID. Only devices that grant OS notification permission receive push messages.
