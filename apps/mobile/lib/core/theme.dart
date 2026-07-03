import 'package:flutter/material.dart';

class AppTheme {
  static const _textPrimary = Color(0xFF0F172A);
  static const _textSecondary = Color(0xFF334155);
  static const _textMuted = Color(0xFF475569);

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF2563EB),
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme.copyWith(
        onSurface: _textPrimary,
        onSurfaceVariant: _textSecondary,
      ),
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: _textPrimary),
        bodyMedium: TextStyle(color: _textSecondary),
        bodySmall: TextStyle(color: _textMuted),
        titleMedium: TextStyle(color: _textPrimary, fontWeight: FontWeight.w600),
        titleLarge: TextStyle(color: _textPrimary, fontWeight: FontWeight.bold),
      ),
      appBarTheme: const AppBarTheme(centerTitle: true),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: const TextStyle(color: _textSecondary),
        hintStyle: TextStyle(color: _textMuted.withValues(alpha: 0.9)),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      listTileTheme: const ListTileThemeData(
        titleTextStyle: TextStyle(color: _textPrimary, fontSize: 16),
        subtitleTextStyle: TextStyle(color: _textSecondary, fontSize: 14),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
