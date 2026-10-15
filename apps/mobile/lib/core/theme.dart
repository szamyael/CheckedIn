import 'package:flutter/material.dart';

enum AppColorTheme { navy }

extension AppColorThemeDetails on AppColorTheme {
  String get label => 'CheckedIn';

  String get description => 'Indigo, cyan & emerald';

  Color get primary => const Color(0xFF31578A);

  Color get primaryDark => const Color(0xFF8FB3E3);

  Color get primaryStrong => const Color(0xFF203C69);

  Color get primarySoft => const Color(0xFFE6EEF9);

  Color get accent => const Color(0xFF087F8C);

  Color get background => const Color(0xFFF7F9FC);

  Color get backgroundDark => const Color(0xFF111A2B);

  Color get surfaceDark => const Color(0xFF192640);

  Color get surfaceMutedDark => const Color(0xFF223452);

  Color get borderDark => const Color(0xFF354A6A);

  Color get primarySoftDark => const Color(0xFF29456D);
}

class AppTheme {
  static ThemeData build(AppColorTheme selected, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final background = dark ? selected.backgroundDark : selected.background;
    final surface = dark ? selected.surfaceDark : const Color(0xFFFFFFFF);
    final border = dark ? selected.borderDark : const Color(0xFFD9E1EC);
    final text = dark ? const Color(0xFFE6EDF7) : const Color(0xFF172033);
    final secondary = dark ? const Color(0xFFC4D0E0) : const Color(0xFF40516A);
    final muted = dark ? const Color(0xFFA7B5C8) : const Color(0xFF5F6E82);
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
        elevation: 1,
        shadowColor: Colors.black26,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: TextStyle(color: secondary, fontWeight: FontWeight.w500),
        hintStyle: TextStyle(color: muted),
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: primary, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
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
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
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
            borderRadius: BorderRadius.circular(10),
          ),
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
