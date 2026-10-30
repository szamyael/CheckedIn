import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
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
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(_AppLifecycleSync());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(_AppLifecycleSync.instance);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return AnimatedBuilder(
      animation: AppearanceService.instance,
      builder: (context, _) => SessionActivityWrapper(
        child: UniversalLoaderScope(
          controller: UniversalLoaderController.instance,
          child: MaterialApp.router(
            title: 'CheckedIn',
            builder: (context, child) => child ?? const SizedBox.shrink(),
            theme: AppTheme.build(
              AppearanceService.instance.colorTheme,
              Brightness.light,
            ),
            darkTheme: AppTheme.build(
              AppearanceService.instance.colorTheme,
              Brightness.dark,
            ),
            themeMode: AppearanceService.instance.themeMode,
            themeAnimationDuration: reduceMotion
                ? Duration.zero
                : const Duration(milliseconds: 320),
            themeAnimationCurve: Curves.easeInOutCubic,
            routerConfig: widget.router,
          ),
        ),
      ),
    );
  }
}

class _AppLifecycleSync extends WidgetsBindingObserver {
  _AppLifecycleSync._();
  static final instance = _AppLifecycleSync._();

  factory _AppLifecycleSync() => instance;

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_refreshAndSync());
    }
  }

  Future<void> _refreshAndSync() async {
    await ConnectivityService.instance.refresh();
    await OfflineSyncService.instance.syncPending();
  }
}
