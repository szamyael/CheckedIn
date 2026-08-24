import 'package:flutter/foundation.dart';

import 'local_cache_service.dart';

/// Tracks whether the student has completed the first-launch walkthrough.
class OnboardingService extends ChangeNotifier {
  OnboardingService._();
  static final OnboardingService instance = OnboardingService._();

  static const _cacheKey = 'onboarding_complete';

  bool _complete = false;
  bool _loaded = false;

  bool get isComplete => _complete;
  bool get isLoaded => _loaded;

  Future<void> init() async {
    final raw = await LocalCacheService.instance.readJson<bool>(
      _cacheKey,
      (value) => value == true,
    );
    _complete = raw ?? false;
    _loaded = true;
    notifyListeners();
  }

  Future<void> markComplete() async {
    if (_complete) return;
    _complete = true;
    await LocalCacheService.instance.writeJson(_cacheKey, true);
    notifyListeners();
  }
}
