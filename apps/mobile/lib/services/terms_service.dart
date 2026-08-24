import 'package:flutter/foundation.dart';

import 'local_cache_service.dart';

/// Tracks whether the student has accepted the terms and privacy notice.
class TermsService extends ChangeNotifier {
  TermsService._();
  static final TermsService instance = TermsService._();

  static const _cacheKey = 'terms_accepted';

  bool _accepted = false;
  bool _loaded = false;
  String? _acceptedAt;

  bool get isAccepted => _accepted;
  bool get isLoaded => _loaded;
  String? get acceptedAt => _acceptedAt;

  Future<void> init() async {
    final raw = await LocalCacheService.instance.readJson<Map<String, dynamic>>(
      _cacheKey,
      (value) => Map<String, dynamic>.from(value as Map),
    );
    _accepted = raw?['accepted'] == true;
    _acceptedAt = raw?['accepted_at'] as String?;
    _loaded = true;
    notifyListeners();
  }

  Future<void> accept() async {
    if (_accepted) return;
    _accepted = true;
    _acceptedAt = DateTime.now().toUtc().toIso8601String();
    await LocalCacheService.instance.writeJson(_cacheKey, {
      'accepted': true,
      'accepted_at': _acceptedAt,
    });
    notifyListeners();
  }
}
