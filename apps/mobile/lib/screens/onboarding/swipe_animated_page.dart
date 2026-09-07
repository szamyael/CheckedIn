import 'package:flutter/material.dart';

/// Keeps the native PageView swipe, then adds a restrained fade/slide to the
/// active panel so each step feels deliberate without distracting motion.
class SwipeAnimatedPage extends StatelessWidget {
  final PageController controller;
  final int index;
  final Widget child;

  const SwipeAnimatedPage({
    super.key,
    required this.controller,
    required this.index,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      child: child,
      builder: (context, child) {
        final current = controller.hasClients
            ? (controller.page ?? controller.initialPage.toDouble())
            : controller.initialPage.toDouble();
        final distance = (current - index).abs().clamp(0.0, 1.0).toDouble();
        return Opacity(
          opacity: 1 - (distance * 0.32),
          child: Transform.translate(
            offset: Offset((current - index) * 18, 0),
            child: child,
          ),
        );
      },
    );
  }
}
