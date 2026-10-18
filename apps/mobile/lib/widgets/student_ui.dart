import 'package:flutter/material.dart';

import 'app_logo.dart';

/// Shared colors derived from the active application theme.
class StudentUi {
  static const _successLight = Color(0xFF087A5C);
  static const _successDark = Color(0xFF63D9AE);

  final ThemeData _theme;

  StudentUi.of(BuildContext context) : _theme = Theme.of(context);

  ColorScheme get _colors => _theme.colorScheme;

  Color get border => _colors.outline;
  Color get accent => _colors.primary;
  Color get accentSoft => _colors.primaryContainer;
  Color get accentText => _colors.onPrimaryContainer;
  Color get actionBackground =>
      _theme.filledButtonTheme.style?.backgroundColor?.resolve({}) ??
      _colors.primary;
  Color get actionForeground =>
      _theme.filledButtonTheme.style?.foregroundColor?.resolve({}) ??
      _colors.onPrimary;
  Color get success =>
      _theme.brightness == Brightness.dark ? _successDark : _successLight;
  Color get successSurface =>
      Color.alphaBlend(success.withValues(alpha: 0.12), _colors.surface);
  Color get successBorder =>
      Color.alphaBlend(success.withValues(alpha: 0.38), _colors.outline);
  Color get muted => _colors.onSurfaceVariant;
  Color get neutralBackground => _colors.surfaceContainerHighest;
}

class StudentStepIndicator extends StatelessWidget {
  final int current;
  final int total;

  const StudentStepIndicator({
    super.key,
    required this.current,
    this.total = 4,
  });

  static const _labels = ['Scan', 'Location', 'OTP', 'Selfie'];
  static const _icons = [
    Icons.qr_code_2,
    Icons.location_on_outlined,
    Icons.verified_user_outlined,
    Icons.camera_alt_outlined,
  ];

  @override
  Widget build(BuildContext context) {
    final ui = StudentUi.of(context);
    return Semantics(
      label: 'Check-in progress, step $current of $total',
      child: LayoutBuilder(
        builder: (context, constraints) => Stack(
          children: [
            if (total > 1)
              Positioned(
                left: constraints.maxWidth / (2 * total),
                right: constraints.maxWidth / (2 * total),
                top: 18,
                child: Row(
                  children: List.generate(
                    total - 1,
                    (index) => Expanded(
                      child: Container(
                        height: 1,
                        color: index + 1 < current ? ui.accent : ui.border,
                      ),
                    ),
                  ),
                ),
              ),
            Row(
              children: List.generate(total, (index) {
                final step = index + 1;
                final complete = step < current;
                final active = step == current;
                return Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: complete
                            ? ui.accent
                            : active
                            ? ui.accentSoft
                            : ui.neutralBackground,
                        child: Icon(
                          complete ? Icons.check : _icons[index],
                          size: 17,
                          color: complete
                              ? Theme.of(context).colorScheme.onPrimary
                              : active
                              ? ui.accentText
                              : ui.muted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _labels[index],
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: active
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: active ? ui.accentText : ui.muted,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}

class StudentPageTitle extends StatelessWidget {
  final String title;
  final String? subtitle;

  const StudentPageTitle({super.key, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
        ],
      ],
    );
  }
}

class StudentCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const StudentCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Padding(padding: padding, child: child),
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: card,
      ),
    );
  }
}

class StudentEmptyState extends StatelessWidget {
  final IconData icon;
  final String message;

  const StudentEmptyState({
    super.key,
    required this.icon,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    final ui = StudentUi.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        children: [
          Icon(icon, size: 48, color: ui.muted),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class StudentErrorBanner extends StatelessWidget {
  final String message;

  const StudentErrorBanner({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.errorContainer,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: colors.error.withValues(alpha: 0.35)),
      ),
      child: Text(
        message,
        style: TextStyle(color: colors.onErrorContainer, fontSize: 13),
      ),
    );
  }
}

class StudentInfoBanner extends StatelessWidget {
  final String message;
  final IconData icon;
  final Color? background;
  final Color? border;
  final Color? foreground;
  final Widget? action;

  const StudentInfoBanner({
    super.key,
    required this.message,
    required this.icon,
    this.background,
    this.border,
    this.foreground,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final background = this.background ?? colors.tertiaryContainer;
    final border = this.border ?? colors.outlineVariant;
    final foreground = this.foreground ?? colors.onTertiaryContainer;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: foreground),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: foreground, fontSize: 13, height: 1.35),
            ),
          ),
          ?action,
        ],
      ),
    );
  }
}

class StudentSecondaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;

  const StudentSecondaryButton({
    super.key,
    required this.label,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(onPressed: onPressed, child: Text(label));
  }
}

class StudentTealCallout extends StatelessWidget {
  final String message;
  final VoidCallback? onTap;
  final String? actionLabel;

  const StudentTealCallout({
    super.key,
    required this.message,
    this.onTap,
    this.actionLabel,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Ink(
          decoration: BoxDecoration(
            color: colors.primaryContainer,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: colors.outline),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Text(
            actionLabel == null ? message : '$message\n$actionLabel',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: colors.onPrimaryContainer,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

class StudentAuthScaffold extends StatelessWidget {
  final Widget child;
  final String? title;
  final String? subtitle;
  final bool showLogo;

  const StudentAuthScaffold({
    super.key,
    required this.child,
    this.title,
    this.subtitle,
    this.showLogo = true,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 48,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (showLogo) ...[
                      const Center(child: AppLogo(size: 76)),
                      const SizedBox(height: 16),
                    ],
                    if (title != null)
                      Text(
                        title!,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        subtitle!,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                    const SizedBox(height: 24),
                    child,
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
