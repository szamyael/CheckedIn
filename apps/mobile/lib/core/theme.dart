import 'package:flutter/material.dart';

enum AppColorTheme { navy, forest, burgundy, indigo, slate }

extension AppColorThemeDetails on AppColorTheme {
  String get label => switch (this) {
    AppColorTheme.navy => 'Navy',
    AppColorTheme.forest => 'Forest',
    AppColorTheme.burgundy => 'Burgundy',
    AppColorTheme.indigo => 'Indigo',
    AppColorTheme.slate => 'Slate',
  };

  String get description => switch (this) {
    AppColorTheme.navy => 'Campus teal',
    AppColorTheme.forest => 'Grounded',
    AppColorTheme.burgundy => 'Classic',
    AppColorTheme.indigo => 'Focused',
    AppColorTheme.slate => 'Neutral',
  };

  Color get primary => switch (this) {
    AppColorTheme.navy => const Color(0xFF0D716A),
    AppColorTheme.forest => const Color(0xFF28734E),
    AppColorTheme.burgundy => const Color(0xFF853F51),
    AppColorTheme.indigo => const Color(0xFF4B5C9A),
    AppColorTheme.slate => const Color(0xFF47616C),
  };

  Color get primaryStrong => switch (this) {
    AppColorTheme.navy => const Color(0xFF163A45),
    AppColorTheme.forest => const Color(0xFF194A36),
    AppColorTheme.burgundy => const Color(0xFF562D3A),
    AppColorTheme.indigo => const Color(0xFF303D70),
    AppColorTheme.slate => const Color(0xFF304650),
  };

  Color get primarySoft => switch (this) {
    AppColorTheme.navy => const Color(0xFFE4F1EC),
    AppColorTheme.forest => const Color(0xFFE8F3EB),
    AppColorTheme.burgundy => const Color(0xFFF6E9ED),
    AppColorTheme.indigo => const Color(0xFFECEEFA),
    AppColorTheme.slate => const Color(0xFFEAF0F2),
  };

  Color get accent => switch (this) {
    AppColorTheme.navy => const Color(0xFFD99B32),
    AppColorTheme.forest => const Color(0xFFBC8530),
    AppColorTheme.burgundy => const Color(0xFFC28B37),
    AppColorTheme.indigo => const Color(0xFFBD8A36),
    AppColorTheme.slate => const Color(0xFFB78335),
  };
}

class AppTheme {
  static ThemeData build(AppColorTheme selected, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final background = dark
        ? const Color(0xFF101B1E)
        : const Color(0xFFF3F7F5);
    final surface = dark ? const Color(0xFF172528) : Colors.white;
    final border = dark
        ? const Color(0xFF30464A)
        : const Color(0xFFDCE7E2);
    final text = dark ? const Color(0xFFF2F7F4) : const Color(0xFF172C35);
    final secondary = dark
        ? const Color(0xFFC6D2D0)
        : const Color(0xFF42565C);
    final muted = dark
        ? const Color(0xFFA8B8B7)
        : const Color(0xFF64747A);
    final scheme = ColorScheme.fromSeed(
      seedColor: selected.primary,
      brightness: brightness,
    ).copyWith(
      primary: selected.primary,
      onPrimary: Colors.white,
      primaryContainer: dark
          ? selected.primaryStrong.withValues(alpha: 0.72)
          : selected.primarySoft,
      onPrimaryContainer: dark ? Colors.white : selected.primaryStrong,
      secondary: selected.accent,
      onSecondary: const Color(0xFF31230D),
      surface: surface,
      onSurface: text,
      surfaceContainerHighest: dark
          ? const Color(0xFF203336)
          : selected.primarySoft,
      outline: border,
      error: const Color(0xFFAE4146),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: background,
      colorScheme: scheme,
      visualDensity: VisualDensity.standard,
      textTheme: TextTheme(
        displaySmall: TextStyle(
          color: text,
          fontSize: 32,
          height: 1.12,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.8,
        ),
        headlineSmall: TextStyle(
          color: text,
          fontSize: 25,
          height: 1.2,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
        ),
        titleLarge: TextStyle(
          color: text,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.25,
        ),
        titleMedium: TextStyle(
          color: text,
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: TextStyle(color: text, height: 1.45),
        bodyMedium: TextStyle(color: secondary, height: 1.4),
        bodySmall: TextStyle(color: muted, height: 1.4),
        labelLarge: const TextStyle(fontWeight: FontWeight.w700),
      ),
      iconTheme: IconThemeData(color: selected.primary),
      primaryIconTheme: const IconThemeData(color: Colors.white),
      listTileTheme: ListTileThemeData(
        textColor: text,
        iconColor: selected.primary,
        minVerticalPadding: 10,
      ),
      dividerTheme: DividerThemeData(color: border, thickness: 1),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        titleTextStyle: TextStyle(
          color: text,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
        contentTextStyle: TextStyle(color: secondary, height: 1.45),
      ),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        backgroundColor: surface,
        foregroundColor: text,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: TextStyle(
          color: text,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: TextStyle(color: secondary, fontWeight: FontWeight.w500),
        hintStyle: TextStyle(color: muted),
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: selected.primary, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: scheme.error),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 70,
        backgroundColor: surface,
        indicatorColor: selected.primarySoft,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: states.contains(WidgetState.selected)
                ? (dark ? text : selected.primaryStrong)
                : muted,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected)
                ? (dark ? text : selected.primaryStrong)
                : muted,
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: selected.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: dark ? text : selected.primaryStrong,
          side: BorderSide(color: border),
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: selected.primary,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: dark
            ? const Color(0xFF263A3D)
            : const Color(0xFF173A42),
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: selected.primary,
        linearTrackColor: selected.primarySoft,
      ),
    );
  }
}
