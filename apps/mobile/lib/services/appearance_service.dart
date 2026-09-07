import 'package:flutter/material.dart';

import '../core/theme.dart';
import 'local_cache_service.dart';

class AppearanceService extends ChangeNotifier {
  AppearanceService._();
  static final AppearanceService instance = AppearanceService._();
  static const _cacheKey = 'appearance_settings';
  AppColorTheme _colorTheme = AppColorTheme.navy;
  ThemeMode _themeMode = ThemeMode.system;

  AppColorTheme get colorTheme => _colorTheme;
  ThemeMode get themeMode => _themeMode;

  Future<void> init() async {
    final saved = await LocalCacheService.instance.readJson<Map<String, dynamic>>(_cacheKey, (raw) => raw is Map ? Map<String, dynamic>.from(raw) : null);
    final colorName = saved?['color_theme'] as String?;
    final modeName = saved?['theme_mode'] as String?;
    _colorTheme = AppColorTheme.values.where((item) => item.name == colorName).firstOrNull ?? AppColorTheme.navy;
    _themeMode = ThemeMode.values.where((item) => item.name == modeName).firstOrNull ?? ThemeMode.system;
    notifyListeners();
  }

  Future<void> setColorTheme(AppColorTheme value) async { if (_colorTheme != value) { _colorTheme = value; notifyListeners(); await _save(); } }
  Future<void> setThemeMode(ThemeMode value) async { if (_themeMode != value) { _themeMode = value; notifyListeners(); await _save(); } }
  Future<void> _save() => LocalCacheService.instance.writeJson(_cacheKey, {'color_theme': _colorTheme.name, 'theme_mode': _themeMode.name});
}
