import 'dart:async';

import 'package:onesignal_flutter/onesignal_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/env_config.dart';

class PushNotificationService {
  PushNotificationService._();
  static final instance = PushNotificationService._();
  StreamSubscription<AuthState>? _subscription;

  Future<void> init() async {
    final appId = EnvConfig.oneSignalAppId;
    if (appId == null || appId.isEmpty) return;

    OneSignal.initialize(appId);
    _sync(Supabase.instance.client.auth.currentUser?.id);
    _subscription = Supabase.instance.client.auth.onAuthStateChange.listen(
      (event) => _sync(event.session?.user.id),
    );
  }

  Future<void> _sync(String? userId) async {
    if (userId == null) {
      OneSignal.logout();
      return;
    }
    OneSignal.login(userId);
  }
}
