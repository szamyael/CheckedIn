import 'package:flutter/material.dart';

enum AppColorTheme { navy, forest, burgundy, indigo, slate }

extension AppColorThemeDetails on AppColorTheme {
  String get label => switch (this) {
    AppColorTheme.navy => 'Campus',
    AppColorTheme.forest => 'Forest',
    AppColorTheme.burgundy => 'Burgundy',
    AppColorTheme.indigo => 'Indigo',
    AppColorTheme.slate => 'Slate',
  };

  String get description => switch (this) {
    AppColorTheme.navy => 'Campus-ready',
    AppColorTheme.forest => 'Grounded',
    AppColorTheme.burgundy => 'Classic',
    AppColorTheme.indigo => 'Focused',
    AppColorTheme.slate => 'Neutral',
  };

  Color get primary => switch (this) {
    AppColorTheme.navy => const Color(0xFF3A6658),
    AppColorTheme.forest => const Color(0xFF486C4D),
    AppColorTheme.burgundy => const Color(0xFF80515A),
    AppColorTheme.indigo => const Color(0xFF59677E),
    AppColorTheme.slate => const Color(0xFF536A69),
  };

  Color get primaryDark => switch (this) {
    AppColorTheme.navy => const Color(0xFFA6BBA6),
    AppColorTheme.forest => const Color(0xFFAABD9F),
    AppColorTheme.burgundy => const Color(0xFFD0A7A5),
    AppColorTheme.indigo => const Color(0xFFAAB7C2),
    AppColorTheme.slate => const Color(0xFFA5BCB4),
  };

  Color get primaryStrong => switch (this) {
    AppColorTheme.navy => const Color(0xFF213B34),
    AppColorTheme.forest => const Color(0xFF2D4532),
    AppColorTheme.burgundy => const Color(0xFF50363B),
    AppColorTheme.indigo => const Color(0xFF343E50),
    AppColorTheme.slate => const Color(0xFF354746),
  };

  Color get primarySoft => switch (this) {
    AppColorTheme.navy => const Color(0xFFE4E9DF),
    AppColorTheme.forest => const Color(0xFFE3E9DC),
    AppColorTheme.burgundy => const Color(0xFFEEE3DF),
    AppColorTheme.indigo => const Color(0xFFE3E5E7),
    AppColorTheme.slate => const Color(0xFFE1E8E3),
  };

  Color get accent => switch (this) {
    AppColorTheme.navy => const Color(0xFFBD704A),
    AppColorTheme.forest => const Color(0xFFB7774E),
    AppColorTheme.burgundy => const Color(0xFFBD7653),
    AppColorTheme.indigo => const Color(0xFFB87250),
    AppColorTheme.slate => const Color(0xFFAC7551),
  };

  Color get background => switch (this) {
    AppColorTheme.navy => const Color(0xFFF2EFE7),
    AppColorTheme.forest => const Color(0xFFF1EFE5),
    AppColorTheme.burgundy => const Color(0xFFF3ECE6),
    AppColorTheme.indigo => const Color(0xFFEFEEE8),
    AppColorTheme.slate => const Color(0xFFEEEFEA),
  };

  Color get backgroundDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF1B211D),
    AppColorTheme.forest => const Color(0xFF1C221C),
    AppColorTheme.burgundy => const Color(0xFF241E1D),
    AppColorTheme.indigo => const Color(0xFF1D2023),
    AppColorTheme.slate => const Color(0xFF1C2221),
  };

  Color get surfaceDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF242B26),
    AppColorTheme.forest => const Color(0xFF252D25),
    AppColorTheme.burgundy => const Color(0xFF302725),
    AppColorTheme.indigo => const Color(0xFF272C31),
    AppColorTheme.slate => const Color(0xFF252C2B),
  };

  Color get surfaceMutedDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF2F3831),
    AppColorTheme.forest => const Color(0xFF303A30),
    AppColorTheme.burgundy => const Color(0xFF3B302E),
    AppColorTheme.indigo => const Color(0xFF333A40),
    AppColorTheme.slate => const Color(0xFF303938),
  };

  Color get borderDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF465047),
    AppColorTheme.forest => const Color(0xFF495449),
    AppColorTheme.burgundy => const Color(0xFF574542),
    AppColorTheme.indigo => const Color(0xFF4A535A),
    AppColorTheme.slate => const Color(0xFF47514E),
  };

  Color get primarySoftDark => switch (this) {
    AppColorTheme.navy => const Color(0xFF344239),
    AppColorTheme.forest => const Color(0xFF354335),
    AppColorTheme.burgundy => const Color(0xFF493432),
    AppColorTheme.indigo => const Color(0xFF364047),
    AppColorTheme.slate => const Color(0xFF34423D),
  };
}

class AppTheme {
  static ThemeData build(AppColorTheme selected, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final background = dark ? selected.backgroundDark : selected.background;
    final surface = dark ? selected.surfaceDark : const Color(0xFFFAF8F2);
    final border = dark ? selected.borderDark : const Color(0xFFD8D4C9);
    final text = dark ? const Color(0xFFE9E7DD) : const Color(0xFF28332E);
    final secondary = dark ? const Color(0xFFC6C8BE) : const Color(0xFF48554E);
    final muted = dark ? const Color(0xFFB6B8AE) : const Color(0xFF657069);
    final primary = dark ? selected.primaryDark : selected.primary;
    final scheme =
        ColorScheme.fromSeed(
          seedColor: primary,
          brightness: brightness,
        ).copyWith(
          primary: primary,
          onPrimary: dark ? background : Colors.white,
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
      splashFactory: InkSparkle.splashFactory,
      textTheme: TextTheme(
        displaySmall: TextStyle(
          fontFamily: 'serif',
          color: text,
          fontSize: 32,
          height: 1.12,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.8,
        ),
        headlineSmall: TextStyle(
          fontFamily: 'serif',
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
      iconTheme: IconThemeData(color: primary),
      primaryIconTheme: const IconThemeData(color: Colors.white),
      listTileTheme: ListTileThemeData(
        textColor: text,
        iconColor: primary,
        minVerticalPadding: 10,
      ),
      dividerTheme: DividerThemeData(color: border, thickness: 1),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: TextStyle(color: secondary, fontWeight: FontWeight.w500),
        hintStyle: TextStyle(color: muted),
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: primary, width: 1.6),
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
        height: 74,
        backgroundColor: surface,
        indicatorColor: dark ? selected.primarySoftDark : selected.primarySoft,
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
          backgroundColor: primary,
          foregroundColor: dark ? background : Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: dark ? text : selected.primaryStrong,
          side: BorderSide(color: border),
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
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
        color: primary,
        linearTrackColor: selected.primarySoft,
      ),
    );
  }
}
