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
    AppColorTheme.navy => 'Campus navy',
    AppColorTheme.forest => 'Grounded',
    AppColorTheme.burgundy => 'Classic',
    AppColorTheme.indigo => 'Focused',
    AppColorTheme.slate => 'Neutral',
  };

  Color get primary => switch (this) {
    AppColorTheme.navy => const Color(0xFF345B9A),
    AppColorTheme.forest => const Color(0xFF347753),
    AppColorTheme.burgundy => const Color(0xFF91465C),
    AppColorTheme.indigo => const Color(0xFF5865AD),
    AppColorTheme.slate => const Color(0xFF536B7A),
  };

  Color get primaryStrong => switch (this) {
    AppColorTheme.navy => const Color(0xFF1D3459),
    AppColorTheme.forest => const Color(0xFF1D4934),
    AppColorTheme.burgundy => const Color(0xFF562C3B),
    AppColorTheme.indigo => const Color(0xFF303B74),
    AppColorTheme.slate => const Color(0xFF344954),
  };

  Color get primarySoft => switch (this) {
    AppColorTheme.navy => const Color(0xFFE5EDF9),
    AppColorTheme.forest => const Color(0xFFE5F2E9),
    AppColorTheme.burgundy => const Color(0xFFF5E8ED),
    AppColorTheme.indigo => const Color(0xFFEAECFA),
    AppColorTheme.slate => const Color(0xFFE9EFF2),
  };

  Color get accent => switch (this) {
    AppColorTheme.navy => const Color(0xFFD99B32),
    AppColorTheme.forest => const Color(0xFFD19A45),
    AppColorTheme.burgundy => const Color(0xFFD4A25A),
    AppColorTheme.indigo => const Color(0xFFD5A34E),
    AppColorTheme.slate => const Color(0xFFC08D45),
  };

  Color get background => switch (this) {
    AppColorTheme.navy => const Color(0xFFF2F5FA),
    AppColorTheme.forest => const Color(0xFFF1F6F2),
    AppColorTheme.burgundy => const Color(0xFFF8F2F4),
    AppColorTheme.indigo => const Color(0xFFF3F4FA),
    AppColorTheme.slate => const Color(0xFFF2F5F6),
  };

  Color get backgroundDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF111A28),
    AppColorTheme.forest => const Color(0xFF111E19),
    AppColorTheme.burgundy => const Color(0xFF21171D),
    AppColorTheme.indigo => const Color(0xFF171827),
    AppColorTheme.slate => const Color(0xFF171E22),
  };

  Color get surfaceDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF19263A),
    AppColorTheme.forest => const Color(0xFF1A2B23),
    AppColorTheme.burgundy => const Color(0xFF302129),
    AppColorTheme.indigo => const Color(0xFF22243A),
    AppColorTheme.slate => const Color(0xFF222C32),
  };

  Color get surfaceMutedDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF22324A),
    AppColorTheme.forest => const Color(0xFF24382E),
    AppColorTheme.burgundy => const Color(0xFF3C2B34),
    AppColorTheme.indigo => const Color(0xFF2C2F49),
    AppColorTheme.slate => const Color(0xFF2C383F),
  };

  Color get borderDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF34445E),
    AppColorTheme.forest => const Color(0xFF385143),
    AppColorTheme.burgundy => const Color(0xFF553C49),
    AppColorTheme.indigo => const Color(0xFF414562),
    AppColorTheme.slate => const Color(0xFF414F56),
  };

  Color get primarySoftDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF263C5C),
    AppColorTheme.forest => const Color(0xFF294735),
    AppColorTheme.burgundy => const Color(0xFF49303C),
    AppColorTheme.indigo => const Color(0xFF353858),
    AppColorTheme.slate => const Color(0xFF34444C),
  };
}

class AppTheme {
  static ThemeData build(AppColorTheme selected, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final background = dark ? selected.backgroundDark : selected.background;
    final surface = dark ? selected.surfaceDark : Colors.white;
    final border = dark ? selected.borderDark : const Color(0xFFD9E1EC);
    final text = dark ? const Color(0xFFEEF2F8) : const Color(0xFF182638);
    final secondary = dark ? const Color(0xFFC6D2E0) : const Color(0xFF42546A);
    final muted = dark ? const Color(0xFFA5B2C4) : const Color(0xFF64748B);
    final scheme =
        ColorScheme.fromSeed(
          seedColor: selected.primary,
          brightness: brightness,
        ).copyWith(
          primary: selected.primary,
          onPrimary: Colors.white,
          primaryContainer: dark
              ? selected.primarySoftDark
              : selected.primarySoft,
          onPrimaryContainer: dark ? Colors.white : selected.primaryStrong,
          secondary: selected.accent,
          onSecondary: const Color(0xFF31230D),
          surface: surface,
          onSurface: text,
          surfaceContainerHighest: dark
              ? selected.surfaceMutedDark
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
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
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
