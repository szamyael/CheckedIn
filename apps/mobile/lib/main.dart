import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/env_config.dart';
import 'core/theme.dart';
import 'router.dart';
import 'services/auth_service.dart';
import 'services/connectivity_service.dart';
import 'services/offline_sync_service.dart';
import 'services/session_timeout_service.dart';
import 'widgets/universal_loader.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: '.env');

  await Supabase.initialize(
    url: EnvConfig.supabaseUrl,
    publishableKey: EnvConfig.supabaseAnonKey,
  );

  final auth = AuthService.instance..init();
  await ConnectivityService.instance.init();
  await OfflineSyncService.instance.init();

  runApp(CheckedInApp(router: createRouter(auth)));
}

class CheckedInApp extends StatelessWidget {
  final GoRouter router;

  const CheckedInApp({super.key, required this.router});

  @override
  Widget build(BuildContext context) {
    return SessionActivityWrapper(
      child: UniversalLoaderScope(
        controller: UniversalLoaderController.instance,
        child: MaterialApp.router(
          title: 'CheckedIn',
          theme: AppTheme.light,
          routerConfig: router,
        ),
      ),
    );
  }
}
