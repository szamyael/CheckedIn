import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

class ConnectivityService extends ChangeNotifier {
  ConnectivityService._();
  static final ConnectivityService instance = ConnectivityService._();

  bool _online = true;
  bool get isOnline => _online;
  bool get isOffline => !_online;

  Future<void> init() async {
    await refresh();
    Connectivity().onConnectivityChanged.listen((_) => refresh());
  }

  Future<bool> refresh() async {
    final results = await Connectivity().checkConnectivity();
    final next = results.any((r) => r != ConnectivityResult.none);
    if (next != _online) {
      _online = next;
      notifyListeners();
    } else {
      _online = next;
    }
    return _online;
  }
}
