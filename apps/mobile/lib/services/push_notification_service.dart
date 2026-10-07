import 'dart:async';

import 'package:onesignal_flutter/onesignal_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class PushNotificationService {
  PushNotificationService._();
  static final instance = PushNotificationService._();
  static const _appId = '118240ef-b656-4895-b5ef-a2810f0c5b78';

  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;

    await OneSignal.initialize(_appId);
    _initialized = true;
    await _sync(Supabase.instance.client.auth.currentUser?.id);
    Supabase.instance.client.auth.onAuthStateChange.listen(
      (event) => unawaited(_sync(event.session?.user.id)),
    );
  }

  Future<void> _sync(String? userId) async {
    if (userId == null) {
      await OneSignal.logout();
      return;
    }
    await OneSignal.login(userId);
  }

  String? get pushSubscriptionId => OneSignal.User.pushSubscription.id;

  void addPushSubscriptionObserver(OnPushSubscriptionChangeObserver observer) {
    OneSignal.User.pushSubscription.addObserver(observer);
  }

  void removePushSubscriptionObserver(
    OnPushSubscriptionChangeObserver observer,
  ) {
    OneSignal.User.pushSubscription.removeObserver(observer);
  }

  Future<bool> requestPermission() =>
      OneSignal.Notifications.requestPermission(true);

  Future<void> addEmail(String email) => OneSignal.User.addEmail(email);

  Future<void> addSms(String phoneNumber) => OneSignal.User.addSms(phoneNumber);

  Future<void> addTag(String key, String value) =>
      OneSignal.User.addTagWithKey(key, value);

  Future<void> setLogLevel(OSLogLevel level) =>
      OneSignal.Debug.setLogLevel(level);
}
