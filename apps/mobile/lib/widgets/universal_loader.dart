import 'dart:async';

import 'package:flutter/material.dart';

/// Global blocking loader so users know a process is ongoing.
class UniversalLoaderController extends ChangeNotifier {
  UniversalLoaderController._();
  static final UniversalLoaderController instance =
      UniversalLoaderController._();

  bool _visible = false;
  static const _loaderDelay = Duration(milliseconds: 500);
  final List<_LoaderOperation> _operations = [];
  String _message = 'Please wait…';

  bool get visible => _visible;
  String get message => _message;

  void show([String message = 'Please wait…']) {
    _message = message;
    final operation = _LoaderOperation();
    _operations.add(operation);
    operation.timer = Timer(_loaderDelay, () {
      if (!_operations.contains(operation)) return;
      operation.visible = true;
      _visible = true;
      notifyListeners();
    });
    notifyListeners();
  }

  void hide() {
    if (_operations.isEmpty) return;
    final operation = _operations.removeLast();
    operation.timer?.cancel();
    _visible = _operations.any((item) => item.visible);
    notifyListeners();
  }

  Future<T> during<T>(
    Future<T> Function() action, {
    String message = 'Please wait…',
  }) async {
    show(message);
    try {
      return await action();
    } finally {
      hide();
    }
  }
}

class _LoaderOperation {
  Timer? timer;
  bool visible = false;
}

/// Wraps the app and paints a full-screen loader when [controller] is visible.
class UniversalLoaderScope extends StatelessWidget {
  final Widget child;
  final UniversalLoaderController controller;

  const UniversalLoaderScope({
    super.key,
    required this.child,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        return Stack(
          children: [
            child,
            if (controller.visible)
              Positioned.fill(
                child: AbsorbPointer(
                  child: ColoredBox(
                    color: Colors.black.withValues(alpha: 0.45),
                    child: Center(
                      child: Material(
                        color: Colors.transparent,
                        child: Container(
                          constraints: const BoxConstraints(minWidth: 200),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 28,
                            vertical: 24,
                          ),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Theme.of(context).colorScheme.outline,
                            ),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              SizedBox(
                                width: 36,
                                height: 36,
                                child: CircularProgressIndicator(
                                  strokeWidth: 3,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                controller.message,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurface,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Process is ongoing…',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
