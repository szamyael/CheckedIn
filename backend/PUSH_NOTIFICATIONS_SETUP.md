# OneSignal push setup

1. Create one OneSignal app with Android, iOS, and Web Push enabled. Configure Android with the Firebase Admin SDK service-account JSON and configure iOS with APNs credentials.
2. Set `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, and a random `NOTIFICATION_WEBHOOK_SECRET` as Supabase Edge Function secrets. Keep the REST key and Firebase service-account JSON out of source control.
3. The mobile app's OneSignal App ID is configured in `lib/services/push_notification_service.dart`; it does not need to be copied into `apps/mobile/.env`.
4. Deploy `send-push-notification`.
5. The linked project's `public.notifications` `INSERT` webhook is provisioned by the `trg_send_push_notification` trigger. It reads `NOTIFICATION_WEBHOOK_SECRET` from Supabase Vault; keep that value synchronized with the Edge Function secret when rotating it.

The mobile SDK signs in to OneSignal using the CheckedIn user UUID. The app requests notification permission only after the OneSignal subscription verification dialog is acknowledged.
