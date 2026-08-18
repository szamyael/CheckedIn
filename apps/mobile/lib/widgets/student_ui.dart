import 'package:flutter/material.dart';

import 'app_logo.dart';

/// Shared visual tokens aligned with the web student portal.
class StudentUi {
  static const border = Color(0xFFE2E8F0);
  static const teal = Color(0xFF0D9488);
  static const tealSoft = Color(0xFFF0FDFA);
  static const tealBorder = Color(0xFFCCFBF1);
  static const tealText = Color(0xFF115E59);
  static const muted = Color(0xFF64748B);
  static const amberBg = Color(0xFFFFFBEB);
  static const amberBorder = Color(0xFFFDE68A);
  static const amberText = Color(0xFF92400E);
  static const slateBg = Color(0xFFF1F5F9);
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: StudentUi.border),
      ),
      child: Padding(padding: padding, child: child),
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
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
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        children: [
          Icon(icon, size: 48, color: StudentUi.muted),
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Text(
        message,
        style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13),
      ),
    );
  }
}

class StudentInfoBanner extends StatelessWidget {
  final String message;
  final IconData icon;
  final Color background;
  final Color border;
  final Color foreground;
  final Widget? action;

  const StudentInfoBanner({
    super.key,
    required this.message,
    required this.icon,
    this.background = StudentUi.amberBg,
    this.border = StudentUi.amberBorder,
    this.foreground = StudentUi.amberText,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: StudentUi.tealSoft,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: StudentUi.tealBorder),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Text(
            actionLabel == null ? message : '$message\n$actionLabel',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: StudentUi.tealText,
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
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight - 48),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (showLogo) ...[
                      const Center(child: AppLogo(size: 120)),
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
