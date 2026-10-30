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
    surfaceMuted: Color(0xFFEEF2F7),
    border: Color(0xFFD9E1EC),
    actionBackground: Color(0xFF1E3A8A),
    actionBackgroundDark: Color(0xFF2F5D9F),
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
    surfaceMuted: Color(0xFFF1EBF5),
    border: Color(0xFFE5DCED),
    actionBackground: Color(0xFF68428C),
    actionBackgroundDark: Color(0xFF68428C),
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
    surfaceMuted: Color(0xFFF5EEE8),
    border: Color(0xFFEEDFD2),
    actionBackground: Color(0xFF9A4E18),
    actionBackgroundDark: Color(0xFF9A4E18),
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
    surfaceMuted: Color(0xFFF4EAEE),
    border: Color(0xFFEADDE2),
    actionBackground: Color(0xFF7B3047),
    actionBackgroundDark: Color(0xFF7B3047),
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
    surfaceMuted: Color(0xFFEEF0E9),
    border: Color(0xFFDFE3D8),
    actionBackground: Color(0xFF4B6339),
    actionBackgroundDark: Color(0xFF4B6339),
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
    surfaceMuted: Color(0xFFEFEFEF),
    border: Color(0xFFE2E2E2),
    actionBackground: Color(0xFF303030),
    actionBackgroundDark: Color(0xFF484848),
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
    surfaceMuted: Color(0xFFEDF0F4),
    border: Color(0xFFDFE4EA),
    actionBackground: Color(0xFF526276),
    actionBackgroundDark: Color(0xFF526276),
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
    required this.surfaceMuted,
    required this.border,
    required this.actionBackground,
    required this.actionBackgroundDark,
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
  final Color surfaceMuted;
  final Color border;
  final Color actionBackground;
  final Color actionBackgroundDark;
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
    if (reduceMotion) return child;
    final progress = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
    final content = FadeTransition(opacity: progress, child: child);

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
  static ThemeData build(AppColorTheme _, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final background = dark ? const Color(0xFF202722) : const Color(0xFFF7F8F7);
    final surface = dark ? const Color(0xFF29312C) : const Color(0xFFFFFFFF);
    final surfaceMuted = dark
        ? const Color(0xFF343D37)
        : const Color(0xFFF1F3F1);
    final border = dark ? const Color(0xFF4A554D) : const Color(0xFFDCE3DD);
    final controlBorder = dark
        ? const Color(0xFF7B8A80)
        : const Color(0xFF7F8C85);
    final text = dark ? const Color(0xFFF0F3F0) : const Color(0xFF242927);
    final secondary = dark ? const Color(0xFFB9C3BC) : const Color(0xFF6B736E);
    final muted = secondary;
    final action = const Color(0xFF42675B);
    final primary = dark ? const Color(0xFFA8C6B9) : const Color(0xFF587D70);
    final statusSuccess = dark
        ? const Color(0xFF8AC7A5)
        : const Color(0xFF3F765F);
    final statusWarning = dark
        ? const Color(0xFFD7B876)
        : const Color(0xFF8C672C);
    final statusError = dark
        ? const Color(0xFFF09084)
        : const Color(0xFFA2443D);
    final primarySoft = dark
        ? const Color(0xFF344B42)
        : const Color(0xFFE5EEEA);
    final tertiarySoft = dark
        ? const Color(0xFF4A4030)
        : const Color(0xFFF1E8D6);
    final inset = dark ? const Color(0xFF252D28) : const Color(0xFFF1F3F1);
    final scheme =
        ColorScheme.fromSeed(
          seedColor: primary,
          brightness: brightness,
        ).copyWith(
          primary: primary,
          onPrimary: dark ? background : Colors.white,
          primaryContainer: primarySoft,
          onPrimaryContainer: dark ? text : const Color(0xFF2F4D43),
          secondary: statusSuccess,
          onSecondary: dark ? background : Colors.white,
          secondaryContainer: primarySoft,
          onSecondaryContainer: dark ? text : const Color(0xFF2F4D43),
          surface: surface,
          onSurface: text,
          surfaceContainerHighest: surfaceMuted,
          onSurfaceVariant: muted,
          outline: border,
          outlineVariant: border,
          tertiary: statusWarning,
          onTertiary: dark ? background : Colors.white,
          tertiaryContainer: tertiarySoft,
          onTertiaryContainer: dark ? text : const Color(0xFF654C23),
          error: statusError,
          onError: dark ? background : Colors.white,
          errorContainer: dark
              ? const Color(0xFF56332F)
              : const Color(0xFFF6E7E4),
          onErrorContainer: dark
              ? const Color(0xFFFFDAD4)
              : const Color(0xFF6D2823),
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
      splashFactory: InkRipple.splashFactory,
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
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: border.withValues(alpha: 0.45)),
        ),
        titleTextStyle: TextStyle(
          color: text,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
        contentTextStyle: TextStyle(color: secondary, height: 1.45),
      ),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        backgroundColor: background,
        foregroundColor: text,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        toolbarHeight: 60,
        titleTextStyle: TextStyle(
          color: text,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 1,
        shadowColor: dark
            ? const Color(0x26000000)
            : const Color(0x102D4036),
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: border.withValues(alpha: 0.45)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: TextStyle(color: secondary, fontWeight: FontWeight.w500),
        hintStyle: TextStyle(color: muted),
        filled: true,
        fillColor: inset,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: controlBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: controlBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.error, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 12,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 78,
        backgroundColor: surface,
        indicatorColor: primarySoft,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: states.contains(WidgetState.selected) ? text : muted,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected) ? primary : muted,
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.disabled)
                ? surfaceMuted
                : states.contains(WidgetState.pressed)
                ? const Color(0xFF2F4D43)
                : action,
          ),
          foregroundColor: WidgetStateProperty.resolveWith(
            (states) =>
                states.contains(WidgetState.disabled) ? muted : Colors.white,
          ),
          minimumSize: const WidgetStatePropertyAll(Size.fromHeight(44)),
          elevation: const WidgetStatePropertyAll(0),
          shape: const WidgetStatePropertyAll(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
          ),
          textStyle: const WidgetStatePropertyAll(
            TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: BorderSide(color: border.withValues(alpha: 0.65)),
          minimumSize: const Size.fromHeight(40),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
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
        backgroundColor: surface,
        contentTextStyle: TextStyle(color: text),
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: border.withValues(alpha: 0.4)),
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: primary,
        linearTrackColor: inset,
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? primary : inset,
        ),
        checkColor: WidgetStatePropertyAll(dark ? background : Colors.white),
        side: BorderSide(color: border, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? primary : muted,
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) =>
              states.contains(WidgetState.selected) ? Colors.white : surface,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? primary : inset,
        ),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: dark
                  ? const Color(0x33000000)
                  : const Color(0x142D4036),
              offset: const Offset(0, 2),
              blurRadius: 8,
            ),
          ],
        ),
        textStyle: TextStyle(color: text, fontSize: 12),
      ),
    );
  }
}
