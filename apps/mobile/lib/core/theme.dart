import 'package:flutter/material.dart';

enum AppColorTheme {
  navy(
    label: 'CheckedIn',
    description: 'Indigo, cyan & emerald',
    primary: Color(0xFF31578A),
    primaryDark: Color(0xFF8FB3E3),
    primaryStrong: Color(0xFF203C69),
    primarySoft: Color(0xFFE6EEF9),
    accent: Color(0xFF087F8C),
    background: Color(0xFFF7F9FC),
    backgroundDark: Color(0xFF111A2B),
    surfaceDark: Color(0xFF192640),
    surfaceMutedDark: Color(0xFF223452),
    borderDark: Color(0xFF354A6A),
    primarySoftDark: Color(0xFF29456D),
  ),
  violet(
    label: 'Violet',
    description: 'Rich violet with lilac highlights',
    primary: Color(0xFF68428C),
    primaryDark: Color(0xFFC9A9E6),
    primaryStrong: Color(0xFF492766),
    primarySoft: Color(0xFFF0E7F7),
    accent: Color(0xFF68428C),
    background: Color(0xFFFAF8FC),
    backgroundDark: Color(0xFF1A1420),
    surfaceDark: Color(0xFF282032),
    surfaceMutedDark: Color(0xFF352941),
    borderDark: Color(0xFF554563),
    primarySoftDark: Color(0xFF422D55),
  ),
  orange(
    label: 'Orange',
    description: 'Warm orange with apricot highlights',
    primary: Color(0xFF9A4E18),
    primaryDark: Color(0xFFF0B17D),
    primaryStrong: Color(0xFF71370E),
    primarySoft: Color(0xFFFBEBDD),
    accent: Color(0xFF9A4E18),
    background: Color(0xFFFCF8F5),
    backgroundDark: Color(0xFF1F1712),
    surfaceDark: Color(0xFF2D221A),
    surfaceMutedDark: Color(0xFF3B2D22),
    borderDark: Color(0xFF5B4332),
    primarySoftDark: Color(0xFF593019),
  ),
  maroon(
    label: 'Maroon',
    description: 'Deep maroon with soft rose highlights',
    primary: Color(0xFF7B3047),
    primaryDark: Color(0xFFE8A6B6),
    primaryStrong: Color(0xFF5A2234),
    primarySoft: Color(0xFFF5E7EC),
    accent: Color(0xFF7B3047),
    background: Color(0xFFFBF7F8),
    backgroundDark: Color(0xFF1D1418),
    surfaceDark: Color(0xFF2A1D23),
    surfaceMutedDark: Color(0xFF38262E),
    borderDark: Color(0xFF5A3B48),
    primarySoftDark: Color(0xFF512B36),
  ),
  armyGreen(
    label: 'Army Green',
    description: 'Olive green with sage highlights',
    primary: Color(0xFF4B6339),
    primaryDark: Color(0xFFA9C686),
    primaryStrong: Color(0xFF34472A),
    primarySoft: Color(0xFFE9EDE3),
    accent: Color(0xFF4B6339),
    background: Color(0xFFF8F9F5),
    backgroundDark: Color(0xFF151A12),
    surfaceDark: Color(0xFF21291C),
    surfaceMutedDark: Color(0xFF2C3625),
    borderDark: Color(0xFF46533B),
    primarySoftDark: Color(0xFF34442C),
  ),
  black(
    label: 'Black',
    description: 'Monochrome with clean contrast',
    primary: Color(0xFF303030),
    primaryDark: Color(0xFFD6D6D6),
    primaryStrong: Color(0xFF202020),
    primarySoft: Color(0xFFECECEC),
    accent: Color(0xFF303030),
    background: Color(0xFFF7F7F7),
    backgroundDark: Color(0xFF121212),
    surfaceDark: Color(0xFF202020),
    surfaceMutedDark: Color(0xFF2B2B2B),
    borderDark: Color(0xFF484848),
    primarySoftDark: Color(0xFF383838),
  ),
  grey(
    label: 'Grey',
    description: 'Slate grey with cool highlights',
    primary: Color(0xFF526276),
    primaryDark: Color(0xFFB5C4D6),
    primaryStrong: Color(0xFF344455),
    primarySoft: Color(0xFFE9EDF2),
    accent: Color(0xFF526276),
    background: Color(0xFFF7F8FA),
    backgroundDark: Color(0xFF141A21),
    surfaceDark: Color(0xFF202934),
    surfaceMutedDark: Color(0xFF2C3744),
    borderDark: Color(0xFF465464),
    primarySoftDark: Color(0xFF34414F),
  );

  const AppColorTheme({
    required this.label,
    required this.description,
    required this.primary,
    required this.primaryDark,
    required this.primaryStrong,
    required this.primarySoft,
    required this.accent,
    required this.background,
    required this.backgroundDark,
    required this.surfaceDark,
    required this.surfaceMutedDark,
    required this.borderDark,
    required this.primarySoftDark,
  });

  final String label;
  final String description;
  final Color primary;
  final Color primaryDark;
  final Color primaryStrong;
  final Color primarySoft;
  final Color accent;
  final Color background;
  final Color backgroundDark;
  final Color surfaceDark;
  final Color surfaceMutedDark;
  final Color borderDark;
  final Color primarySoftDark;
}

class CheckedInPageTransitionsBuilder extends PageTransitionsBuilder {
  const CheckedInPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final progress = CurvedAnimation(
      parent: animation,
      curve: reduceMotion
          ? const Interval(0, 0.4, curve: Curves.easeOutCubic)
          : Curves.easeOutCubic,
    );
    final content = FadeTransition(opacity: progress, child: child);

    if (reduceMotion) return content;

    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 0.035),
        end: Offset.zero,
      ).animate(progress),
      child: content,
    );
  }
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
          onSecondary: dark ? background : Colors.white,
          surface: surface,
          onSurface: text,
          surfaceContainerHighest: dark
              ? selected.surfaceMutedDark
              : selected.primarySoft,
          onSurfaceVariant: muted,
          outline: border,
          tertiary: dark ? const Color(0xFFF1C67B) : const Color(0xFFA46618),
          onTertiary: dark ? const Color(0xFF3B2B11) : Colors.white,
          tertiaryContainer: dark
              ? const Color(0xFF44351D)
              : const Color(0xFFFFF7E7),
          onTertiaryContainer: dark
              ? const Color(0xFFF9E2B8)
              : const Color(0xFF79530F),
          error: const Color(0xFFAE4146),
        );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: background,
      colorScheme: scheme,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CheckedInPageTransitionsBuilder(),
          TargetPlatform.iOS: CheckedInPageTransitionsBuilder(),
          TargetPlatform.linux: CheckedInPageTransitionsBuilder(),
          TargetPlatform.macOS: CheckedInPageTransitionsBuilder(),
          TargetPlatform.windows: CheckedInPageTransitionsBuilder(),
          TargetPlatform.fuchsia: CheckedInPageTransitionsBuilder(),
        },
      ),
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
      primaryIconTheme: IconThemeData(color: dark ? background : Colors.white),
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
        linearTrackColor: dark
            ? selected.primarySoftDark
            : selected.primarySoft,
      ),
    );
  }
}
