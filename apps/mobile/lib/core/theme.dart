import 'package:flutter/material.dart';

enum AppColorTheme { navy, forest, burgundy, indigo, slate }

extension AppColorThemeDetails on AppColorTheme {
  String get label => switch (this) {
        AppColorTheme.navy => 'Navy', AppColorTheme.forest => 'Forest',
        AppColorTheme.burgundy => 'Burgundy', AppColorTheme.indigo => 'Indigo',
        AppColorTheme.slate => 'Slate',
      };
  String get description => switch (this) {
        AppColorTheme.navy => 'Institutional', AppColorTheme.forest => 'Grounded',
        AppColorTheme.burgundy => 'Classic', AppColorTheme.indigo => 'Focused',
        AppColorTheme.slate => 'Neutral',
      };
  Color get primary => switch (this) {
        AppColorTheme.navy => const Color(0xFF17324D), AppColorTheme.forest => const Color(0xFF275D46),
        AppColorTheme.burgundy => const Color(0xFF6B2E3D), AppColorTheme.indigo => const Color(0xFF3F4B88),
        AppColorTheme.slate => const Color(0xFF3F515C),
      };
  Color get primarySoft => switch (this) {
        AppColorTheme.navy => const Color(0xFFE7EEF4), AppColorTheme.forest => const Color(0xFFE7F1EB),
        AppColorTheme.burgundy => const Color(0xFFF4E9EC), AppColorTheme.indigo => const Color(0xFFE9EBF6),
        AppColorTheme.slate => const Color(0xFFE9EDEF),
      };
  Color get accent => switch (this) {
        AppColorTheme.navy => const Color(0xFFC18A2E), AppColorTheme.forest => const Color(0xFFB68032),
        AppColorTheme.burgundy => const Color(0xFFBD8A31), AppColorTheme.indigo => const Color(0xFFB98A36),
        AppColorTheme.slate => const Color(0xFFB78335),
      };
}

class AppTheme {
  static ThemeData build(AppColorTheme selected, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final background = dark ? const Color(0xFF11191E) : const Color(0xFFF6F7F5);
    final surface = dark ? const Color(0xFF182329) : Colors.white;
    final border = dark ? const Color(0xFF34434B) : const Color(0xFFE2E8F0);
    final text = dark ? Colors.white : const Color(0xFF202428);
    final secondary = dark ? const Color(0xFFD5DCE0) : const Color(0xFF3F484F);
    final muted = dark ? const Color(0xFFD5DCE0) : const Color(0xFF697178);
    final scheme = ColorScheme.fromSeed(seedColor: selected.primary, brightness: brightness).copyWith(
      primary: selected.primary, onPrimary: Colors.white, secondary: selected.accent,
      surface: surface, onSurface: text,
      surfaceContainerHighest: dark ? const Color(0xFF223037) : selected.primarySoft,
      outline: border,
    );
    return ThemeData(
      useMaterial3: true, brightness: brightness, scaffoldBackgroundColor: background, colorScheme: scheme,
      textTheme: TextTheme(
        bodyLarge: TextStyle(color: text), bodyMedium: TextStyle(color: secondary), bodySmall: TextStyle(color: muted),
        titleMedium: TextStyle(color: text, fontWeight: FontWeight.w600), titleLarge: TextStyle(color: text, fontWeight: FontWeight.bold),
      ),
      appBarTheme: AppBarTheme(centerTitle: true, backgroundColor: surface, foregroundColor: text, elevation: 0, scrolledUnderElevation: 0),
      cardTheme: CardThemeData(color: surface, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: border))),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: TextStyle(color: secondary), hintStyle: TextStyle(color: muted), filled: true, fillColor: surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: selected.primary, width: 1.4)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface, indicatorColor: selected.primarySoft,
        labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: states.contains(WidgetState.selected) ? selected.primary : muted)),
        iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(color: states.contains(WidgetState.selected) ? selected.primary : muted)),
      ),
      filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(backgroundColor: selected.primary, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(54), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)))),
      outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(foregroundColor: text, side: BorderSide(color: border), minimumSize: const Size.fromHeight(48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)))),
    );
  }
}
