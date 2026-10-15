import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

import '../core/env_config.dart';

class ConnectivityService extends ChangeNotifier {
  ConnectivityService._();
  static final ConnectivityService instance = ConnectivityService._();

  bool _online = true;
  bool get isOnline => _online;
  bool get isOffline => !_online;

  Future<void> init() async {
    await refresh();
    Connectivity().onConnectivityChanged.listen((_) => unawaited(refresh()));
  }

  Future<bool> refresh() async {
    final results = await Connectivity().checkConnectivity();
    final hasTransport = results.any((r) => r != ConnectivityResult.none);
    final next = hasTransport && await _canReachSupabase();
    if (next != _online) {
      _online = next;
      notifyListeners();
    } else {
      _online = next;
    }
    return _online;
  }

  static bool isReachableHttpStatus(int statusCode) =>
      statusCode >= 200 && statusCode < 500;

  Future<bool> _canReachSupabase() async {
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 3);
    try {
      final request = await client.getUrl(
        Uri.parse('${EnvConfig.supabaseUrl}/auth/v1/health'),
      );
      request.headers.set('apikey', EnvConfig.supabaseAnonKey);
      final response = await request.close().timeout(
        const Duration(seconds: 3),
      );
      await response.drain<void>();
      return isReachableHttpStatus(response.statusCode);
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
  }
}
