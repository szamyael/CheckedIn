import 'package:flutter/material.dart';

import '../core/theme.dart';
import 'local_cache_service.dart';

enum NotificationSoundPreference { system, checkedInMp3 }

class AppearanceService extends ChangeNotifier {
  AppearanceService._();
  static final AppearanceService instance = AppearanceService._();
  static const _cacheKey = 'appearance_settings';
  AppColorTheme _colorTheme = AppColorTheme.navy;
  // Light is intentional: following the device is opt-in through the System
  // choice in Appearance.
  ThemeMode _themeMode = ThemeMode.light;
  NotificationSoundPreference _notificationSoundPreference =
      NotificationSoundPreference.system;

  AppColorTheme get colorTheme => _colorTheme;
  ThemeMode get themeMode => _themeMode;
  NotificationSoundPreference get notificationSoundPreference =>
      _notificationSoundPreference;
  bool get notificationSoundEnabled =>
      _notificationSoundPreference == NotificationSoundPreference.checkedInMp3;

  Future<void> init() async {
    final saved = await LocalCacheService.instance
        .readJson<Map<String, dynamic>>(
          _cacheKey,
          (raw) => raw is Map ? Map<String, dynamic>.from(raw) : null,
        );
    final colorName = saved?['color_theme'] as String?;
    final modeName = saved?['theme_mode'] as String?;
    final soundName = saved?['notification_sound_preference'] as String?;
    final legacyEnabled = saved?['notification_sound_enabled'] as bool?;
    _notificationSoundPreference =
        NotificationSoundPreference.values
            .where((item) => item.name == soundName)
            .firstOrNull ??
        (legacyEnabled == true
            ? NotificationSoundPreference.checkedInMp3
            : NotificationSoundPreference.system);
    _colorTheme =
        AppColorTheme.values
            .where((item) => item.name == colorName)
            .firstOrNull ??
        AppColorTheme.navy;
    _themeMode =
        ThemeMode.values.where((item) => item.name == modeName).firstOrNull ??
        ThemeMode.light;
    notifyListeners();
  }

  Future<void> setColorTheme(AppColorTheme value) async {
    if (_colorTheme != value) {
      _colorTheme = value;
      notifyListeners();
      await _save();
    }
  }

  Future<void> setThemeMode(ThemeMode value) async {
    if (_themeMode != value) {
      _themeMode = value;
      notifyListeners();
      await _save();
    }
  }

  Future<void> setNotificationSoundPreference(
    NotificationSoundPreference value,
  ) async {
    if (_notificationSoundPreference != value) {
      _notificationSoundPreference = value;
      notifyListeners();
      await _save();
    }
  }

  Future<void> setNotificationSoundEnabled(bool value) async {
    final nextPreference = value
        ? NotificationSoundPreference.checkedInMp3
        : NotificationSoundPreference.system;
    await setNotificationSoundPreference(nextPreference);
  }

  Future<void> _save() => LocalCacheService.instance.writeJson(_cacheKey, {
    'color_theme': _colorTheme.name,
    'theme_mode': _themeMode.name,
    'notification_sound_preference': _notificationSoundPreference.name,
    'notification_sound_enabled': notificationSoundEnabled,
  });
}
