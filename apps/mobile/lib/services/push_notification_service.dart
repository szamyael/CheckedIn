import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'appearance_service.dart';

class PushNotificationService {
  PushNotificationService._();
  static final instance = PushNotificationService._();
  static const _appId = '118240ef-b656-4895-b5ef-a2810f0c5b78';

  bool _initialized = false;
  String? _currentUserId;
  NotificationSoundPreference? _lastSoundPreference;

  Future<void> init() async {
    if (_initialized) return;

    await OneSignal.initialize(_appId);
    _initialized = true;
    AppearanceService.instance.addListener(_onAppearanceChanged);
    OneSignal.Notifications.addForegroundWillDisplayListener(
      _onForegroundWillDisplay,
    );
    await _sync(Supabase.instance.client.auth.currentUser?.id);
    Supabase.instance.client.auth.onAuthStateChange.listen(
      (event) => unawaited(_sync(event.session?.user.id)),
    );
  }

  Future<void> _sync(String? userId) async {
    _currentUserId = userId;
    if (userId == null) {
      _lastSoundPreference = null;
      await OneSignal.logout();
      return;
    }
    await OneSignal.login(userId);
    _lastSoundPreference = null;
    await _syncSoundPreference();
  }

  void _onAppearanceChanged() {
    unawaited(_syncSoundPreference());
  }

  void _onForegroundWillDisplay(OSNotificationWillDisplayEvent event) {
    if (AppearanceService.instance.notificationSoundPreference ==
        NotificationSoundPreference.checkedInMp3) {
      event.preventDefault();
    }
  }

  Future<void> _syncSoundPreference() async {
    if (!_initialized || _currentUserId == null) return;
    final preference = AppearanceService.instance.notificationSoundPreference;
    if (preference == _lastSoundPreference) return;
    _lastSoundPreference = preference;
    try {
      await OneSignal.User.addTagWithKey(
        'notification_sound_preference',
        preference == NotificationSoundPreference.checkedInMp3
            ? 'checkedin_mp3'
            : 'system',
      );
    } catch (error) {
      _lastSoundPreference = null;
      debugPrint('Failed to sync notification sound preference: $error');
    }
  }

  String? get pushSubscriptionId => OneSignal.User.pushSubscription.id;
  bool get hasNotificationPermission => OneSignal.Notifications.permission;

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
