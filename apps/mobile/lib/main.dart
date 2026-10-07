import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/env_config.dart';
import 'core/theme.dart';
import 'router.dart';
import 'services/auth_service.dart';
import 'services/appearance_service.dart';
import 'services/connectivity_service.dart';
import 'services/offline_sync_service.dart';
import 'services/onboarding_service.dart';
import 'services/session_timeout_service.dart';
import 'services/terms_service.dart';
import 'services/push_notification_service.dart';
import 'widgets/universal_loader.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: '.env');

  await Supabase.initialize(
    url: EnvConfig.supabaseUrl,
    publishableKey: EnvConfig.supabaseAnonKey,
  );

  final auth = AuthService.instance..init();
  final onboarding = OnboardingService.instance;
  final terms = TermsService.instance;
  await onboarding.init();
  await terms.init();
  await AppearanceService.instance.init();
  await ConnectivityService.instance.init();
  await OfflineSyncService.instance.init();
  await PushNotificationService.instance.init();

  runApp(CheckedInApp(router: createRouter(auth, onboarding, terms)));
}

class CheckedInApp extends StatefulWidget {
  final GoRouter router;

  const CheckedInApp({super.key, required this.router});

  @override
  State<CheckedInApp> createState() => _CheckedInAppState();
}

class _CheckedInAppState extends State<CheckedInApp> {
  late final OnPushSubscriptionChangeObserver _pushSubscriptionObserver =
      _onPushSubscriptionChanged;
  bool _observerRegistered = false;
  bool _dialogScheduled = false;
  bool _dialogShown = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final service = PushNotificationService.instance;
      service.addPushSubscriptionObserver(_pushSubscriptionObserver);
      _observerRegistered = true;
      _maybeShowIntegrationDialog(service.pushSubscriptionId);
    });
  }

  @override
  void dispose() {
    if (_observerRegistered) {
      PushNotificationService.instance.removePushSubscriptionObserver(
        _pushSubscriptionObserver,
      );
    }
    super.dispose();
  }

  void _onPushSubscriptionChanged(OSPushSubscriptionChangedState state) {
    _maybeShowIntegrationDialog(state.current.id);
  }

  void _maybeShowIntegrationDialog(String? subscriptionId) {
    if (_dialogShown ||
        _dialogScheduled ||
        subscriptionId == null ||
        subscriptionId.isEmpty ||
        subscriptionId.startsWith('local-')) {
      return;
    }

    _dialogScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final context =
          widget.router.routerDelegate.navigatorKey.currentState?.overlay?.context;
      if (context == null) {
        _dialogScheduled = false;
        WidgetsBinding.instance.addPostFrameCallback(
          (_) => _maybeShowIntegrationDialog(subscriptionId),
        );
        return;
      }

      _dialogShown = true;
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Your OneSignal SDK integration is complete!'),
          content: const Text(
            'You can now send Push Notifications & In-App Messages through '
            'OneSignal. Tap below to enable push notifications.',
          ),
          actions: [
            TextButton(
              onPressed: () async {
                Navigator.of(dialogContext).pop();
                await PushNotificationService.instance.requestPermission();
              },
              child: const Text('Got it'),
            ),
          ],
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: AppearanceService.instance,
      builder: (context, _) => SessionActivityWrapper(
        child: UniversalLoaderScope(
          controller: UniversalLoaderController.instance,
          child: MaterialApp.router(
            title: 'CheckedIn',
            theme: AppTheme.build(AppearanceService.instance.colorTheme, Brightness.light),
            darkTheme: AppTheme.build(AppearanceService.instance.colorTheme, Brightness.dark),
            themeMode: AppearanceService.instance.themeMode,
            routerConfig: widget.router,
          ),
        ),
      ),
    );
  }
}
