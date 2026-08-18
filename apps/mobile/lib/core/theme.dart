import 'package:flutter/material.dart';

class AppTheme {
  static const _teal = Color(0xFF0D9488);
  static const _bg = Color(0xFFF8FAFC);
  static const _surface = Colors.white;
  static const _border = Color(0xFFE2E8F0);
  static const _textPrimary = Color(0xFF0F172A);
  static const _textSecondary = Color(0xFF334155);
  static const _textMuted = Color(0xFF475569);

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: _teal,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: _bg,
      colorScheme: scheme.copyWith(
        primary: _teal,
        surface: _surface,
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
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        backgroundColor: _surface,
        foregroundColor: _textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardThemeData(
        color: _surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: _border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: const TextStyle(color: _textSecondary),
        hintStyle: TextStyle(color: _textMuted.withValues(alpha: 0.9)),
        filled: true,
        fillColor: _surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: _border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: _border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: _teal, width: 1.4),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      listTileTheme: const ListTileThemeData(
        titleTextStyle: TextStyle(color: _textPrimary, fontSize: 16),
        subtitleTextStyle: TextStyle(color: _textSecondary, fontSize: 14),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: _surface.withValues(alpha: 0.96),
        indicatorColor: const Color(0xFFCCFBF1),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? _teal : _textMuted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(color: selected ? _teal : _textMuted);
        }),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: _teal,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: _textPrimary,
          side: const BorderSide(color: _border),
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}
